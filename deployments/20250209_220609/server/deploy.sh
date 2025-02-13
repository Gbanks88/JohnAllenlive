#!/bin/bash

# Build and deploy to Google Cloud Run
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/cg4f-server

gcloud run deploy cg4f-server \
    --image gcr.io/$GOOGLE_CLOUD_PROJECT/cg4f-server \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
