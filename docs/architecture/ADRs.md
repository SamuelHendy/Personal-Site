# Architecture Decision Records

This document is the canonical place for architecture decisions that agents and contributors must respect when changing the project.

## ADR-001: Public frontend and admin app are intentionally separate

Status: Accepted

The project is split into a public-facing React app and a separate admin React app. This division exists to keep user-facing content presentation separate from authenticated content-management workflows.

Requirements:

- Do not merge the admin app and public frontend into one code path unless the change is explicitly intended to unify them.
- Keep admin-only logic, auth, and routes out of the public site unless required.
- Respect the independent package and deployment flows for each app.

## ADR-002: Backend logic is serverless and Lambda-oriented

Status: Accepted

The backend lives as Python Lambda handlers under `backend/` and is exposed through API Gateway. The local Flask server (`backend/dev_server.py`) is a development convenience that simulates the API Gateway/Lambda runtime contracts.

Requirements:

- Keep API logic in Lambda handlers rather than placing business logic in the frontend.
- Preserve the existing handler-per-resource pattern under `backend/personal_api_*`.
- Update both the Lambda and the local dev server conventions when adding or renaming routes.

## ADR-003: Infrastructure is Terraform-owned

Status: Accepted

AWS infrastructure is managed by Terraform in `terraform/`, not by ad hoc shell scripts or frontend configuration.

Requirements:

- Change infrastructure through `terraform/` modules and root config.
- Keep infrastructure state and application code changes separate in review.
- Update the documentation when adding or removing deployed resources.

## ADR-004: Content and media are delivered via CloudFront/S3, not direct app storage

Status: Accepted

The site uses `/cdn/*` paths to serve content from S3-backed asset buckets for albums, watches, and fish tank media.

Requirements:

- Do not bypass the CDN/content bucket flow for gallery or media assets.
- Preserve the route-to-bucket mapping used by the application.
- Review CloudFront route filters when exposing new public routes.

## ADR-005: Admin analytics and unique visitor counts are derived from CloudFront log data

Status: Accepted

The dashboard uses Athena queries against `cloudfront_logs` to derive analytics metrics.

Unique visitors are estimated by counting distinct source IP addresses on successful requests to known public SPA routes, after excluding recognized bot/crawler user-agent signatures:

- `COUNT(DISTINCT c_ip)` from qualifying CloudFront log records
- This is implemented in `backend/personal_api_metrics/handler.py`
- The route allowlist is `/`, `/albums`, `/albums/*`, `/watches`, and `/fishtank`; it must stay in sync with the frontend routes and CloudFront SPA rewrite.
- Statuses below 400 are retained. User-agent filtering is heuristic and does not establish that a request came from a person; unique IPs are not person-level identities.

Requirements:

- Do not replace this with a client-only or browser-side metric concept without a formal architecture review.
- When route filters or analytics logic change, update both the Lambda logic and the docs.
- Keep the filter lists in sync with public and API route additions.

## ADR-006: Admin access is Cognito + TOTP protected

Status: Accepted

The admin panel uses Amazon Cognito and requires MFA via TOTP for admin users.

Requirements:

- Treat Cognito and MFA as required controls for admin access.
- Keep the admin auth flow and Terraform outputs consistent with deployment configuration.
- Document any changes to admin access flow or auth providers in both Terraform and admin docs.

## ADR-007: Documentation must be navigable and layer-aware

Status: Accepted

This project is intentionally split across several layers; documentation should be discoverable from the top-level `AGENTS.md` and the `docs/` index.

Requirements:

- Keep the docs index current when adding new modules.
- Keep per-layer docs (frontend, admin, backend, terraform) short and actionable.
- Update the relevant documentation whenever architecture, routes, or deployment flow changes.

## Guidance for future changes

When introducing new features or refactors, treat the following as default expectations:

- add or update the relevant layer doc
- update the architecture decision log if the design change is architectural
- keep frontend, admin, backend, and Terraform responsibilities separate
- avoid introducing a new data access path that bypasses the API layer
