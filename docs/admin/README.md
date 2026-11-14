# Admin App

This directory documents the authenticated admin React app in `admin/`.

## Purpose

The admin app lets authorized users update curated site data such as albums, watches, fish tank content, and configuration. It is the authenticated editing layer for the site and should be treated as a management tool, not a second public app.

The design intent is that the admin app builds content workflows around the same API contracts that the public site consumes, while adding auth, validation, and editorial controls.

## Key items

- `admin/src/App.tsx` — route definitions and auth gate
- `admin/src/contexts/AuthContext` — Cognito authentication flow
- `admin/src/pages/` — admin screens for different domains
- `admin/src/layouts/` — shell layout for the admin app

## Related docs

- [Content authoring guide](../content/README.md)
- [Operations and release guide](../operations/README.md)
- [Analytics and unique visitor counting](analytics.md)
- [Backend documentation](../backend/README.md)
- [Terraform documentation](../terraform/README.md)
- [Architecture overview](../architecture/README.md)

## Local development

```bash
cd admin
npm install
npm run dev
```

## Authentication model

This app is protected by Cognito. Based on the project README, the admin user flow requires:

- Cognito user pool and app client configured by Terraform
- TOTP MFA setup during first login
- an admin user created manually after deployment

## API relationship

The admin app does not talk directly to DynamoDB or S3. It calls the API layer, which is implemented as Lambda handlers under `backend/` and exposed through the dev server and deployed gateway.

This contract is important because it keeps the site content and media edits centralized and auditable through the API layer, rather than scattering AWS-specific logic throughout the admin UI.

## API expectations and response intent

The admin endpoints are expected to behave like CRUD endpoints for managed content:

- list content
- create a new item
- fetch a single item by key
- update a single item
- delete a single item
- return structured validation errors where required

Examples:

- `GET /admin/watches` -> list enabled watch records
- `POST /admin/watches` -> create a record with a validated payload
- `PUT /admin/watches/{brand}/{model}` -> update a specific watch record
- `GET /admin/metrics` -> analytics summary for the admin dashboard

See [docs/api/README.md](../api/README.md) and [docs/api/openapi.yaml](../api/openapi.yaml) for the broader contract.

## Admin-related backend modules

Relevant admin API handlers include:

- `backend/personal_api_admin_albums/handler.py`
- `backend/personal_api_admin_watches/handler.py`
- `backend/personal_api_admin_config/handler.py`
- `backend/personal_api_admin_fishtank_residents/handler.py`
- `backend/personal_api_admin_fishtank_timeline/handler.py`
- `backend/personal_api_admin_fishtank_hero/handler.py`

## Related docs

- [Backend documentation](../backend/README.md)
- [Terraform documentation](../terraform/README.md)
- [Architecture overview](../architecture/README.md)
