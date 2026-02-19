import json
import logging
import os
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None
_s3 = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'fishtank-residents')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-fishtank')
MAX_WORKERS = 10


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /fishtank/residents?type=fish|plant
    Returns all residents of the specified type with images from S3.
    """
    global _table, _s3
    if _table is None:
        _table = boto3.resource('dynamodb', region_name='eu-west-2').Table(TABLE_NAME)
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    # Get type from query params
    query_params = event.get('queryStringParameters') or {}
    resident_type = query_params.get('type', '').lower()
    
    if resident_type not in ('fish', 'plant'):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'type query param must be "fish" or "plant"'})
        }
    
    try:
        # Query by Type (partition key)
        response = _table.query(
            KeyConditionExpression='#type = :type',
            ExpressionAttributeNames={'#type': 'Type'},
            ExpressionAttributeValues={':type': resident_type}
        )
        items = response.get('Items', [])
        
        # Fetch images concurrently for all residents
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_item = {
                executor.submit(fetch_images, resident_type, item['Id']): item
                for item in items
            }
            
            for future in as_completed(future_to_item):
                item = future_to_item[future]
                item['Images'] = future.result()
        
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


def fetch_images(resident_type, resident_id):
    """Fetch images for a resident from S3 folder."""
    try:
        prefix = f'{resident_type}/{resident_id}/'
        response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        
        images = []
        for item in response.get('Contents', []):
            key = item['Key']
            if not key.endswith('/') and 'thumbnail' not in key.lower():
                images.append(key)
        return images
    except Exception as e:
        logger.error(f'Error fetching images for {resident_type}/{resident_id}: {str(e)}')
        return []


if __name__ == '__main__':
    mock_event = {
        'queryStringParameters': {'type': 'fish'}
    }
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
