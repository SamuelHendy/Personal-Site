import json
import logging
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None
_dynamodb = None

BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-albums')
TABLE_NAME = os.environ.get('TABLE_NAME', 'albums')


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /albums/{album_name}
    Returns list of image paths for a specific album.
    
    Query params:
    - include_thumbnail: if 'true', returns { Thumbnail, Images } object
                         otherwise returns just the images array (default, for backward compat)
    """
    global _s3, _dynamodb
    if _s3 is None:
        _s3 = boto3.client('s3')
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'eu-west-2'))
    
    path_params = event.get('pathParameters') or {}
    album_name = path_params.get('album_name')
    
    query_params = event.get('queryStringParameters') or {}
    include_thumbnail = query_params.get('include_thumbnail', 'false').lower() == 'true'
    
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
        # Check if album exists and is not hidden
        table = _dynamodb.Table(TABLE_NAME)
        album_record = table.get_item(Key={'AlbumName': album_name}).get('Item')
        
        if not album_record or album_record.get('IsHidden', False):
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Album not found'})
            }
        
        result = get_album_images(album_name, include_thumbnail)
        
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


def get_album_images(album_name, include_thumbnail=False):
    """Get images for a specific album, sorted alphabetically (EXIF date prefix handles ordering).
    
    Args:
        album_name: Name of the album folder
        include_thumbnail: If True, returns { Thumbnail, Images } object
                          If False, returns just the images array (backward compat)
    """
    response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f'{album_name}/')
    
    images = []
    thumbnail = None
    
    for item in response.get('Contents', []):
        key = item['Key']
        if key.endswith('/'):
            continue
        if 'hidden' in key.split('/'):
            continue
            
        # Only include image files, not JSON sidecars
        if not key.endswith(('.webp', '.jpg', '.jpeg', '.png')):
            continue
            
        # Check if this is a thumbnail
        if 'thumbnail' in key.lower():
            thumbnail = key
        else:
            images.append(key)
    
    # Sort alphabetically - files with YYYY-MM-DD prefix will sort by date
    images.sort(reverse=True)  # Newest first (Z > A, 2024 > 2023)
    
    if include_thumbnail:
        return {
            'Thumbnail': thumbnail,
            'Images': images
        }
    else:
        # Backward compatible: just return images array
        return images


if __name__ == '__main__':
    mock_event = {
        'pathParameters': {'album_name': 'test_album'}
    }
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
