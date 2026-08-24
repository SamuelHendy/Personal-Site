"""
Flask development server for local API testing.
Run from backend/ directory: python dev_server.py
Usage: python dev_server.py [--profile PROFILE_NAME]
"""

import argparse
import os

# Parse args before importing boto3-dependent modules
parser = argparse.ArgumentParser(description='Run the dev server')
parser.add_argument('--profile', type=str, help='AWS profile to use (from ~/.aws/credentials)')
args, _ = parser.parse_known_args()

if args.profile:
    os.environ['AWS_PROFILE'] = args.profile

from flask import Flask, request
from flask_cors import CORS

# Import lambda handlers
from personal_api_health.handler import lambda_handler as health_handler
from personal_api_albums.handler import lambda_handler as albums_handler
from personal_api_album_detail.handler import lambda_handler as album_detail_handler
from personal_api_recently_updated.handler import lambda_handler as recently_updated_handler
# from personal_api_fun_stuff.handler import lambda_handler as fun_stuff_handler  # DISABLED
from personal_api_watches.handler import lambda_handler as watches_handler
from personal_api_watch_detail.handler import lambda_handler as watch_detail_handler
from personal_api_fishtank_residents.handler import lambda_handler as fishtank_residents_handler
from personal_api_fishtank_timeline.handler import lambda_handler as fishtank_timeline_handler
from personal_api_fishtank_hero.handler import lambda_handler as fishtank_hero_handler
from personal_api_admin_watches.handler import lambda_handler as admin_watches_handler
from personal_api_admin_albums.handler import lambda_handler as admin_albums_handler
from personal_api_admin_config.handler import lambda_handler as admin_config_handler
from personal_api_admin_fishtank_residents.handler import lambda_handler as admin_fishtank_residents_handler
from personal_api_admin_fishtank_timeline.handler import lambda_handler as admin_fishtank_timeline_handler
from personal_api_admin_fishtank_hero.handler import lambda_handler as admin_fishtank_hero_handler
from personal_api_config.handler import lambda_handler as config_handler
from personal_api_image_upload.handler import lambda_handler as image_upload_handler
from personal_api_image_status.handler import lambda_handler as image_status_handler
from personal_api_social_redirect.handler import lambda_handler as social_redirect_handler

# Mock metrics handler for local dev (Athena not available locally)
def mock_metrics_handler(event, context):
    """Return mock metrics data for local development."""
    import json
    params = event.get('queryStringParameters') or {}
    metric_type = params.get('type', 'summary')
    
    if metric_type == 'summary':
        data = {
            'pageViews': 1234,
            'uniqueVisitors': 567,
            'errors24h': 12,
            'avgResponseMs': 45.2
        }
    elif metric_type == 'traffic':
        data = [
            {'date': '2026-03-03', 'views': 150, 'visitors': 80},
            {'date': '2026-03-04', 'views': 180, 'visitors': 95},
            {'date': '2026-03-05', 'views': 220, 'visitors': 110},
            {'date': '2026-03-06', 'views': 190, 'visitors': 100},
            {'date': '2026-03-07', 'views': 250, 'visitors': 130},
            {'date': '2026-03-08', 'views': 280, 'visitors': 145},
            {'date': '2026-03-09', 'views': 200, 'visitors': 105},
        ]
    elif metric_type == 'pages':
        data = [
            {'page': '/', 'views': 500},
            {'page': '/watches', 'views': 320},
            {'page': '/albums', 'views': 280},
            {'page': '/fishtank', 'views': 150},
        ]
    elif metric_type == 'social':
        data = [
            {'platform': 'linkedin', 'source': 'main', 'clicks': 42},
            {'platform': 'instagram', 'source': 'qr', 'clicks': 28},
            {'platform': 'instagram', 'source': 'main', 'clicks': 10},
            {'platform': 'github', 'source': 'main', 'clicks': 15},
            {'platform': 'linkedin', 'source': 'qr', 'clicks': 12},
            {'platform': 'spotify', 'source': 'main', 'clicks': 9},
            {'platform': 'unsplash', 'source': 'main', 'clicks': 4},
        ]
    elif metric_type == 'api':
        data = [
            {'endpoint': '/api/watches', 'requests': 450, 'avg_ms': 35.2, 'max_ms': 120.5},
            {'endpoint': '/api/albums', 'requests': 380, 'avg_ms': 42.1, 'max_ms': 95.3},
            {'endpoint': '/api/health', 'requests': 200, 'avg_ms': 5.1, 'max_ms': 15.0},
        ]
    elif metric_type == 'api-errors':
        data = [
            {'endpoint': '/api/admin/images/upload', 'status': 500, 'errors': 3},
            {'endpoint': '/api/admin/fishtank/hero', 'status': 502, 'errors': 1},
        ]
    else:
        return {'statusCode': 400, 'body': json.dumps({'error': f'Unknown type: {metric_type}'})}
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(data)
    }

app = Flask(__name__)
CORS(app)


def invoke_lambda(handler, path_params=None, body=None):
    """Simulate API Gateway event and invoke Lambda handler."""
    event = {
        'pathParameters': path_params or {},
        'queryStringParameters': dict(request.args) if request.args else None,
        'requestContext': {
            'http': {
                'method': request.method
            }
        },
        'httpMethod': request.method,
        'path': request.path,
        'body': body,
    }
    
    result = handler(event, None)

    headers = result.get('headers') or {}
    response = app.response_class(
        response=result.get('body', ''),
        status=result.get('statusCode', 200),
    )
    for key, value in headers.items():
        response.headers[key] = value
    if 'Content-Type' in headers:
        response.mimetype = headers['Content-Type'].split(';')[0]
    elif result.get('statusCode', 200) != 302:
        response.mimetype = 'application/json'
    return response


@app.route('/health', methods=['GET'])
def health():
    return invoke_lambda(health_handler)


@app.route('/albums', methods=['GET'])
def albums_list():
    return invoke_lambda(albums_handler)


@app.route('/albums/<album_name>', methods=['GET'])
def album_detail(album_name):
    return invoke_lambda(album_detail_handler, path_params={'album_name': album_name})


@app.route('/recently-updated', methods=['GET'])
def recently_updated():
    return invoke_lambda(recently_updated_handler)


# @app.route('/fun-stuff', methods=['GET'])  # DISABLED
# def fun_stuff():
#     return invoke_lambda(fun_stuff_handler)


@app.route('/watches', methods=['GET'])
def watches():
    return invoke_lambda(watches_handler)


@app.route('/watches/<brand>/<model>', methods=['GET'])
def watch_detail(brand, model):
    return invoke_lambda(watch_detail_handler, path_params={'brand': brand, 'model': model})


@app.route('/fishtank/residents', methods=['GET'])
def fishtank_residents():
    return invoke_lambda(fishtank_residents_handler)


@app.route('/fishtank/timeline', methods=['GET'])
def fishtank_timeline():
    return invoke_lambda(fishtank_timeline_handler)


@app.route('/fishtank/hero', methods=['GET'])
def fishtank_hero():
    return invoke_lambda(fishtank_hero_handler)


@app.route('/social/<platform>', methods=['GET'])
def social_redirect(platform):
    return invoke_lambda(social_redirect_handler, path_params={'platform': platform})


# Admin routes (no auth in dev mode)
@app.route('/admin/watches', methods=['GET', 'POST'])
def admin_watches():
    body = request.get_data(as_text=True) if request.method == 'POST' else None
    return invoke_lambda(admin_watches_handler, body=body)


@app.route('/admin/watches/<brand>/<model>', methods=['PUT', 'DELETE'])
def admin_watch_detail(brand, model):
    body = request.get_data(as_text=True) if request.method == 'PUT' else None
    return invoke_lambda(admin_watches_handler, path_params={'brand': brand, 'model': model}, body=body)


@app.route('/admin/albums', methods=['GET', 'POST'])
def admin_albums():
    body = request.get_data(as_text=True) if request.method == 'POST' else None
    return invoke_lambda(admin_albums_handler, body=body)


@app.route('/admin/albums/<album_name>', methods=['PUT', 'DELETE'])
def admin_album_detail(album_name):
    body = request.get_data(as_text=True) if request.method == 'PUT' else None
    return invoke_lambda(admin_albums_handler, path_params={'album_name': album_name}, body=body)


@app.route('/admin/config/<config_type>/<config_key>', methods=['GET', 'PUT'])
def admin_config(config_type, config_key):
    body = request.get_data(as_text=True) if request.method == 'PUT' else None
    return invoke_lambda(admin_config_handler, path_params={'config_type': config_type, 'config_key': config_key}, body=body)


@app.route('/admin/fishtank/residents', methods=['GET', 'POST'])
def admin_fishtank_residents():
    body = request.get_data(as_text=True) if request.method == 'POST' else None
    return invoke_lambda(admin_fishtank_residents_handler, body=body)


@app.route('/admin/fishtank/residents/<resident_type>/<resident_id>', methods=['PUT', 'DELETE'])
def admin_fishtank_resident_detail(resident_type, resident_id):
    body = request.get_data(as_text=True) if request.method == 'PUT' else None
    return invoke_lambda(admin_fishtank_residents_handler, path_params={'type': resident_type, 'id': resident_id}, body=body)


@app.route('/admin/fishtank/timeline', methods=['GET', 'POST'])
def admin_fishtank_timeline():
    body = request.get_data(as_text=True) if request.method == 'POST' else None
    return invoke_lambda(admin_fishtank_timeline_handler, body=body)


@app.route('/admin/fishtank/timeline/<event_id>', methods=['PUT', 'DELETE'])
def admin_fishtank_timeline_detail(event_id):
    body = request.get_data(as_text=True) if request.method == 'PUT' else None
    return invoke_lambda(admin_fishtank_timeline_handler, path_params={'id': event_id}, body=body)


@app.route('/admin/fishtank/hero', methods=['GET'])
def admin_fishtank_hero():
    return invoke_lambda(admin_fishtank_hero_handler)


@app.route('/admin/fishtank/hero/<filename>', methods=['PUT', 'DELETE'])
def admin_fishtank_hero_detail(filename):
    return invoke_lambda(admin_fishtank_hero_handler, path_params={'filename': filename})


@app.route('/admin/metrics', methods=['GET'])
def admin_metrics():
    return invoke_lambda(mock_metrics_handler)


@app.route('/config/<config_type>/<config_key>', methods=['GET'])
def public_config(config_type, config_key):
    return invoke_lambda(config_handler, path_params={'config_type': config_type, 'config_key': config_key})


@app.route('/admin/images/upload', methods=['POST'])
def image_upload():
    body = request.get_data(as_text=True)
    return invoke_lambda(image_upload_handler, body=body)


@app.route('/admin/images/status/<path:image_path>', methods=['GET'])
def image_status(image_path):
    event = {
        'pathParameters': {'path': image_path},
        'rawPath': f'/admin/images/status/{image_path}',
        'queryStringParameters': dict(request.args) if request.args else None,
        'httpMethod': request.method,
    }
    result = image_status_handler(event, None)
    return app.response_class(
        response=result.get('body', ''),
        status=result.get('statusCode', 200),
        mimetype='application/json'
    )


if __name__ == '__main__':
    if args.profile:
        print(f"Using AWS profile: {args.profile}")
    print("Starting dev server on http://localhost:5000")
    print("Endpoints:")
    print("  GET /health                        - Health check")
    print("  GET /albums                        - List albums")
    print("  GET /albums/<name>                 - Get album images")
    print("  GET /recently-updated              - Recently updated albums")
    # print("  GET /fun-stuff                     - List fun stuff")  # DISABLED
    print("  GET /watches                       - List watches (basic card data)")
    print("  GET /watches/<brand>/<model>        - Get watch details + images")
    print("  GET /fishtank/residents?type=fish   - List fish")
    print("  GET /fishtank/residents?type=plant  - List plants")
    print("  GET /fishtank/timeline              - List timeline events")
    print("")
    print("Admin (no auth in dev mode):")
    print("  GET    /admin/watches               - List all watches")
    print("  POST   /admin/watches               - Create watch")
    print("  PUT    /admin/watches/<brand>/<model> - Update watch")
    print("  DELETE /admin/watches/<brand>/<model> - Delete watch")
    print("  GET    /admin/albums                - List all albums")
    print("  POST   /admin/albums                - Create album")
    print("  PUT    /admin/albums/<album_name>   - Update album")
    print("  DELETE /admin/albums/<album_name>   - Delete album")
    print("  GET    /admin/config/<type>/<key>    - Get config")
    print("  PUT    /admin/config/<type>/<key>    - Update config")
    print("  GET    /admin/fishtank/residents     - List all residents")
    print("  POST   /admin/fishtank/residents     - Create resident")
    print("  PUT    /admin/fishtank/residents/<type>/<id> - Update resident")
    print("  DELETE /admin/fishtank/residents/<type>/<id> - Delete resident")
    print("  GET    /admin/fishtank/timeline      - List all timeline events")
    print("  POST   /admin/fishtank/timeline      - Create event")
    print("  PUT    /admin/fishtank/timeline/<id> - Update event")
    print("  DELETE /admin/fishtank/timeline/<id> - Delete event")
    print("  POST   /admin/images/upload          - Get presigned URL for upload")
    print("  GET    /admin/images/status/<type>/<id> - Check processing status")
    print("")
    print("Public Config:")
    print("  GET    /config/<type>/<key>          - Get config (read-only)")
    print("")
    app.run(debug=True, host='0.0.0.0', port=5000)
