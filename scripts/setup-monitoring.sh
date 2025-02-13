#!/bin/bash

# Exit on error
set -e

PROJECT_ID="test1-157723"
REGION="us-central1"

# Enable required APIs
echo "Enabling monitoring APIs..."
gcloud services enable \
    monitoring.googleapis.com \
    cloudtrace.googleapis.com \
    clouderrorreporting.googleapis.com \
    cloudprofiler.googleapis.com

# Create uptime check
echo "Creating uptime check..."
gcloud monitoring uptime-check-configs create connecting-global-uptime \
    --display-name="connecting-global-uptime" \
    --http-check-path="/" \
    --ports=443 \
    --check-interval=60s \
    --timeout=10s \
    --content-matcher-content="Welcome" \
    --selected-regions="us-central1,us-east1,us-west1" \
    --protocol=HTTPS \
    --hostname="connecting-global.com"

# Set up log-based metrics
echo "Setting up log-based metrics..."
gcloud logging metrics create cdn-cache-hit-rate \
    --description="CDN cache hit rate" \
    --log-filter="resource.type=http_load_balancer AND jsonPayload.statusDetails=response_sent_by_backend"

# Create alert policies
echo "Creating alert policies..."
gcloud alpha monitoring policies create \
    --display-name="High Error Rate" \
    --condition-filter="metric.type=\"loadbalancing.googleapis.com/https/request_count\" AND resource.type=\"https_lb_rule\" AND metric.labels.response_code_class=\"500\"" \
    --condition-threshold-value=10 \
    --condition-threshold-duration=300s \
    --notification-channels="email"

# Enable Cloud Trace sampling
echo "Configuring Cloud Trace..."
gcloud trace settings update --sampling-rate=0.1

# Set up log exports to BigQuery
echo "Setting up log exports..."
bq mk --dataset \
    --description "Website logs dataset" \
    ${PROJECT_ID}:website_logs

# Create log sink
gcloud logging sinks create website-logs-sink \
    bigquery.googleapis.com/projects/${PROJECT_ID}/datasets/website_logs \
    --log-filter="resource.type=http_load_balancer"

# Set up automated backups
echo "Setting up automated backups..."
BACKUP_BUCKET="${PROJECT_ID}-backups"
gsutil mb -l ${REGION} gs://${BACKUP_BUCKET} || true
gsutil versioning set on gs://${BACKUP_BUCKET}

# Create Cloud Scheduler job for daily backups
gcloud scheduler jobs create http daily-backup \
    --schedule="0 0 * * *" \
    --uri="https://storage.googleapis.com/storage/v1/b/${PROJECT_ID}/o/sync" \
    --http-method=POST \
    --message-body="{\"source\":\"gs://cg4f-site-${PROJECT_ID}/*\",\"destination\":\"gs://${BACKUP_BUCKET}/$(date +%Y%m%d)/\"}" \
    --oauth-service-account-email="${PROJECT_ID}@appspot.gserviceaccount.com"

echo "Monitoring and backup setup complete!"
