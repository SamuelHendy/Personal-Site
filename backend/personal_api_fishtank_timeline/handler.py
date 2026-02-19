import json
import logging
import os
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None
_s3 = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'fishtank-timeline')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-fishtank')
MAX_WORKERS = 10


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /fishtank/timeline
    Returns all timeline events with images from S3.
    """
    global _table, _s3
    if _table is None:
        _table = boto3.resource('dynamodb', region_name='eu-west-2').Table(TABLE_NAME)
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    try:
        # Scan all timeline events
        response = _table.scan()
        items = response.get('Items', [])
        
        # Fetch images concurrently for all events
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_item = {
                executor.submit(fetch_images, item['Id']): item
                for item in items
            }
            
            for future in as_completed(future_to_item):
                item = future_to_item[future]
                item['Images'] = future.result()
        
        # Sort by date (newest first)
        items.sort(key=lambda x: x.get('Date', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(items)
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


def fetch_images(event_id):
    """Fetch images for a timeline event from S3 folder."""
    try:
        prefix = f'timeline/{event_id}/'
        response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        
        images = []
        for item in response.get('Contents', []):
            key = item['Key']
            if not key.endswith('/') and 'thumbnail' not in key.lower():
                images.append(key)
        return images
    except Exception as e:
        logger.error(f'Error fetching images for timeline/{event_id}: {str(e)}')
        return []


if __name__ == '__main__':
    mock_event = {}
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
