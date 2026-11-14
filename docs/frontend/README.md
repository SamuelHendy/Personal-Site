# Public Frontend

This directory documents the public-facing React app in `frontend/`.

## Purpose

The public frontend is the site users visit to browse albums, watches, fish tank content, and general site content. It is intentionally thin: it renders pages, consumes the API layer, and presents a polished front-end experience without owning the source-of-truth data.

The app is designed to be fast and low-maintenance: pages are route-driven and data is loaded from backend endpoints rather than embedded configuration.

## Key files

- `frontend/src/App.tsx` — route map and app shell
- `frontend/src/config/api.ts` — API and CDN URL config
- `frontend/vite.config.ts` — local dev proxy config
- `frontend/src/pages/` — route-level page components
- `frontend/src/components/` — shared UI elements
- `frontend/src/contexts/` — app state providers

## Routes

The main public app routes are defined in `frontend/src/App.tsx`:

- `/` — home
- `/albums` — album list
- `/albums/:albumName` — specific album detail
- `/watches` — watch collection page
- `/fishtank` — fish tank content
- `*` — not found route

## API access pattern

The frontend calls backend APIs through the `/api` base path. This is configured in `frontend/src/config/api.ts` and the Vite dev proxy in `frontend/vite.config.ts`.

Typical pattern:

- `api.albums` -> `/api/albums`
- `api.watchDetail(brand, model)` -> `/api/watches/:brand/:model`
- `api.fishtankResidents(type)` -> `/api/fishtank/residents?type=...`

The important product intent is that the frontend should consume stable, normalized data contracts rather than implementing custom AWS logic. If a route shape changes, the API contract is the first thing to update.

## Expected data intent

The pages are expected to render the following kinds of data:

- album cards under `/albums`
- detail media for a chosen album under `/albums/:albumName`
- watch cards and full watch records under `/watches`
- fish tank residents and timeline content under `/fishtank`
- a small set of redirect and meta views driven by the site config API

This aligns with the backend handlers from `backend/personal_api_*` and the public site routes in [frontend/src/App.tsx](../../frontend/src/App.tsx).

## Local development

```bash
cd frontend
npm install
npm run dev
```

This runs on `http://localhost:5173` and proxies API traffic to `http://localhost:5000`.

## Architecture notes

- Keep UI code and business logic separated.
- Do not add direct AWS or database access here.
- Prefer using the Lambda-backed API layer for all data retrieval and mutation.

## Related docs

- [Backend documentation](../backend/README.md)
- [Architecture overview](../architecture/README.md)
