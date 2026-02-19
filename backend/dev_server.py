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

app = Flask(__name__)
CORS(app)


def invoke_lambda(handler, path_params=None):
    """Simulate API Gateway event and invoke Lambda handler."""
    event = {
        'pathParameters': path_params or {},
        'queryStringParameters': dict(request.args) if request.args else None,
        'httpMethod': request.method,
        'path': request.path,
    }
    
    result = handler(event, None)
    
    response = app.response_class(
        response=result.get('body', ''),
        status=result.get('statusCode', 200),
        mimetype='application/json'
    )
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
    app.run(debug=True, host='0.0.0.0', port=5000)
