import json
import logging
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

RAW_BUCKET = os.environ.get('RAW_BUCKET', 'shendy-raw')


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Returns the count of files pending processing in raw bucket.
    
    GET /admin/images/status/{path}
    e.g., GET /admin/images/status/watches/Seiko/SKX007
    
    Returns: {
        "pendingCount": 3,
        "pendingFiles": ["thumbnail.jpg", "front_view_abc123.png", "back_def456.jpg"]
    }
    """
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    # Get the full path from the URL
    # API Gateway will give us the full path, we need to extract everything after /status/
    raw_path = event.get('rawPath', '') or event.get('path', '')
    
    # Parse: /admin/images/status/{path...}
    status_marker = '/status/'
    if status_marker in raw_path:
        path = raw_path.split(status_marker, 1)[1].strip('/')
    else:
        # Fallback to path parameters
        path_params = event.get('pathParameters') or {}
        path = path_params.get('path', '').strip('/')
    
    if not path:
        return error_response(400, 'Missing path')
    
    # List files in {path}/ in the raw bucket
    prefix = f'{path}/'
    
    try:
        response = _s3.list_objects_v2(Bucket=RAW_BUCKET, Prefix=prefix)
        
        pending_files = []
        for item in response.get('Contents', []):
            key = item['Key']
            # Extract just the filename
            filename = key.split('/')[-1]
            if filename:  # Skip empty (folder markers)
                pending_files.append(filename)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'pendingCount': len(pending_files),
                'pendingFiles': pending_files
            })
        }
    except Exception as e:
        logger.error(f'Error listing raw files: {str(e)}')
        return error_response(500, 'Failed to check processing status')


def error_response(status_code, message):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }


if __name__ == '__main__':
    # Test locally
    mock_event = {
        'pathParameters': {'type': 'watches'},
        'rawPath': '/admin/images/status/watches/Seiko/SKX007'
    }
    result = lambda_handler(mock_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))
