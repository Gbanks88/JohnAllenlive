from google.cloud import vision
from google.cloud import language_v1
from google.cloud import translate_v2
from google.cloud import aiplatform
from flask import Flask, request, jsonify
from flask_cors import CORS
import functions_framework

app = Flask(__name__)
CORS(app)

# Initialize clients
vision_client = vision.ImageAnnotatorClient()
language_client = language_v1.LanguageServiceClient()
translate_client = translate_v2.Client()

@functions_framework.http
def ai_services(request):
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for main requests
    headers = {'Access-Control-Allow-Origin': '*'}

    # Get the path from the request URL
    path = request.path.strip('/')

    if path == 'vision':
        return handle_vision_request(request)
    elif path == 'nlp/sentiment':
        return handle_nlp_request(request)
    elif path == 'translate':
        return handle_translate_request(request)
    elif path == 'recommendations':
        return handle_recommendations_request(request)
    else:
        return jsonify({'error': 'Invalid endpoint'}), 404, headers

def handle_vision_request(request):
    """Handle Vision AI requests"""
    request_json = request.get_json()
    image_url = request_json.get('imageUrl')
    
    if not image_url:
        return jsonify({'error': 'No image URL provided'}), 400

    try:
        image = vision.Image()
        image.source.image_uri = image_url
        
        # Perform label detection
        response = vision_client.label_detection(image=image)
        labels = response.label_annotations

        # Perform object detection
        objects = vision_client.object_localization(image=image).localized_object_annotations

        return jsonify({
            'labels': [{'description': label.description, 'score': label.score} for label in labels],
            'objects': [{'name': obj.name, 'confidence': obj.score} for obj in objects]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_nlp_request(request):
    """Handle Natural Language Processing requests"""
    request_json = request.get_json()
    text = request_json.get('text')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        document = language_v1.Document(
            content=text,
            type_=language_v1.Document.Type.PLAIN_TEXT
        )
        
        # Analyze sentiment
        sentiment = language_client.analyze_sentiment(document=document)
        
        # Analyze entities
        entities = language_client.analyze_entities(document=document)

        return jsonify({
            'sentiment': {
                'score': sentiment.document_sentiment.score,
                'magnitude': sentiment.document_sentiment.magnitude
            },
            'entities': [{
                'name': entity.name,
                'type': language_v1.Entity.Type(entity.type_).name,
                'salience': entity.salience
            } for entity in entities.entities]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_translate_request(request):
    """Handle Translation requests"""
    request_json = request.get_json()
    text = request_json.get('text')
    target_language = request_json.get('targetLanguage')
    
    if not text or not target_language:
        return jsonify({'error': 'Missing text or target language'}), 400

    try:
        result = translate_client.translate(
            text,
            target_language=target_language
        )

        return jsonify({
            'translatedText': result['translatedText'],
            'detectedSourceLanguage': result['detectedSourceLanguage']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_recommendations_request(request):
    """Handle Recommendations requests using Vertex AI"""
    request_json = request.get_json()
    user_id = request_json.get('userId')
    product_id = request_json.get('productId')
    
    if not user_id or not product_id:
        return jsonify({'error': 'Missing user ID or product ID'}), 400

    try:
        # Initialize Vertex AI
        aiplatform.init(project='test1-157723', location='us-central1')
        
        # Get recommendations (you'll need to replace this with your actual model endpoint)
        endpoint = aiplatform.Endpoint('YOUR_ENDPOINT_ID')
        response = endpoint.predict([{
            'user_id': user_id,
            'product_id': product_id
        }])

        return jsonify({
            'recommendations': response.predictions
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
