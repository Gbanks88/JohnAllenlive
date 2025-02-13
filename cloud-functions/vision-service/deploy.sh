#!/bin/bash

# Exit on any error
set -e

# Configuration
PROJECT_ID="test1-157723"
REGION="us-central1"
FUNCTION_NAME="analyze-image"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable vision.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Deploy the function
echo "Deploying Cloud Function..."
gcloud functions deploy ${FUNCTION_NAME} \
    --runtime python311 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --memory 512MB \
    --timeout 60s \
    --min-instances 0 \
    --max-instances 10 \
    --entry-point analyze_image

echo "Deployment complete!"
echo "Function URL: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
