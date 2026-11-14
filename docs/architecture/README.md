# Architecture Overview

This folder captures the architecture rules and design assumptions for the repository.

## Primary architectural split

1. Public frontend is a Vite React app.
2. Admin is a separate authenticated React app.
3. Backend APIs are Python Lambda functions behind API Gateway.
4. AWS resources are provisioned with Terraform.
5. Content/media is served through S3 and CloudFront via `/cdn/*` paths.

## Main references

- Root overview: `../../README.md`
- Architecture decision log: `ADRs.md`
- Backend APIs: `../backend/README.md`
- Frontend notes: `../frontend/README.md`
- Admin notes: `../admin/README.md`
- Terraform docs: `../terraform/README.md`

## Architectural principles

- Keep content and presentation layers distinct from infrastructure.
- Use the Lambda/API layer as the contract boundary between frontend/admin and data sources.
- Prefer Terraform for deployed AWS state; keep runtime code and infrastructure definitions separate.
- Do not mix public and admin business logic in a single app unless there is an explicit reason.
- Treat CloudFront logs and Athena metrics as the source of truth for admin analytics.

## Route and API ownership

- Public site routes live in `frontend/src/App.tsx`
- Admin routes live in `admin/src/App.tsx`
- Lambda endpoint ownership lives under `backend/personal_api_*`
- Content/CDN assets are mapped by the route and bucket conventions documented in the root `README.md`

## Decision log

Use the ADR document in this folder for project-level architectural decisions and required constraints.
