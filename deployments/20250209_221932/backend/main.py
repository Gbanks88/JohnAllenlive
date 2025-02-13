from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import time
from fastapi.responses import JSONResponse
from fastapi import Response
from google_supplement import supplement_service
import sqlite3
import re
from security_monitor import security_monitor
from ai_copilot import ai_copilot

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Opportunity(BaseModel):
    id: str
    title: str
    description: str
    category: str
    examples: List[str]

# In-memory storage (replace with database in production)
opportunities = [
    {
        "id": "dev-ai-apps",
        "title": "AI Application Development",
        "description": "Create custom AI applications for businesses and consumers",
        "category": "development",
        "examples": [
            "Natural Language Processing Apps",
            "Computer Vision Solutions",
            "Predictive Analytics Tools"
        ]
    },
    {
        "id": "ai-consulting",
        "title": "AI Consulting Services",
        "description": "Provide expert guidance on AI implementation and strategy",
        "category": "consulting",
        "examples": [
            "AI Strategy Development",
            "Implementation Planning",
            "AI Training Programs"
        ]
    }
]

# Track ML usage for each query
@app.middleware("http")
async def track_ml_request(request: Request, call_next):
    if request.url.path.startswith("/api"):
        # Calculate estimated tokens and cost
        request_data = await request.json()
        text_length = len(str(request_data))
        estimated_tokens = text_length // 4  # Rough estimate
        
        tracking_data = {
            'model_name': request_data.get('model', 'gpt-3.5'),
            'query_type': request.url.path,
            'tokens_used': estimated_tokens,
            'processing_time': 0,  # Will be updated after request
            'success_rate': 1.0,
            'cost': estimated_tokens * 0.00001,  # $0.01 per 1000 tokens
            'user_feedback': 0
        }
        
        request.state.start_time = time.time()
        request.state.tracking_data = tracking_data

    response = await call_next(request)

    if hasattr(request.state, 'start_time') and hasattr(request.state, 'tracking_data'):
        # Update processing time
        request.state.tracking_data['processing_time'] = time.time() - request.state.start_time
        
        # Update success rate based on response
        if response.status_code == 200:
            request.state.tracking_data['success_rate'] = 1.0
        else:
            request.state.tracking_data['success_rate'] = 0.0
        
        # Track the ML usage
        import requests
        requests.post(
            'http://localhost:5000/api/ml/track',
            json=request.state.tracking_data
        )
    
    return response

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Analyze request for security threats
    threat_analysis = await security_monitor.analyze_request(request)
    
    # Block high-threat requests
    if threat_analysis.get('confidence_score', 0) > 0.85:
        return JSONResponse(
            status_code=403,
            content={
                "error": "Access denied",
                "reason": "Security threat detected",
                "request_id": threat_analysis['request_id']
            }
        )
    
    # Add security headers
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AI Opportunities API"}

@app.get("/api/opportunities")
async def get_opportunities(category: Optional[str] = None):
    if category:
        filtered = [opp for opp in opportunities if opp["category"] == category]
        return filtered
    return opportunities

@app.get("/api/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    for opp in opportunities:
        if opp["id"] == opportunity_id:
            return opp
    raise HTTPException(status_code=404, detail="Opportunity not found")

@app.post("/api/opportunities")
async def create_opportunity(opportunity: Opportunity):
    opportunities.append(opportunity.dict())
    return opportunity

@app.put("/api/opportunities/{opportunity_id}")
async def update_opportunity(opportunity_id: str, opportunity: Opportunity):
    for i, opp in enumerate(opportunities):
        if opp["id"] == opportunity_id:
            opportunities[i] = opportunity.dict()
            return opportunity
    raise HTTPException(status_code=404, detail="Opportunity not found")

@app.delete("/api/opportunities/{opportunity_id}")
async def delete_opportunity(opportunity_id: str):
    for i, opp in enumerate(opportunities):
        if opp["id"] == opportunity_id:
            return opportunities.pop(i)
    raise HTTPException(status_code=404, detail="Opportunity not found")

@app.post("/api/search")
async def search(query: str, request: Request):
    # Security check and input sanitization
    if not query or len(query) > 1000:
        raise HTTPException(status_code=400, detail="Invalid query")
    query = re.sub(r'[<>{}[\]\\]', '', query)
    
    # Get enhanced search results with AI Copilot
    enhanced_results = await ai_copilot.enhanced_search(query)
    
    # Check if we need to supplement Google's results
    if enhanced_results['ai_insights']['query_intent']['primary_intent'] == 'technical':
        # For technical queries, prioritize our AI-enhanced results
        supplement = await supplement_service.provide_supplement(
            query,
            {'confidence': enhanced_results.get('web_results', [{}])[0].get('quality_score', 0)}
        )
        enhanced_results['supplementary_info'] = supplement
    
    # Add security context
    security_context = await security_monitor.analyze_request(request)
    if security_context['confidence_score'] < 0.85:  # Safe request
        enhanced_results['security_verified'] = True
        
    return enhanced_results

@app.get("/api/search/insights")
async def get_search_insights():
    """Get insights about search patterns and performance"""
    return {
        'ai_insights': await ai_copilot.get_performance_metrics(),
        'security_insights': await security_monitor.get_security_insights(),
        'supplement_stats': await supplement_service.get_gap_analytics()
    }

@app.post("/api/search/feedback")
async def submit_search_feedback(
    query: str,
    helpful: bool,
    feedback_type: str = None,
    comments: str = None
):
    """Submit feedback for search results"""
    await ai_copilot.learn_from_feedback(query, helpful, feedback_type, comments)
    return {"status": "success", "message": "Feedback recorded"}

@app.get("/api/gaps/analytics")
async def get_gap_analytics():
    """Get analytics about the gaps we're filling in Google's results"""
    conn = sqlite3.connect('supplement_data.db')
    c = conn.cursor()
    
    # Get gap statistics
    c.execute('''
        SELECT 
            category,
            COUNT(*) as total_queries,
            AVG(confidence_score) as avg_confidence,
            SUM(CASE WHEN gap_filled THEN 1 ELSE 0 END) as gaps_filled
        FROM query_gaps
        GROUP BY category
    ''')
    
    categories = []
    for row in c.fetchall():
        categories.append({
            "category": row[0],
            "total_queries": row[1],
            "avg_confidence": row[2],
            "gaps_filled": row[3]
        })
    
    # Get trending gaps
    c.execute('''
        SELECT query, COUNT(*) as frequency
        FROM query_gaps
        WHERE timestamp > datetime('now', '-7 days')
        GROUP BY query
        ORDER BY frequency DESC
        LIMIT 10
    ''')
    
    trending_gaps = [{
        "query": row[0],
        "frequency": row[1]
    } for row in c.fetchall()]
    
    conn.close()
    
    return {
        "categories": categories,
        "trending_gaps": trending_gaps
    }

@app.get("/api/security/insights")
async def get_security_insights():
    """Get security monitoring insights"""
    return await security_monitor.get_security_insights()
