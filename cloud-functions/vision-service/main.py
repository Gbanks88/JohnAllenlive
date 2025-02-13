from google.cloud import vision
import functions_framework
from flask import jsonify
import os

@functions_framework.http
def analyze_image(request):
    """
    Cloud Function to analyze images using Vision AI.
    Handles product image analysis for features like:
    - Label detection
    - Object detection
    - Color analysis
    - Similar product matching
    """
    
    # Set CORS headers
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    try:
        request_json = request.get_json()
        if not request_json or 'image_url' not in request_json:
            return jsonify({'error': 'No image URL provided'}), 400, headers

        # Initialize Vision client
        client = vision.ImageAnnotatorClient()
        image = vision.Image()
        image.source.image_uri = request_json['image_url']

        # Perform multiple analyses in parallel
        features = [
            {'type_': vision.Feature.Type.LABEL_DETECTION},
            {'type_': vision.Feature.Type.OBJECT_LOCALIZATION},
            {'type_': vision.Feature.Type.IMAGE_PROPERTIES},
            {'type_': vision.Feature.Type.PRODUCT_SEARCH},
        ]

        # Batch analyze image
        request = vision.AnnotateImageRequest(
            image=image,
            features=[vision.Feature(**feature) for feature in features]
        )
        response = client.annotate_image(request=request)

        # Process results
        result = {
            'labels': [{
                'description': label.description,
                'score': label.score,
                'topicality': label.topicality
            } for label in response.label_annotations],
            
            'objects': [{
                'name': obj.name,
                'score': obj.score,
                'bbox': {
                    'x': obj.bounding_poly.normalized_vertices[0].x,
                    'y': obj.bounding_poly.normalized_vertices[0].y,
                    'width': obj.bounding_poly.normalized_vertices[2].x - obj.bounding_poly.normalized_vertices[0].x,
                    'height': obj.bounding_poly.normalized_vertices[2].y - obj.bounding_poly.normalized_vertices[0].y
                }
            } for obj in response.localized_object_annotations],
            
            'colors': [{
                'red': color.color.red,
                'green': color.color.green,
                'blue': color.color.blue,
                'score': color.score,
                'pixel_fraction': color.pixel_fraction
            } for color in response.image_properties_annotation.dominant_colors.colors],
            
            'metadata': {
                'width': response.crop_hints_annotation.crop_hints[0].bounding_poly.vertices[2].x if response.crop_hints_annotation else None,
                'height': response.crop_hints_annotation.crop_hints[0].bounding_poly.vertices[2].y if response.crop_hints_annotation else None,
            }
        }

        return jsonify(result), 200, headers

    except Exception as e:
        return jsonify({'error': str(e)}), 500, headers
