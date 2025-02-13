#!/bin/bash

# Exit on error
set -e

PROJECT_ID="test1-157723"

# Function to get secret
get_secret() {
    local secret_name=$1
    gcloud secrets versions access latest \
        --secret="$secret_name" \
        --project="$PROJECT_ID"
}

# Get secrets from Secret Manager
echo "Retrieving secrets from Google Cloud Secret Manager..."
IBM_CLOUD_API_KEY=$(get_secret "ibm-cloud-api-key")
IBM_CLOUD_REGION=$(get_secret "ibm-cloud-region")

if [ -z "$IBM_CLOUD_API_KEY" ]; then
    echo "Error: Failed to retrieve IBM Cloud API key from Secret Manager"
    exit 1
fi

# Load configuration
CONFIG_FILE="../config/ibm-cloud-config.json"
REGION=$(jq -r '.region' $CONFIG_FILE)
RESOURCE_GROUP=$(jq -r '.resource_group' $CONFIG_FILE)

# Check for IBM Cloud CLI
if ! command -v ibmcloud &> /dev/null; then
    echo "Installing IBM Cloud CLI..."
    curl -fsSL https://clis.cloud.ibm.com/install/osx | sh
fi

# Login to IBM Cloud using API key
echo "Logging in to IBM Cloud..."
ibmcloud login --apikey "$IBM_CLOUD_API_KEY" -r "$IBM_CLOUD_REGION" || {
    echo "Error: Failed to login to IBM Cloud"
    exit 1
}

# Target resource group
ibmcloud target -g $RESOURCE_GROUP

# Install required plugins
echo "Installing required plugins..."
ibmcloud plugin install container-service
ibmcloud plugin install cloud-object-storage
ibmcloud plugin install cloud-functions
ibmcloud plugin install watson

# Set up Object Storage
echo "Setting up Cloud Object Storage..."
ibmcloud resource service-instance-create $(jq -r '.services.object_storage.name' $CONFIG_FILE) \
    cloud-object-storage $(jq -r '.services.object_storage.plan' $CONFIG_FILE)

# Set up Watson Assistant
echo "Setting up Watson Assistant..."
ibmcloud resource service-instance-create $(jq -r '.services.watson.assistant.name' $CONFIG_FILE) \
    conversation $(jq -r '.services.watson.assistant.plan' $CONFIG_FILE)

# Set up Speech to Text
echo "Setting up Speech to Text..."
ibmcloud resource service-instance-create $(jq -r '.services.watson.speech_to_text.name' $CONFIG_FILE) \
    speech-to-text $(jq -r '.services.watson.speech_to_text.plan' $CONFIG_FILE)

# Set up Cloud Functions
echo "Setting up Cloud Functions..."
ibmcloud fn namespace create $(jq -r '.services.functions.namespace' $CONFIG_FILE)

# Set up Kubernetes cluster
echo "Setting up Kubernetes cluster..."
ibmcloud ks cluster create classic \
    --name $(jq -r '.services.kubernetes.cluster_name' $CONFIG_FILE) \
    --zone dal10 \
    --workers $(jq -r '.services.kubernetes.worker_count' $CONFIG_FILE) \
    --machine-type $(jq -r '.services.kubernetes.machine_type' $CONFIG_FILE)

# Set up MongoDB
echo "Setting up MongoDB..."
ibmcloud resource service-instance-create $(jq -r '.services.databases.mongodb.name' $CONFIG_FILE) \
    databases-for-mongodb $(jq -r '.services.databases.mongodb.plan' $CONFIG_FILE)

# Create service credentials
echo "Creating service credentials..."
for service in $(ibmcloud resource service-instances --output json | jq -r '.[].name'); do
    ibmcloud resource service-key-create "${service}-key" Administrator --instance-name "$service" || true
done

# Get cluster config
echo "Getting Kubernetes cluster config..."
ibmcloud ks cluster config --cluster $(jq -r '.services.kubernetes.cluster_name' $CONFIG_FILE)

echo "IBM Cloud setup complete!"
