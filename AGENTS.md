# AGENTS.md

This repository is the Personal Site monorepo for a portfolio and hobby showcase deployed to AWS with a React frontend, a separate admin app, Python Lambda APIs, and Terraform-managed infrastructure.

## 1. Project split

- Public frontend: `frontend/`
  - React + TypeScript + Vite
  - Public site experience: albums, watches, fish tank, social links
  - Routing and app shell live in `frontend/src/App.tsx`
  - API config is in `frontend/src/config/api.ts`

- Admin app: `admin/`
  - Separate Vite app for authenticated content updates
  - Uses Amazon Cognito for sign-in and TOTP MFA
  - App shell and route guard logic live in `admin/src/App.tsx`

- Backend: `backend/`
  - Python Lambda handlers under `backend/personal_api_*`
  - Local dev server in `backend/dev_server.py`
  - Shared utilities live in `backend/shared/`

- Infrastructure: `terraform/`
  - AWS resources managed by Terraform
  - Main modules: `terraform/modules/app` and `terraform/modules/content`
  - CloudFront, API Gateway, S3, Lambda, DynamoDB, and Cognito are managed here

- Supporting assets: `scripts/`, `Personal Project APIs/`
  - Bruno collection for API testing and exploration
  - Migration / content scripts under `scripts/`

## 2. How to run locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python dev_server.py --profile personal
```

This runs a Flask development server at `http://localhost:5000` and maps Lambda handlers into HTTP routes.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies `/api` traffic to the backend via `frontend/vite.config.ts`.

### Admin app

```bash
cd admin
npm install
npm run dev
```

This is a separate app and is expected to be authenticated through Cognito. The production admin path is at `/admin` on the site.

### Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

The project expects AWS credentials and Terraform state resources already configured as described in `terraform/README.md`.

## 3. Deployment model

The repository uses GitHub label-driven deploy workflows and Terraform-managed AWS infrastructure.

Key deployment behavior from the repo-level docs:

- `deploy-frontend` builds and deploys the public frontend
- `deploy-admin` builds and deploys the admin app
- `deploy-backend` packages and deploys Lambda functions
- `deploy-terraform` runs Terraform plan or apply flow

Production-facing infrastructure is fronted by CloudFront and Cloudflare, with the frontend and admin apps stored in S3 and served behind CloudFront.

## 4. Architectural requirements and constraints

Follow these repo-level constraints when changing the system:

- Keep the public frontend and admin app separate.
- Do not couple the frontend directly to AWS or DynamoDB. Use the Lambda-backed API layer.
- Preserve the content/CDN split: `/cdn/*` files remain served from S3-backed content buckets.
- Keep Terraform as the source of truth for AWS infrastructure.
- If you add a new public route, also update route filters and metrics logic when relevant.
- If you add a new admin API or change a route, keep the corresponding Lambda and docs in sync.

For design decisions and required architectural constraints, see:

- `docs/architecture/ADRs.md`
- `docs/architecture/README.md`

## 5. Documentation map

Start here:

- `docs/README.md` — top-level documentation index
- `docs/api/README.md` and `docs/api/openapi.yaml` — API contract, purpose, and response shapes
- `docs/frontend/README.md` — public frontend architecture and routes
- `docs/backend/README.md` — Lambda APIs and local server behavior
- `docs/admin/README.md` — admin app and auth flow
- `docs/terraform/README.md` — infrastructure responsibilities
- `docs/architecture/ADRs.md` — architecture principles and decisions

## 6. Important implementation notes

### Analytics and unique visitors

The admin analytics logic lives in `backend/personal_api_metrics/handler.py`.

The current implementation counts unique visitors using CloudFront logs by counting distinct source IP values (`COUNT(DISTINCT c_ip)`) from `cloudfront_logs` for the query window. This is the source of the `uniqueVisitors` metric shown in the admin dashboard.

The public page metrics are also filtered by route to exclude API and CDN traffic and to focus on SPA pages.

### Admin auth

The admin app requires Cognito authentication with TOTP MFA. The setup flow is documented in `README.md` and is expected to be configured as part of Terraform deployment.

### CDN/content paths

Content is served via the CDN under `/cdn/*` and mapped to S3 buckets for albums, watches, and fishtank assets.

## 7. Working guidance for agents

When making changes:

1. Identify which layer owns the behavior: frontend, admin, backend, or Terraform.
2. Prefer the closest existing pattern in the repo before inventing a new architecture.
3. Keep docs in sync with behavior changes.
4. Preserve local development workflows and AWS deployment assumptions.
5. If a change impacts architecture, update the ADRs and relevant docs before or alongside the code change.

## 8. Useful repo references

- Root project overview: `README.md`
- Deployment notes: `NEXT_STEPS.md`
- Frontend entry point: `frontend/src/App.tsx`
- Frontend API config: `frontend/src/config/api.ts`
- Local API shim: `backend/dev_server.py`
- Metrics logic: `backend/personal_api_metrics/handler.py`
- Admin entry point: `admin/src/App.tsx`
- Terraform root: `terraform/`
