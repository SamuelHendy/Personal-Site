# Frontend

React + TypeScript + Vite frontend for the Personal Site.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation

## Local Development

### Prerequisites

- Node.js 18+
- Backend running on `http://localhost:5000` (see `../backend/README.md`)

### Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### API Proxy

During development, Vite automatically proxies `/api/*` requests to the Flask backend on `localhost:5000`. This means:

- Frontend calls `fetch('/api/watches')`
- Vite intercepts and forwards to `http://localhost:5000/watches`
- No CORS issues, no need to change API URLs between dev and production

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with API proxy to localhost:5000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## API Configuration

API endpoints are configured in `src/config/api.ts`:

```typescript
import { api } from './config/api'

fetch(api.albums)              // GET /api/albums
fetch(api.album('Flowers'))    // GET /api/albums/Flowers
fetch(api.watches)             // GET /api/watches
```

The base URL defaults to `/api` but can be overridden via `VITE_API_URL` environment variable.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (routes)
│   ├── config/         # Configuration (API, etc.)
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── vite.config.ts      # Vite configuration (includes API proxy)
```
