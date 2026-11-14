# Documentation Index

This directory is the starting point for project-specific documentation. Use it as a navigational map for the different layers of the app.

## Project overview

This monorepo contains four main concerns:

- Public frontend for the site
- Separate admin app for content management
- Python Lambda APIs for data access
- Terraform deployment and AWS infrastructure

## Start here

- [Architecture decisions](architecture/README.md)
- [API contract docs](api/README.md)
- [Operations and release guide](operations/README.md)
- [Content authoring guide](content/README.md)
- [Data model guide](data-models/README.md)
- [Public frontend](frontend/README.md)
- [Backend APIs](backend/README.md)
- [Admin app](admin/README.md)
- [Terraform infrastructure](terraform/README.md)

## Quick reference

### Local development

```bash
# backend
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python dev_server.py --profile personal

# frontend
cd frontend && npm install && npm run dev

# admin
cd admin && npm install && npm run dev

# terraform
cd terraform && terraform init && terraform plan
```

### Deployment

The repository uses label-triggered deployment workflows described in the root `README.md`.

Key deployment labels:

- `deploy-frontend`
- `deploy-admin`
- `deploy-backend`
- `deploy-terraform`

## Repo map

- `README.md` — root project overview and deployment summary
- `NEXT_STEPS.md` — future development checklist
- `frontend/` — public site app
- `admin/` — authenticated editorial tooling
- `backend/` — serverless API handlers
- `terraform/` — infrastructure as code
- `scripts/` — content and maintenance scripts
- `Personal Project APIs/` — Bruno API collection for manual testing

## Documentation conventions

- Treat architecture decisions as living constraints.
- Keep the docs in sync with route additions, Lambda updates, admin API changes, and Terraform changes.
- Prefer reading the nearest README/index before diving into code.
