import json
import logging
import os
import re
import uuid
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

# Bucket for raw uploads - will be processed and moved to final location
RAW_BUCKET = os.environ.get('RAW_BUCKET', 'shendy-raw')
AWS_REGION = os.environ.get('AWS_REGION', 'eu-west-2')
PRESIGNED_URL_EXPIRY = 3600  # 1 hour

# Supported content types for upload
ALLOWED_CONTENT_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
}

# Valid path prefixes (determines which final bucket to use)
VALID_PATH_PREFIXES = ['watches', 'albums', 'fishtank']


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Generates presigned URLs for uploading images to S3.
    
    POST /admin/images/upload
    Body: {
        "path": "watches/Brand/Model" | "albums/album-name" | "fishtank/resident-id",
        "filename": "original-filename.jpg",
        "contentType": "image/jpeg",
        "isThumbnail": false
    }
    
    Returns: {
        "uploadUrl": "https://...",
        "key": "watches/Brand/Model/filename_uuid.jpg"
    }
    """
    global _s3
    if _s3 is None:
        # Use SigV4 and regional endpoint for presigned URLs (required for CORS)
        _s3 = boto3.client(
            's3',
            region_name=AWS_REGION,
            endpoint_url=f'https://s3.{AWS_REGION}.amazonaws.com',
            config=Config(signature_version='s3v4')
        )
    
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON body')
    
    # Validate required fields
    path = body.get('path', '').strip('/')
    filename = body.get('filename', '')
    content_type = body.get('contentType')
    is_thumbnail = body.get('isThumbnail', False)
    is_lossless = body.get('lossless', False)
    
    if not all([path, filename, content_type]):
        return error_response(400, 'Missing required fields: path, filename, contentType')
    
    # Validate path starts with a valid prefix
    path_prefix = path.split('/')[0] if '/' in path else path
    if path_prefix not in VALID_PATH_PREFIXES:
        return error_response(400, f'Invalid path prefix. Must start with: {", ".join(VALID_PATH_PREFIXES)}')
    
    if content_type not in ALLOWED_CONTENT_TYPES:
        return error_response(400, f'Invalid content type. Allowed: {", ".join(ALLOWED_CONTENT_TYPES.keys())}')
    
    # Get extension and sanitize original filename
    ext = ALLOWED_CONTENT_TYPES[content_type]
    original_name = os.path.splitext(filename)[0]
    # Sanitize: keep only alphanumeric, dash, underscore
    original_name = re.sub(r'[^a-zA-Z0-9_-]', '_', original_name)
    
    # Block 'thumbnail' in filename unless isThumbnail is true
    if original_name.lower().startswith('thumbnail') and not is_thumbnail:
        return error_response(400, 'Filename cannot start with "thumbnail" unless isThumbnail is true')
    
    # Build S3 key
    if is_thumbnail:
        # Thumbnail: just thumbnail.ext (no UUID, only one allowed)
        s3_filename = f'thumbnail{ext}'
    else:
        # Regular image: {original_name}_{uuid}.ext
        unique_id = str(uuid.uuid4())[:8]
        s3_filename = f'{original_name}_{unique_id}{ext}'
    
    s3_key = f'{path}/{s3_filename}'
    
    try:
        # Build params for presigned URL
        put_params = {
            'Bucket': RAW_BUCKET,
            'Key': s3_key,
            'ContentType': content_type,
        }
        
        # Add lossless flag as metadata if requested
        if is_lossless:
            put_params['Metadata'] = {'lossless': 'true'}
        
        # Generate presigned URL for PUT
        presigned_url = _s3.generate_presigned_url(
            'put_object',
            Params=put_params,
            ExpiresIn=PRESIGNED_URL_EXPIRY
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'key': s3_key,
            })
        }
    except Exception as e:
        logger.error(f'Error generating presigned URL: {str(e)}')
        return error_response(500, 'Failed to generate upload URL')


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
        'body': json.dumps({
            'path': 'watches/Seiko/SKX007',
            'filename': 'front_view.jpg',
            'contentType': 'image/jpeg',
            'isThumbnail': False
        })
    }
    result = lambda_handler(mock_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))
