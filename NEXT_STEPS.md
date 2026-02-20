# Next Development Steps

## Backend & Infrastructure

### 1. Backend Development
- [ ] Code backend using raw AWS Lambdas
- [ ] Implement API endpoints for:
  - Watches data
  - Albums data
  - Timeline events
  - Fish tank residents
  - Recently updated content

### 2. Infrastructure (Terraform)
- [ ] Set up Terraform configuration for multi-environment deployment
- [ ] Create **stage** environment
- [ ] Create **prod** environment
- [ ] Configure environment-specific variables
- [ ] Set up DynamoDB tables for both environments
- [ ] Configure S3 buckets for both environments
- [ ] Set up API Gateway for both environments

### 3. CI/CD Workflows
- [ ] Create GitHub Actions workflow for **stage** deployment
- [ ] Create GitHub Actions workflow for **prod** deployment
- [ ] Set up automated testing before deployment
- [ ] Configure deployment triggers (e.g., push to dev → stage, merge to main → prod)

## Notes
- Current frontend is on `dev` branch with 10 commits ready for review
- Backend API currently points to existing AWS endpoints
- Need to update frontend API endpoints once new infrastructure is deployed
