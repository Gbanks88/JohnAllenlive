from fastapi import FastAPI, HTTPException, Request
from typing import Optional, Dict, List
import aiohttp
import asyncio
import json
import time
from datetime import datetime
import sqlite3

class GoogleSupplementService:
    def __init__(self):
        self.init_db()
        self.cache = {}
        self.GOOGLE_API_URL = "https://www.googleapis.com/customsearch/v1"
    
    def init_db(self):
        conn = sqlite3.connect('supplement_data.db')
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS query_gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                query TEXT,
                google_results INTEGER,
                our_results INTEGER,
                gap_filled BOOLEAN,
                category TEXT,
                confidence_score FLOAT
            )
        ''')
        conn.commit()
        conn.close()

    async def check_google_results(self, query: str) -> Dict:
        """Check if Google has satisfactory results for the query"""
        async with aiohttp.ClientSession() as session:
            try:
                params = {
                    'q': query,
                    'num': 5,  # Number of results to analyze
                    'key': '{{GOOGLE_API_KEY}}',
                    'cx': '{{SEARCH_ENGINE_ID}}'
                }
                async with session.get(self.GOOGLE_API_URL, params=params) as response:
                    data = await response.json()
                    
                    results = {
                        'has_results': False,
                        'confidence': 0.0,
                        'missing_aspects': []
                    }
                    
                    if 'items' in data:
                        results['has_results'] = True
                        results['confidence'] = self.analyze_result_quality(data['items'])
                        results['missing_aspects'] = self.identify_gaps(query, data['items'])
                    
                    return results
            except Exception as e:
                print(f"Error checking Google results: {e}")
                return {'has_results': False, 'confidence': 0.0, 'missing_aspects': []}

    def analyze_result_quality(self, items: List[Dict]) -> float:
        """Analyze the quality of Google's results"""
        quality_score = 0.0
        
        for item in items:
            # Check result freshness
            if 'datePublished' in item:
                date = datetime.strptime(item['datePublished'], '%Y-%m-%d')
                if (datetime.now() - date).days < 30:
                    quality_score += 0.2
            
            # Check content relevance
            if 'snippet' in item:
                if len(item['snippet']) > 100:
                    quality_score += 0.2
            
            # Check authority
            if 'displayLink' in item:
                if any(auth in item['displayLink'] for auth in ['.edu', '.gov', 'wikipedia']):
                    quality_score += 0.2
        
        return min(quality_score, 1.0)

    def identify_gaps(self, query: str, items: List[Dict]) -> List[str]:
        """Identify aspects of the query that Google results don't cover"""
        gaps = []
        key_aspects = self.extract_query_aspects(query)
        
        covered_aspects = set()
        for item in items:
            snippet = item.get('snippet', '').lower()
            for aspect in key_aspects:
                if aspect.lower() in snippet:
                    covered_aspects.add(aspect)
        
        return list(set(key_aspects) - covered_aspects)

    def extract_query_aspects(self, query: str) -> List[str]:
        """Extract key aspects that need to be addressed in the query"""
        # Simple aspect extraction based on key phrases and structure
        aspects = []
        
        # Technical aspects
        if any(tech in query.lower() for tech in ['how to', 'code', 'programming', 'error']):
            aspects.extend(['implementation', 'examples', 'common issues'])
        
        # Conceptual aspects
        if any(concept in query.lower() for concept in ['what is', 'explain', 'define']):
            aspects.extend(['definition', 'comparison', 'use cases'])
        
        # Problem-solving aspects
        if any(problem in query.lower() for problem in ['fix', 'solve', 'debug']):
            aspects.extend(['solution steps', 'troubleshooting', 'verification'])
        
        return aspects

    async def provide_supplement(self, query: str, google_results: Dict) -> Dict:
        """Provide supplementary information where Google results are lacking"""
        missing_aspects = google_results['missing_aspects']
        confidence = google_results['confidence']
        
        # Record the gap in our database
        self.record_gap(query, google_results)
        
        # Generate focused response based on missing aspects
        response = {
            'query': query,
            'supplement_type': 'enhancement' if google_results['has_results'] else 'primary',
            'confidence_score': 1.0 - confidence,
            'focused_aspects': missing_aspects,
            'response_strategy': self.determine_response_strategy(missing_aspects)
        }
        
        return response

    def determine_response_strategy(self, missing_aspects: List[str]) -> Dict:
        """Determine the best strategy to supplement the missing information"""
        strategy = {
            'approach': '',
            'priority_aspects': [],
            'suggested_sources': []
        }
        
        if 'implementation' in missing_aspects:
            strategy['approach'] = 'code_first'
            strategy['suggested_sources'] = ['documentation', 'github', 'stack_overflow']
        elif 'definition' in missing_aspects:
            strategy['approach'] = 'explain_first'
            strategy['suggested_sources'] = ['academic_papers', 'documentation']
        elif 'solution steps' in missing_aspects:
            strategy['approach'] = 'step_by_step'
            strategy['suggested_sources'] = ['troubleshooting_guides', 'issue_trackers']
        
        strategy['priority_aspects'] = sorted(missing_aspects, 
            key=lambda x: self.get_aspect_priority(x))
        
        return strategy

    def get_aspect_priority(self, aspect: str) -> int:
        """Get the priority level for different aspects"""
        priorities = {
            'implementation': 1,
            'solution steps': 2,
            'examples': 3,
            'common issues': 4,
            'definition': 5,
            'comparison': 6,
            'use cases': 7,
            'troubleshooting': 8,
            'verification': 9
        }
        return priorities.get(aspect, 10)

    def record_gap(self, query: str, google_results: Dict):
        """Record the identified gap in our database"""
        conn = sqlite3.connect('supplement_data.db')
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO query_gaps (
                timestamp, query, google_results,
                our_results, gap_filled, category, confidence_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            query,
            1 if google_results['has_results'] else 0,
            1,  # We always attempt to provide results
            True,  # Assuming we fill the gap
            self.categorize_query(query),
            1.0 - google_results['confidence']
        ))
        
        conn.commit()
        conn.close()

    def categorize_query(self, query: str) -> str:
        """Categorize the type of query"""
        query_lower = query.lower()
        
        if any(tech in query_lower for tech in ['code', 'programming', 'function', 'error']):
            return 'technical'
        elif any(concept in query_lower for concept in ['what', 'explain', 'define']):
            return 'conceptual'
        elif any(problem in query_lower for problem in ['fix', 'solve', 'issue']):
            return 'troubleshooting'
        else:
            return 'general'

# Initialize the service
supplement_service = GoogleSupplementService()
