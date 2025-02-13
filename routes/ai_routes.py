from flask import Blueprint, request, jsonify
from services.ai_service import (
    ScholarshipAI,
    analyze_application_async,
    get_writing_prompts
)
import json

ai_bp = Blueprint('ai', __name__)
ai_service = ScholarshipAI()

@ai_bp.route('/api/ai/essay-feedback', methods=['POST'])
def essay_feedback():
    """Get AI feedback on a scholarship essay."""
    try:
        data = request.get_json()
        essay_text = data.get('essay')
        
        if not essay_text:
            return jsonify({'error': 'Essay text is required'}), 400
            
        feedback = ai_service.get_essay_feedback(essay_text)
        return jsonify({'feedback': feedback})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ai/essay-outline', methods=['POST'])
def essay_outline():
    """Generate an essay outline based on prompt and background."""
    try:
        data = request.get_json()
        prompt_text = data.get('prompt')
        student_background = data.get('background')
        
        if not prompt_text or not student_background:
            return jsonify({'error': 'Prompt and student background are required'}), 400
            
        outline = ai_service.generate_essay_outline(prompt_text, student_background)
        return jsonify({'outline': outline})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ai/personalize-search', methods=['POST'])
def personalize_search():
    """Get personalized scholarship recommendations."""
    try:
        data = request.get_json()
        user_profile = data.get('profile')
        
        if not user_profile:
            return jsonify({'error': 'User profile is required'}), 400
            
        recommendations = ai_service.personalize_search(user_profile)
        return jsonify({'recommendations': recommendations})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ai/analyze-application', methods=['POST'])
def analyze_application():
    """Analyze a scholarship application asynchronously."""
    try:
        data = request.get_json()
        application_data = data.get('application')
        
        if not application_data:
            return jsonify({'error': 'Application data is required'}), 400
            
        task = analyze_application_async.delay(application_data)
        return jsonify({
            'task_id': task.id,
            'message': 'Analysis started. Check status using the task ID.'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ai/writing-prompts', methods=['GET'])
def writing_prompts():
    """Get AI-generated writing prompts."""
    try:
        topic = request.args.get('topic', 'leadership')
        count = int(request.args.get('count', 5))
        
        prompts = get_writing_prompts(topic, count)
        return jsonify({'prompts': prompts})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
