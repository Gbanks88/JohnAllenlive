#!/bin/bash

# Exit on any error
set -e

# Configuration
PROJECT_ID="test1-157723"
DOMAIN="johnallen.live"
BUCKET_NAME="johnallen-live-${PROJECT_ID}"
SITE_DIR="johnallen.live"
BACKEND_BUCKET="johnallen-live-backend"
LB_NAME="johnallen-live-lb"
REGION="us-central1"
SSL_CERT_NAME="johnallen-live-cert"
PROXY_NAME="${LB_NAME}-proxy"
FORWARDING_RULE_NAME="${LB_NAME}-forwarding-rule"

echo "Starting website deployment with GCP services..."

# 1. Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
    compute.googleapis.com \
    storage-api.googleapis.com \
    storage-component.googleapis.com \
    cloudresourcemanager.googleapis.com

# 2. Create a versioned deployment folder
DEPLOY_VERSION=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="deployments/${DEPLOY_VERSION}"

# 3. Create deployment directory
echo "Creating deployment directory..."
mkdir -p ${DEPLOY_DIR}
cp -r ${SITE_DIR}/* ${DEPLOY_DIR}/

# 4. Optimize assets
echo "Optimizing assets..."
if [ -d "${DEPLOY_DIR}/images" ]; then
    find ${DEPLOY_DIR}/images -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec convert {} -strip -quality 85 {} \;
fi

# 5. Create Cloud Storage bucket if it doesn't exist
echo "Setting up Cloud Storage bucket..."
if ! gsutil ls -b gs://${BUCKET_NAME} &>/dev/null; then
    gsutil mb -l ${REGION} gs://${BUCKET_NAME}
    gsutil versioning set on gs://${BUCKET_NAME}
fi

# 6. Deploy to Cloud Storage
echo "Deploying to Cloud Storage..."
gsutil -m -h "Cache-Control:public, max-age=3600" cp -r ${DEPLOY_DIR}/* gs://${BUCKET_NAME}/

# 7. Set CORS policy
echo "Setting CORS policy..."
gsutil cors set cors-policy.json gs://${BUCKET_NAME}/

# 8. Make bucket public
echo "Setting public access..."
gsutil iam ch allUsers:objectViewer gs://${BUCKET_NAME}

# 9. Create or update backend bucket
echo "Setting up backend bucket..."
if ! gcloud compute backend-buckets describe ${BACKEND_BUCKET} --project=${PROJECT_ID} &>/dev/null; then
    gcloud compute backend-buckets create ${BACKEND_BUCKET} \
        --gcs-bucket-name=${BUCKET_NAME} \
        --enable-cdn \
        --project=${PROJECT_ID}
else
    gcloud compute backend-buckets update ${BACKEND_BUCKET} \
        --gcs-bucket-name=${BUCKET_NAME} \
        --enable-cdn \
        --project=${PROJECT_ID}
fi

# 10. Set up URL map
echo "Setting up URL map..."
if ! gcloud compute url-maps describe ${LB_NAME} --project=${PROJECT_ID} &>/dev/null; then
    gcloud compute url-maps create ${LB_NAME} \
        --default-backend-bucket=${BACKEND_BUCKET} \
        --project=${PROJECT_ID}
else
    gcloud compute url-maps set-default-service ${LB_NAME} \
        --default-backend-bucket=${BACKEND_BUCKET} \
        --project=${PROJECT_ID}
fi

# 11. Set up SSL certificate
echo "Setting up SSL certificate..."
if ! gcloud compute ssl-certificates describe ${SSL_CERT_NAME} --project=${PROJECT_ID} &>/dev/null; then
    gcloud compute ssl-certificates create ${SSL_CERT_NAME} \
        --domains="${DOMAIN}" \
        --project=${PROJECT_ID}
fi

# 12. Create target HTTPS proxy
echo "Creating target HTTPS proxy..."
if ! gcloud compute target-https-proxies describe ${PROXY_NAME} --project=${PROJECT_ID} &>/dev/null; then
    gcloud compute target-https-proxies create ${PROXY_NAME} \
        --url-map=${LB_NAME} \
        --ssl-certificates=${SSL_CERT_NAME} \
        --project=${PROJECT_ID}
fi

# 13. Create forwarding rule
echo "Creating forwarding rule..."
if ! gcloud compute forwarding-rules describe ${FORWARDING_RULE_NAME} \
    --global --project=${PROJECT_ID} &>/dev/null; then
    gcloud compute forwarding-rules create ${FORWARDING_RULE_NAME} \
        --global \
        --target-https-proxy=${PROXY_NAME} \
        --ports=443 \
        --project=${PROJECT_ID}
fi

# 14. Set security headers
echo "Setting security headers..."
cat > security-headers.json << EOF
{
    "securityHeaders": {
        "strictTransportSecurity": "max-age=31536000; includeSubDomains; preload",
        "xContentTypeOptions": "nosniff",
        "xFrameOptions": "DENY",
        "xXssProtection": "1; mode=block"
    }
}
EOF

gcloud compute backend-buckets update ${BACKEND_BUCKET} \
    --security-policy=security-headers.json \
    --project=${PROJECT_ID}

# 15. Print deployment information
echo "Deployment completed successfully!"
echo "Website URL: https://${DOMAIN}"
echo "Load Balancer IP: $(gcloud compute forwarding-rules describe ${FORWARDING_RULE_NAME} --global --format='get(IPAddress)' --project=${PROJECT_ID})"
echo "Please ensure your domain DNS is pointed to the Load Balancer IP address"
