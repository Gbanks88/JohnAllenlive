# GCP Multi-Site Setup

This project contains the infrastructure and configuration for deploying two websites on Google Cloud Platform:
- CG4F.site
- notcheapnot2expensive.com

## Prerequisites
1. Google Cloud Platform account
2. Registered domains for both sites
3. gcloud CLI installed
4. Terraform installed (for infrastructure as code)

## Project Structure
```
.
├── terraform/           # Infrastructure as Code
├── cg4f-site/          # CG4F website files
├── notcheap-site/      # notcheapnot2expensive website files
└── scripts/            # Deployment scripts
```

## Initial Setup
1. Create a new GCP project
2. Enable required APIs:
   - Cloud Run
   - Cloud Storage
   - Cloud DNS
   - Cloud Build
   - Container Registry
3. Configure domain DNS settings
4. Set up SSL certificates

## Deployment
Instructions for deployment will be added once the initial infrastructure is set up.
