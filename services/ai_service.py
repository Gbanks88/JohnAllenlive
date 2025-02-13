import os
from openai import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from celery import Celery
import redis
import json

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize Redis for caching
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0
)

# Initialize Celery for background tasks
celery = Celery('ai_service',
                broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'))

class ScholarshipAI:
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.7,
            max_tokens=2000
        )
        self.memory = ConversationBufferMemory()
        self.conversation = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            verbose=True
        )

    def get_essay_feedback(self, essay_text):
        """Provide feedback on scholarship essays."""
        prompt = f"""
        Please analyze this scholarship essay and provide detailed feedback:
        
        Essay: {essay_text}
        
        Provide feedback on:
        1. Structure and organization
        2. Clarity and coherence
        3. Grammar and style
        4. Impact and persuasiveness
        5. Specific improvement suggestions
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    def generate_essay_outline(self, prompt_text, student_background):
        """Generate an essay outline based on the prompt and student background."""
        prompt = f"""
        Create a detailed essay outline for a scholarship application:
        
        Prompt: {prompt_text}
        Student Background: {student_background}
        
        Provide:
        1. Main thesis/argument
        2. Key points to cover
        3. Supporting evidence suggestions
        4. Potential personal anecdotes to include
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    def personalize_search(self, user_profile):
        """Personalize scholarship recommendations based on user profile."""
        cache_key = f"recommendations:{hash(json.dumps(user_profile, sort_keys=True))}"
        cached_results = redis_client.get(cache_key)
        
        if cached_results:
            return json.loads(cached_results)
            
        prompt = f"""
        Based on this student profile, suggest scholarship search strategies:
        
        Profile: {json.dumps(user_profile, indent=2)}
        
        Provide:
        1. Recommended fields of study to search
        2. Relevant keywords
        3. Types of scholarships to prioritize
        4. Specific eligibility criteria to focus on
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        recommendations = response.choices[0].message.content
        redis_client.setex(cache_key, 3600, json.dumps(recommendations))  # Cache for 1 hour
        return recommendations

@celery.task
def analyze_application_async(application_data):
    """Asynchronously analyze a scholarship application."""
    ai = ScholarshipAI()
    prompt = f"""
    Analyze this scholarship application and provide improvement suggestions:
    
    Application: {json.dumps(application_data, indent=2)}
    
    Provide:
    1. Overall assessment
    2. Strengths
    3. Areas for improvement
    4. Specific recommendations
    5. Competitiveness rating (1-10)
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def get_writing_prompts(topic, count=5):
    """Generate creative writing prompts for scholarship essays."""
    prompt = f"""
    Generate {count} unique and thought-provoking scholarship essay prompts about:
    
    Topic: {topic}
    
    For each prompt, provide:
    1. The main question
    2. Key points to consider
    3. Potential angles to explore
    4. What the prompt helps reveal about the applicant
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
