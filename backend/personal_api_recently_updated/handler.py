import json
import logging
import boto3
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

BUCKET_NAME = 'shendy-albums'
MAX_WORKERS = 10


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /recently-updated
    Query params:
      - limit: number of albums to return (default 5)
    Returns the N most recently updated albums.
    """
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    # Get limit from query params (default 5)
    query_params = event.get('queryStringParameters') or {}
    try:
        limit = int(query_params.get('limit', 5))
        limit = max(1, min(limit, 20))  # Clamp between 1 and 20
    except (ValueError, TypeError):
        limit = 5
    
    try:
        albums = get_albums()
        
        # Sort by last_updated descending and take top N
        albums_with_dates = []
        for album in albums:
            if album['last_updated'] != 'n/a':
                album['_date'] = datetime.strptime(album['last_updated'], '%d/%m/%Y')
                albums_with_dates.append(album)
        
        albums_with_dates.sort(key=lambda x: x['_date'], reverse=True)
        recent_albums = albums_with_dates[:limit]
        
        # Remove internal _date field
        for album in recent_albums:
            del album['_date']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(recent_albums)
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


def get_albums():
    """List all albums from S3 bucket using concurrent fetching."""
    # Get top-level folders (albums) using delimiter
    response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Delimiter='/')
    
    # Extract album names from CommonPrefixes
    album_names = []
    for prefix in response.get('CommonPrefixes', []):
        album_name = prefix['Prefix'].rstrip('/')
        if 'hidden' not in album_name.lower():
            album_names.append(album_name)
    
    # Fetch album details concurrently
    albums = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_album = {
            executor.submit(fetch_album_details, name): name 
            for name in album_names
        }
        
        for future in as_completed(future_to_album):
            album_data = future.result()
            if album_data:
                albums.append(album_data)
    
    return albums


def fetch_album_details(album_name):
    """Fetch details for a single album (runs in thread pool)."""
    try:
        response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f'{album_name}/')
        items = response.get('Contents', [])
        
        # Filter out folders
        images = [item for item in items if not item['Key'].endswith('/')]
        
        # Skip hidden albums
        if any('/hidden/' in img['Key'] for img in images):
            return None
        
        # Count images (exclude thumbnails, hidden, and JSON sidecars)
        img_count = len([i for i in images 
                        if 'thumbnail' not in i['Key'].lower() 
                        and 'hidden' not in i['Key'].split('/')
                        and i['Key'].endswith(('.webp', '.jpg', '.jpeg', '.png'))])
        
        thumbnail = ''
        last_updated = 'n/a'
        
        if images:
            last_updated = images[0]['LastModified']
            for image in images:
                if 'thumbnail' in image['Key'].lower():
                    thumbnail = image['Key']
                if image['LastModified'] > last_updated:
                    last_updated = image['LastModified']
            last_updated = last_updated.strftime('%d/%m/%Y')
        
        return {
            'name': album_name,
            'thumbnail': thumbnail,
            'img_count': img_count,
            'last_updated': last_updated
        }
    except Exception as e:
        logger.error(f'Error fetching album {album_name}: {str(e)}')
        return None


if __name__ == '__main__':
    mock_event = {}
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
