import json
import logging
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None
_dynamodb = None

AWS_REGION = os.environ.get('AWS_REGION', 'eu-west-2')
ALBUMS_TABLE = os.environ.get('ALBUMS_TABLE', 'albums')

# Map path prefix to destination bucket
DESTINATION_BUCKETS = {
    'watches': os.environ.get('WATCHES_BUCKET', 'shendy-watches'),
    'albums': os.environ.get('ALBUMS_BUCKET', 'shendy-albums'),
    'fishtank': os.environ.get('FISHTANK_BUCKET', 'shendy-fishtank'),
}

VALID_PATH_PREFIXES = ['watches', 'albums', 'fishtank']


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Deletes an image from S3.
    
    DELETE /admin/images/delete
    Body: {
        "key": "albums/album-name/image.webp",
        "isThumbnail": false  // Must be true to delete thumbnails
    }
    
    The key should be the full path including the content type prefix.
    e.g., "albums/My_Album/2024-01-01_photo.webp"
    """
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3', region_name=AWS_REGION)
    
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON body')
    
    key = body.get('key', '').strip()
    is_thumbnail = body.get('isThumbnail', False)
    
    if not key:
        return error_response(400, 'Missing required field: key')
    
    # Parse the key to get content type and validate
    parts = key.split('/')
    if len(parts) < 2:
        return error_response(400, 'Invalid key format')
    
    content_type = parts[0]  # watches, albums, fishtank
    
    if content_type not in VALID_PATH_PREFIXES:
        return error_response(400, f'Invalid content type. Must be one of: {", ".join(VALID_PATH_PREFIXES)}')
    
    # Get the destination bucket
    bucket = DESTINATION_BUCKETS.get(content_type)
    if not bucket:
        return error_response(500, f'No bucket configured for content type: {content_type}')
    
    # The actual S3 key doesn't include the content type prefix
    # e.g., "albums/My_Album/photo.webp" -> "My_Album/photo.webp" in shendy-albums bucket
    s3_key = '/'.join(parts[1:])
    
    # Protect thumbnails - require explicit isThumbnail flag to delete them
    is_thumbnail_file = 'thumbnail' in s3_key.lower()
    if is_thumbnail_file and not is_thumbnail:
        return error_response(400, 'Cannot delete thumbnails without isThumbnail=true')
    if not is_thumbnail_file and is_thumbnail:
        return error_response(400, 'isThumbnail=true but file is not a thumbnail')
    
    try:
        # Check if the object exists first
        try:
            _s3.head_object(Bucket=bucket, Key=s3_key)
        except _s3.exceptions.ClientError as e:
            if e.response['Error']['Code'] == '404':
                return error_response(404, 'Image not found')
            raise
        
        # Delete the image
        logger.info(f'Deleting {bucket}/{s3_key}')
        _s3.delete_object(Bucket=bucket, Key=s3_key)
        
        # Also delete the EXIF sidecar if it exists
        exif_key = s3_key.rsplit('.', 1)[0] + '_exif.json'
        try:
            _s3.delete_object(Bucket=bucket, Key=exif_key)
            logger.info(f'Deleted EXIF sidecar {bucket}/{exif_key}')
        except Exception:
            pass  # EXIF file may not exist, that's fine
        
        # Update album ImageCount if this is an album image (not thumbnail)
        if content_type == 'albums' and not is_thumbnail:
            update_album_image_count(s3_key)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Image deleted successfully', 'key': key})
        }
        
    except Exception as e:
        logger.error(f'Error deleting image: {str(e)}')
        return error_response(500, f'Failed to delete image: {str(e)}')


def update_album_image_count(s3_key):
    """Update album ImageCount in DynamoDB after deleting an image."""
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    
    try:
        # Extract album name from s3_key (e.g., "My_Album/image.webp" -> "My_Album")
        album_name = s3_key.split('/')[0]
        
        # Count remaining images in the album (excluding thumbnails and JSON sidecars)
        albums_bucket = DESTINATION_BUCKETS['albums']
        response = _s3.list_objects_v2(Bucket=albums_bucket, Prefix=f'{album_name}/')
        
        image_count = 0
        for item in response.get('Contents', []):
            key = item['Key']
            if key.endswith('/') or 'thumbnail' in key.lower():
                continue
            if key.endswith(('.webp', '.jpg', '.jpeg', '.png')):
                image_count += 1
        
        # Update DynamoDB
        table = _dynamodb.Table(ALBUMS_TABLE)
        table.update_item(
            Key={'AlbumName': album_name},
            UpdateExpression='SET ImageCount = :count',
            ExpressionAttributeValues={':count': image_count}
        )
        
        logger.info(f'Updated album {album_name} ImageCount to {image_count}')
        
    except Exception as e:
        logger.warning(f'Error updating album image count: {str(e)}')


def error_response(status_code, message):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }
