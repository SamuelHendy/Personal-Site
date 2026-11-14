# API Documentation

This section captures the intended behavior of the site’s API layer so changes can be reviewed in terms of contract and intent, not only implementation details.

## Purpose

The API layer sits between the public/admin apps and the AWS data sources. Its responsibilities are to:

- expose gallery, watch, and fish tank content to the frontend
- provide admin-only edit and config actions
- produce analytics for the admin dashboard
- serve the CDN metadata and redirect flows that power the site

## API conventions

Across the Lambda handlers, the API follows a consistent contract:

- HTTP status codes are returned explicitly
- JSON is returned in the `body` field
- success responses include a JSON object or array payload
- errors follow the shape `{ "error": "..." }`
- JSON responses may include `Access-Control-Allow-Origin: *`

The local development server in `backend/dev_server.py` wraps each Lambda response into a Flask response so the same contract works locally and in production.

## Endpoint intent and response contract

### Public content APIs

| Endpoint | Intent | Success shape |
| --- | --- | --- |
| `GET /health` | health check for infra and smoke tests | `{ "status": "healthy" }` |
| `GET /albums` | list visible album cards and pagination metadata | `{ "albums": [...], "nextCursor": "..." }` |
| `GET /albums/{album_name}` | return image keys for a single album | `[...]` or `{ "Thumbnail": "...", "Images": [...] }` when `include_thumbnail=true` |
| `GET /recently-updated` | return the most recently updated albums | `[{ "name": "...", "display_name": "...", "thumbnail": "...", "img_count": 12, "last_updated": "YYYY-MM-DD" }]` |
| `GET /watches` | card list for enabled watches with thumbnails | `[{ "Brand": "...", "Model": "...", "Thumbnail": "...", ... }]` |
| `GET /watches/{brand}/{model}` | get the full watch record plus image metadata | `{ "Brand": "...", "Model": "...", "Images": [...], "Hero": "...", "Thumbnail": "...", ... }` |
| `GET /fishtank/residents?type=fish|plant` | list residents by type with image arrays | `[{ "Type": "fish", "Id": "...", "Images": [...] }]` |
| `GET /fishtank/timeline` | list timeline events ordered by date | `[{ "Id": "...", "Date": "...", "Images": [...] }]` |
| `GET /fishtank/hero` | return the active fish tank hero asset | hero object or image metadata |
| `GET /social/{platform}` | redirect or resolve social links | redirect response or config error payload |

### Admin APIs

These routes exist for content editing and configuration management:

- `GET/POST /admin/albums`
- `PUT/DELETE /admin/albums/{album_name}`
- `GET/POST /admin/watches`
- `PUT/DELETE /admin/watches/{brand}/{model}`
- `GET/PUT /admin/config/{config_type}/{config_key}`
- `GET/POST /admin/fishtank/residents`
- `PUT/DELETE /admin/fishtank/residents/{type}/{id}`
- `GET/POST /admin/fishtank/timeline`
- `PUT/DELETE /admin/fishtank/timeline/{id}`
- `GET/POST /admin/fishtank/hero`
- `GET /admin/metrics` and metric variants

These admin handlers follow a consistent pattern:

- `200` for successful read/update actions
- `201` for create actions
- `400` for missing or invalid payloads
- `404` when the target object is missing
- `409` for duplicate create calls

### Analytics API

The admin dashboard metrics API is intentionally driven by CloudFront logs. It supports both summary and detail views:

- `GET /admin/metrics` -> summary dashboard payload
- `GET /admin/metrics?type=traffic&days=7` -> time series
- `GET /admin/metrics?type=pages` -> top pages
- `GET /admin/metrics?type=social&days=30` -> social click counts by source
- `GET /admin/metrics?type=api` -> API performance breakdown
- `GET /admin/metrics?type=api-errors&days=7` -> 5xx per endpoint

Example summary response:

```json
{
  "pageViews": 1234,
  "uniqueVisitors": 567,
  "errors24h": 12,
  "avgResponseMs": 45.2
}
```

## Canonical response shapes

### Album list

```json
{
  "albums": [
    {
      "name": "Flowers",
      "display_name": "Flowers",
      "thumbnail": "Flowers/thumbnail.jpg",
      "img_count": 12,
      "last_updated": "2025-01-03"
    }
  ],
  "nextCursor": "{\"AlbumName\":\"...\"}"
}
```

### Watch detail

```json
{
  "Brand": "Rolex",
  "Model": "Submariner",
  "Dial_Colour": "Black",
  "Movement_Type": "Automatic",
  "Is_Favourite": true,
  "Images": ["Rolex/Submariner/1.jpg"],
  "Hero": "Rolex/Submariner/hero.webp",
  "Thumbnail": "Rolex/Submariner/thumbnail.webp"
}
```

### Error response

```json
{
  "error": "Watch not found"
}
```

## Source of truth

The implementation is in the Lambda handlers under `backend/personal_api_*` and the local wrapper in `backend/dev_server.py`.

For a machine-readable contract, see the OpenAPI spec in `docs/api/openapi.yaml`.
