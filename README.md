# Multi-Site Projects

This repository contains multiple web projects:

## 1. GCP Multi-Site Setup

Infrastructure and configuration for deploying two websites on Google Cloud Platform:
- CG4F.site
- notcheapnot2expensive.com

### Prerequisites
1. Google Cloud Platform account
2. Registered domains for both sites
3. gcloud CLI installed
4. Terraform installed (for infrastructure as code)

### Project Structure
```
.
├── terraform/           # Infrastructure as Code
├── cg4f-site/          # CG4F website files
├── notcheap-site/      # notcheapnot2expensive website files
└── scripts/            # Deployment scripts
```

### Initial Setup
1. Create a new GCP project
2. Enable required APIs:
   - Cloud Run
   - Cloud Storage
   - Cloud DNS
   - Cloud Build
   - Container Registry
3. Configure domain DNS settings
4. Set up SSL certificates

## 2. Advanced Scholarship Search Engine

A modern web application that helps students find scholarships matching their profile and requirements.

### Features
- Advanced search filters (field of study, award amount, deadline, etc.)
- Detailed scholarship information
- User-friendly interface
- Responsive design

### Setup
1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open http://localhost:5000 in your browser

### Technology Stack
- Backend: Python/Flask
- Database: SQLAlchemy
- Frontend: HTML5, CSS3, JavaScript
- UI Framework: Bootstrap 5
