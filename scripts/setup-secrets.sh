#!/bin/bash

# Exit on error
set -e

PROJECT_ID="test1-157723"
REGION="us-central1"

# Enable Secret Manager API
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo "Creating secrets in Secret Manager..."

# IBM Cloud secrets
gcloud secrets create ibm-cloud-api-key \
    --replication-policy="automatic" \
    --project="$PROJECT_ID"

gcloud secrets create ibm-cloud-region \
    --replication-policy="automatic" \
    --project="$PROJECT_ID"

gcloud secrets create openshift-server \
    --replication-policy="automatic" \
    --project="$PROJECT_ID"

gcloud secrets create openshift-token \
    --replication-policy="automatic" \
    --project="$PROJECT_ID"

# Function to safely store secret
store_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
        --data-file=- \
        --project="$PROJECT_ID"
}

# Load current credentials if they exist
if [ -f "../config/credentials.env" ]; then
    source "../config/credentials.env"
    
    # Store secrets
    if [ ! -z "$IBM_CLOUD_API_KEY" ]; then
        store_secret "ibm-cloud-api-key" "$IBM_CLOUD_API_KEY"
    fi
    
    if [ ! -z "$IBM_CLOUD_REGION" ]; then
        store_secret "ibm-cloud-region" "$IBM_CLOUD_REGION"
    fi
    
    if [ ! -z "$OPENSHIFT_SERVER" ]; then
        store_secret "openshift-server" "$OPENSHIFT_SERVER"
    fi
    
    if [ ! -z "$OPENSHIFT_TOKEN" ]; then
        store_secret "openshift-token" "$OPENSHIFT_TOKEN"
    fi
fi

# Create service account for secret access
SA_NAME="hybrid-cloud-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "Creating service account..."
gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Hybrid Cloud Service Account" \
    --project="$PROJECT_ID"

# Grant secret access
echo "Granting secret access..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

# Create and download service account key
echo "Creating service account key..."
gcloud iam service-accounts keys create "../config/service-account-key.json" \
    --iam-account="$SA_EMAIL" \
    --project="$PROJECT_ID"

echo "Secret Manager setup complete!"
