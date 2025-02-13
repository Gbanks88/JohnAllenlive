#!/bin/bash

# Exit on error
set -e

# Deploy to staging bucket
echo "Deploying to staging..."
gsutil -m rsync -r ../johnallen.live gs://cool-ascent-450601-d1-fashion-staging

# Run security checks
echo "Running security checks..."
# Check for sensitive data
find ../johnallen.live -type f -exec grep -l "API_KEY\|SECRET\|PASSWORD" {} \;

# Run load testing
echo "Running load tests..."
ab -n 1000 -c 50 https://staging.johnallens.live/

# Run accessibility checks
echo "Running accessibility checks..."
pa11y https://staging.johnallens.live/

# Check SSL configuration
echo "Checking SSL configuration..."
ssllabs-scan staging.johnallens.live

# If all checks pass, proceed to production
echo "All checks passed. Ready for production deployment."
