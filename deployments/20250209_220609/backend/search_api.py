from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
import cv2
import numpy as np
from transformers import pipeline
from typing import List, Optional
import json
import redis
import os
from datetime import datetime
from pydantic import BaseModel
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

app = FastAPI(title="CG4F Search API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
es = Elasticsearch([os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")])
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, db=0)
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
text_generator = OpenAI(temperature=0.7)

class SearchQuery(BaseModel):
    query: str
    search_type: str = "web"
    page: int = 1
    page_size: int = 10
    filters: dict = {}

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    type: str
    timestamp: datetime
    views: int = 0
    rating: Optional[float] = None

@app.post("/api/search")
async def search(query: SearchQuery):
    try:
        # Generate embeddings for semantic search
        query_embedding = sentence_model.encode(query.query)
        
        # Prepare Elasticsearch query
        es_query = {
            "bool": {
                "must": [
                    {
                        "script_score": {
                            "query": {"match_all": {}},
                            "script": {
                                "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                                "params": {"query_vector": query_embedding.tolist()}
                            }
                        }
                    }
                ],
                "filter": []
            }
        }
        
        # Apply filters
        if query.filters:
            for key, value in query.filters.items():
                es_query["bool"]["filter"].append({"term": {key: value}})
        
        # Execute search
        response = es.search(
            index="web_content",
            body=es_query,
            from_=(query.page - 1) * query.page_size,
            size=query.page_size
        )
        
        # Process results
        results = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            result = SearchResult(
                title=source["title"],
                url=source["url"],
                snippet=source["content"][:200] + "...",
                type=source.get("type", "web"),
                timestamp=datetime.fromisoformat(source["timestamp"]),
                views=source.get("views", 0),
                rating=source.get("rating")
            )
            results.append(result)
            
            # Update view count
            redis_client.hincrby(f"stats:{source['url']}", "views", 1)
        
        return {
            "results": results,
            "total": response["hits"]["total"]["value"],
            "page": query.page,
            "page_size": query.page_size
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/image-search")
async def image_search(file: UploadFile = File(...)):
    try:
        # Read and process image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to PIL Image
        pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        
        # Get image classification
        predictions = image_classifier(pil_img)
        
        # Search for similar content
        search_terms = " ".join([p["label"] for p in predictions[:3]])
        query = SearchQuery(query=search_terms, search_type="image")
        
        return await search(query)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/suggest")
async def get_suggestions(query: str):
    try:
        # Get cached suggestions
        cache_key = f"suggestions:{query.lower()}"
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Generate suggestions using LangChain
        prompt = PromptTemplate(
            input_variables=["query"],
            template="Suggest 5 related search terms for: {query}"
        )
        chain = LLMChain(llm=text_generator, prompt=prompt)
        suggestions = chain.run(query=query).strip().split("\n")
        
        # Cache suggestions
        redis_client.setex(cache_key, 3600, json.dumps(suggestions))
        
        return suggestions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trending")
async def get_trending_searches():
    try:
        # Get trending searches from Redis
        trending = redis_client.zrevrange("trending_searches", 0, 9, withscores=True)
        return [{"query": q.decode(), "score": s} for q, s in trending]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
