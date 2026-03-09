import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-fishtank')
HERO_PREFIX = 'hero/'


def get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    return _s3


def lambda_handler(event, context):
    """
    AWS Lambda entry point for admin fishtank hero management.
    Protected by Cognito JWT authorizer.
    
    Routes:
    - GET /api/admin/fishtank/hero - List all hero images with active status
    - PUT /api/admin/fishtank/hero/{filename} - Set a hero image as active
    - DELETE /api/admin/fishtank/hero/{filename} - Delete a hero image
    """
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path_params = event.get('pathParameters') or {}
    
    logger.info(f"Method: {http_method}, Path params: {path_params}")
    
    try:
        if http_method == 'GET':
            return list_hero_images()
        elif http_method == 'PUT':
            filename = path_params.get('filename')
            return set_active_hero(filename)
        elif http_method == 'DELETE':
            filename = path_params.get('filename')
            return delete_hero(filename)
        else:
            return response(405, {'error': f'Method {http_method} not allowed'})
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return response(500, {'error': str(e)})


def list_hero_images():
    """List all hero images with their active status and metadata."""
    s3 = get_s3()
    
    try:
        result = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=HERO_PREFIX)
        
        images = []
        for item in result.get('Contents', []):
            key = item['Key']
            # Skip the folder itself
            if key == HERO_PREFIX or key.endswith('/'):
                continue
            # Only include image files
            if not key.endswith(('.webp', '.jpg', '.jpeg', '.png')):
                continue
            
            filename = key.replace(HERO_PREFIX, '')
            is_active = filename.startswith('active_')
            
            # Get the display name (without active_ prefix)
            display_name = filename[7:] if is_active else filename
            
            images.append({
                'key': key,
                'filename': filename,
                'displayName': display_name,
                'isActive': is_active,
                'lastModified': item['LastModified'].isoformat(),
                'size': item['Size']
            })
        
        # Sort by last modified (newest first)
        images.sort(key=lambda x: x['lastModified'], reverse=True)
        
        return response(200, images)
    except Exception as e:
        logger.error(f'Error listing hero images: {str(e)}')
        return response(500, {'error': str(e)})


def set_active_hero(filename):
    """Set a hero image as active by renaming files."""
    if not filename:
        return response(400, {'error': 'Filename is required'})
    
    s3 = get_s3()
    
    try:
        # First, list all hero images to find current active
        result = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=HERO_PREFIX)
        
        current_active_key = None
        target_key = None
        
        for item in result.get('Contents', []):
            key = item['Key']
            if key == HERO_PREFIX or key.endswith('/'):
                continue
            
            item_filename = key.replace(HERO_PREFIX, '')
            
            # Find current active
            if item_filename.startswith('active_'):
                current_active_key = key
            
            # Find the target file (could be with or without active_ prefix)
            if item_filename == filename or item_filename == f'active_{filename}':
                target_key = key
        
        if not target_key:
            return response(404, {'error': 'Hero image not found'})
        
        target_filename = target_key.replace(HERO_PREFIX, '')
        is_already_active = target_filename.startswith('active_')
        
        # If already active, nothing to do
        if is_already_active:
            return response(200, {'message': 'Already active'})
        
        # Deactivate current active (if any)
        if current_active_key:
            current_filename = current_active_key.replace(HERO_PREFIX, '')
            new_filename = current_filename[7:]  # Remove 'active_' prefix
            new_key = f'{HERO_PREFIX}{new_filename}'
            
            # Copy to new name
            s3.copy_object(
                Bucket=BUCKET_NAME,
                CopySource={'Bucket': BUCKET_NAME, 'Key': current_active_key},
                Key=new_key
            )
            # Delete old
            s3.delete_object(Bucket=BUCKET_NAME, Key=current_active_key)
            logger.info(f'Deactivated: {current_active_key} -> {new_key}')
        
        # Activate the target
        new_active_key = f'{HERO_PREFIX}active_{target_filename}'
        s3.copy_object(
            Bucket=BUCKET_NAME,
            CopySource={'Bucket': BUCKET_NAME, 'Key': target_key},
            Key=new_active_key
        )
        s3.delete_object(Bucket=BUCKET_NAME, Key=target_key)
        logger.info(f'Activated: {target_key} -> {new_active_key}')
        
        return response(200, {'message': 'Hero image activated', 'activeKey': new_active_key})
    except Exception as e:
        logger.error(f'Error setting active hero: {str(e)}')
        return response(500, {'error': str(e)})


def delete_hero(filename):
    """Delete a hero image."""
    if not filename:
        return response(400, {'error': 'Filename is required'})
    
    s3 = get_s3()
    
    try:
        # Try both with and without active_ prefix
        key = f'{HERO_PREFIX}{filename}'
        active_key = f'{HERO_PREFIX}active_{filename}'
        
        # Check which one exists
        try:
            s3.head_object(Bucket=BUCKET_NAME, Key=key)
            s3.delete_object(Bucket=BUCKET_NAME, Key=key)
            return response(200, {'message': 'Hero image deleted'})
        except s3.exceptions.ClientError:
            pass
        
        try:
            s3.head_object(Bucket=BUCKET_NAME, Key=active_key)
            s3.delete_object(Bucket=BUCKET_NAME, Key=active_key)
            return response(200, {'message': 'Hero image deleted'})
        except s3.exceptions.ClientError:
            pass
        
        return response(404, {'error': 'Hero image not found'})
    except Exception as e:
        logger.error(f'Error deleting hero: {str(e)}')
        return response(500, {'error': str(e)})


def response(status_code, body):
    """Build API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }


if __name__ == '__main__':
    # Test locally
    mock_event = {
        'requestContext': {'http': {'method': 'GET'}},
        'pathParameters': None
    }
    result = lambda_handler(mock_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))
