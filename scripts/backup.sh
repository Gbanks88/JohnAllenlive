#!/bin/bash

# Get the date for the backup filename
DATE=$(date +%Y-%m-%d-%H-%M-%S)
PROJECT_ID=$(gcloud config get-value project)

# Backup the main site bucket to the backup bucket
gsutil -m rsync -r gs://johnallen.live-${PROJECT_ID} gs://johnallen.live-backup-${PROJECT_ID}/${DATE}

# Clean up old backups (keep last 30 days)
gsutil ls gs://johnallen.live-backup-${PROJECT_ID} | sort | head -n -30 | xargs -r gsutil -m rm -r
