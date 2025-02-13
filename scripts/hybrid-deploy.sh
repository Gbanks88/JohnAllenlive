#!/bin/bash

# Exit on error
set -e

# Run GCP deployment
echo "Running GCP deployment..."
./deploy.sh

# Run IBM Cloud setup
echo "Running IBM Cloud setup..."
./ibm-cloud-setup.sh

# Set up cross-cloud networking
echo "Setting up cross-cloud networking..."

# Sync data to IBM Cloud Object Storage
echo "Setting up data sync with IBM Cloud Object Storage..."
BUCKET_NAME="johnallen-live-test1-157723"
IBM_BUCKET="johnallen-live-backup"

gsutil rsync -r gs://$BUCKET_NAME ibm://$IBM_BUCKET

# Deploy Watson integration
echo "Deploying Watson integration..."
kubectl apply -f ../kubernetes/watson-integration.yaml

# Set up monitoring
echo "Setting up cross-cloud monitoring..."
kubectl apply -f ../kubernetes/monitoring.yaml

echo "Hybrid cloud deployment complete!"
