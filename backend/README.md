# Backend

AWS Lambda functions for the Personal Site API.

## Structure

```
backend/
├── shared/                           # Shared utilities (bundled with each lambda)
├── personal_api_health/              # Health check endpoint
├── personal_api_albums/              # /albums
├── personal_api_album_detail/        # /albums/{name}
├── personal_api_recently_updated/    # /recently-updated
├── personal_api_fun_stuff/           # /fun-stuff
├── personal_api_watches/             # /watches
└── personal_api_watch_images/        # /watches/{brand}/{model}/images
```

## Endpoints

| Lambda | Endpoint | Description |
|--------|----------|-------------|
| `personal_api_health` | `GET /health` | Health check |
| `personal_api_albums` | `GET /albums` | List all albums with metadata |
| `personal_api_album_detail` | `GET /albums/{name}` | Get images for specific album |
| `personal_api_recently_updated` | `GET /recently-updated` | 5 most recently updated albums |
| `personal_api_fun_stuff` | `GET /fun-stuff` | List games/fun stuff |
| `personal_api_watches` | `GET /watches` | List all watches |
| `personal_api_watch_images` | `GET /watches/{brand}/{model}/images` | Get watch images |

## Local Development

### Prerequisites

- Python 3.9+
- AWS credentials configured in `~/.aws/credentials` with a `personal` profile

### Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Running the Dev Server

```bash
python dev_server.py --profile personal
```

The server runs on `http://localhost:5000`.

### AWS Profile

The `--profile` flag specifies which AWS credentials to use from `~/.aws/credentials`:

```ini
[personal]
aws_access_key_id = YOUR_KEY
aws_secret_access_key = YOUR_SECRET
```

### Testing with Frontend

The frontend's Vite dev server automatically proxies `/api/*` requests to `localhost:5000`. To run both:

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   source venv/bin/activate
   python dev_server.py --profile personal
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will be at `http://localhost:5173` and API calls will be proxied to the backend.

### Testing Endpoints Directly

```bash
curl http://localhost:5000/health
curl http://localhost:5000/watches
curl http://localhost:5000/albums
```
