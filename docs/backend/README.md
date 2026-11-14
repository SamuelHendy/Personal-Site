# Backend APIs

This directory documents the Python Lambda API layer in `backend/`.

## Purpose

The backend provides the data and content API for the public site and the admin app. The Lambda handlers are organized by feature and domain, and the contract is intentionally simple: each handler reads its source data, applies a small amount of filtering/normalization, and returns JSON suitable for the client app.

The most important design intent is that the frontend does not reach into AWS directly; it consumes this API layer, and the admin app mutates content through the matching admin handlers.

## Main backend directories

- `backend/shared/` — shared utilities and helper logic
- `backend/personal_api_*` — individual domain handlers
- `backend/dev_server.py` — local Flask wrapper for working with Lambda handlers in development

## Response conventions

The handlers follow a consistent response pattern:

- `statusCode`: explicit HTTP status
- `headers`: JSON content type and CORS headers
- `body`: JSON-encoded payload string

Typical success responses look like:

```json
{
  "statusCode": 200,
  "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  "body": "{\"status\":\"healthy\"}"
}
```

Typical error responses look like:

```json
{
  "statusCode": 404,
  "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  "body": "{\"error\":\"Watch not found\"}"
}
```

## Key API handlers

Public endpoints include:

- `personal_api_health` — health check
  - Intent: smoke-test availability and confirm upstream API health.
  - Returns: `{ "status": "healthy" }`
- `personal_api_albums` — album metadata listing
  - Intent: list visible album cards for the main gallery page.
  - Returns: `{ "albums": [{...}], "nextCursor": "..." }`
- `personal_api_album_detail` — single album detail
  - Intent: return the photo keys for a chosen album and optionally include a thumbnail.
  - Returns: either a plain image array or `{ "Thumbnail": "...", "Images": [...] }`
- `personal_api_recently_updated` — latest content updates
  - Intent: identify recently updated albums without exposing hidden albums.
  - Returns: top N album cards sorted by `last_updated`
- `personal_api_watches` — watch collection data
  - Intent: return lightweight watch card metadata for browsing.
  - Returns: a list of enabled watch items, each with brand/model and thumbnail key.
- `personal_api_watch_detail` — specific watch detail
  - Intent: return the full record and image metadata for a selected watch.
  - Returns: a single watch object plus `Images`, `Hero`, and `Thumbnail` values.
- `personal_api_fishtank_*` — fish tank resident and timeline data
  - Intent: provide fish and plant records plus timeline entries with associated media.
  - Returns: objects with `Type`, `Id`, `Date`, and `Images` arrays.
- `personal_api_social_redirect` — social outbound redirect route
  - Intent: centralize outbound social link handling behind a stable API route.
  - Returns: redirect response or configured error payload.
- `personal_api_metrics` — admin metrics and analytics aggregation
  - Intent: aggregate site analytics from CloudFront logs for the admin dashboard.
  - Returns: summary or detail metrics depending on the `type` query parameter.

Admin endpoints are also implemented in separate Lambda modules such as:

- `personal_api_admin_albums`
- `personal_api_admin_watches`
- `personal_api_admin_fishtank_residents`
- `personal_api_admin_fishtank_timeline`
- `personal_api_admin_fishtank_hero`
- `personal_api_admin_config`

These are intended to support create, update, and delete workflows for the site content, while preserving a common response contract.

## Local development server

The local API is run via `backend/dev_server.py`.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python dev_server.py --profile personal
```

This exposes routes like:

- `/health`
- `/albums`
- `/watches`
- `/fishtank/residents`
- `/admin/watches`
- `/admin/albums`

## Important metrics logic

The unique visitor metric is computed in `backend/personal_api_metrics/handler.py`:

- it reads from `cloudfront_logs`
- it uses `COUNT(DISTINCT c_ip)` over known public page routes to estimate unique IPs
- daily page views, unique IPs, traffic history, and popular pages share the route allowlist, `sc_status < 400`, and a conservative crawler user-agent exclusion
- bot filtering uses the CloudFront `cs_user_agent` field and is heuristic; empty user agents are retained and bots can imitate browser user agents
- the route allowlist mirrors `frontend/src/App.tsx` and the CloudFront SPA rewrite; `/albums/*` matches a route family and does not verify that an album exists

This is the source for the admin analytics dashboard values such as `uniqueVisitors`.

A more detailed walkthrough of the analytics behavior and the intended response format is in [docs/admin/analytics.md](../admin/analytics.md).

## API contract reference

For a machine-readable contract, see [docs/api/openapi.yaml](../api/openapi.yaml). For a narrative summary and endpoint intent, see [docs/api/README.md](../api/README.md).

## Related docs

- [Architecture overview](../architecture/README.md)
- [Frontend documentation](../frontend/README.md)
- [Admin documentation](../admin/README.md)
