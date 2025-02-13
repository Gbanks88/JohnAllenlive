from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
import openai
from elasticsearch import AsyncElasticsearch
import redis
from datetime import datetime
import os
from langchain.llms import OpenAI
from langchain.chains import ConversationalRetrievalQA
from langchain.memory import ConversationBufferMemory
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import ElasticVectorSearch
from models import User
from social_api import get_current_user

app = FastAPI(title="CG4F Conversational Search")

# Initialize services
es = AsyncElasticsearch([os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")])
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, db=0)
openai.api_key = os.getenv("OPENAI_API_KEY")

class SearchQuery(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    context: Optional[Dict] = None

class SearchResponse(BaseModel):
    answer: str
    sources: List[Dict]
    suggested_queries: List[str]
    related_topics: List[str]
    social_context: Optional[Dict] = None

class ConversationState(BaseModel):
    conversation_id: str
    messages: List[Dict]
    context: Dict
    last_updated: datetime

async def get_conversation_state(conversation_id: str) -> Optional[ConversationState]:
    state = await redis_client.get(f"conversation:{conversation_id}")
    if state:
        return ConversationState.parse_raw(state)
    return None

async def update_conversation_state(state: ConversationState):
    await redis_client.setex(
        f"conversation:{state.conversation_id}",
        3600,  # 1 hour expiry
        state.json()
    )

def create_prompt(query: str, context: Dict = None) -> str:
    base_prompt = f"""You are CG4F, an advanced AI search assistant. Answer the following question 
    based on the provided context and your knowledge. Be concise, accurate, and helpful.
    
    Question: {query}
    """
    
    if context:
        base_prompt += f"\nContext: {context}"
    
    return base_prompt

async def get_relevant_documents(query: str, user: User = None) -> List[Dict]:
    # Search across multiple indices
    indices = ["web_content", "social_posts"]
    results = []
    
    for index in indices:
        response = await es.search(
            index=index,
            body={
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["content", "title", "description"],
                        "fuzziness": "AUTO"
                    }
                },
                "size": 5
            }
        )
        results.extend(response["hits"]["hits"])
    
    # Sort by relevance
    results.sort(key=lambda x: x["_score"], reverse=True)
    
    return [doc["_source"] for doc in results[:5]]

async def generate_suggested_queries(query: str, results: List[Dict]) -> List[str]:
    # Combine query and search results for context
    context = "\n".join([doc.get("content", "") for doc in results])
    
    prompt = f"""Based on the following search query and results, suggest 3 related queries:
    Query: {query}
    Context: {context[:500]}  # Limit context length
    
    Suggestions:"""
    
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=100
    )
    
    suggestions = response.choices[0].message.content.strip().split("\n")
    return [s.strip("123. ") for s in suggestions]

@app.post("/api/conversational-search", response_model=SearchResponse)
async def conversational_search(
    query: SearchQuery,
    current_user: User = Depends(get_current_user)
):
    try:
        # Get or create conversation state
        state = None
        if query.conversation_id:
            state = await get_conversation_state(query.conversation_id)
        
        # Get relevant documents
        documents = await get_relevant_documents(query.query, current_user)
        
        # Create search context
        search_context = {
            "documents": documents,
            "user_context": {
                "preferences": current_user.dict(),
                "recent_searches": await redis_client.lrange(
                    f"user:{current_user.id}:recent_searches",
                    0, 5
                )
            }
        }
        
        if state:
            search_context["conversation_history"] = state.messages
        
        # Generate answer using GPT-4
        prompt = create_prompt(query.query, search_context)
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        
        # Generate suggested queries
        suggested_queries = await generate_suggested_queries(query.query, documents)
        
        # Get related topics from social context
        related_topics = await get_social_context(query.query, current_user)
        
        # Update conversation state
        if state:
            state.messages.append({
                "role": "user",
                "content": query.query
            })
            state.messages.append({
                "role": "assistant",
                "content": answer
            })
            state.last_updated = datetime.utcnow()
            await update_conversation_state(state)
        
        # Update user's recent searches
        await redis_client.lpush(
            f"user:{current_user.id}:recent_searches",
            query.query
        )
        await redis_client.ltrim(
            f"user:{current_user.id}:recent_searches",
            0, 9  # Keep only last 10 searches
        )
        
        return SearchResponse(
            answer=answer,
            sources=[{
                "title": doc.get("title", ""),
                "url": doc.get("url", ""),
                "snippet": doc.get("content", "")[:200]
            } for doc in documents],
            suggested_queries=suggested_queries,
            related_topics=related_topics,
            social_context=search_context.get("user_context")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_social_context(query: str, user: User) -> List[str]:
    """Get related topics from social posts and user interactions"""
    try:
        # Search social posts
        response = await es.search(
            index="social_posts",
            body={
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["content", "hashtags"],
                        "fuzziness": "AUTO"
                    }
                },
                "aggs": {
                    "popular_hashtags": {
                        "terms": {
                            "field": "hashtags",
                            "size": 5
                        }
                    }
                },
                "size": 0
            }
        )
        
        # Extract hashtags from aggregations
        hashtags = [
            bucket["key"]
            for bucket in response["aggregations"]["popular_hashtags"]["buckets"]
        ]
        
        return hashtags
        
    except Exception as e:
        print(f"Error getting social context: {str(e)}")
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
