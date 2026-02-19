import json
import logging
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-albums')


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /albums/{album_name}
    Returns list of image paths for a specific album.
    """
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    path_params = event.get('pathParameters') or {}
    album_name = path_params.get('album_name')
    
    if not album_name:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'album_name is required'})
        }
    
    try:
        result = get_album_images(album_name)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def get_album_images(album_name):
    """Get images for a specific album."""
    response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f'{album_name}/')
    
    file_names = []
    for item in response.get('Contents', []):
        key = item['Key']
        if not key.endswith('/') and 'thumbnail' not in key.lower():
            if 'hidden' not in key.split('/'):
                file_names.append(key)
    return file_names


if __name__ == '__main__':
    mock_event = {
        'pathParameters': {'album_name': 'test_album'}
    }
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
