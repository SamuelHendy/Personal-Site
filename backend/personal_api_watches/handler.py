import json
import logging
import os
import boto3
from boto3.dynamodb.conditions import Attr
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None
_s3 = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'watch-collection')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-watches')
MAX_WORKERS = 10

# Fields to return for card display (lightweight)
# Includes dates for sorting/display, but excludes heavy Description field
# Note: Enabled is needed for the filter but won't be returned in response
CARD_FIELDS = [
    'Brand', 'Model', 'Dial_Colour', 'Case_Width', 
    'Movement_Type', 'Is_Favourite', 'Manufactured_Year', 'Obtained_Date', 'Enabled'
]


class DecimalEncoder(json.JSONEncoder):
    """Handle Decimal types from DynamoDB."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /watches
    Returns basic card data with thumbnail images.
    """
    global _table, _s3
    if _table is None:
        _table = boto3.resource('dynamodb', region_name='eu-west-2').Table(TABLE_NAME)
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    try:
        # Use projection to only fetch card fields, filter to only enabled watches
        response = _table.scan(
            ProjectionExpression=', '.join(CARD_FIELDS),
            FilterExpression=Attr('Enabled').eq(True)
        )
        items = response.get('Items', [])
        
        # Remove Enabled field from response (not needed by frontend)
        for item in items:
            item.pop('Enabled', None)
        
        # Fetch thumbnail images concurrently
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_item = {
                executor.submit(fetch_thumbnail, item['Brand'], item['Model']): item
                for item in items
            }
            
            for future in as_completed(future_to_item):
                item = future_to_item[future]
                item['Thumbnail'] = future.result()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(items, cls=DecimalEncoder)
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


def fetch_thumbnail(brand, model):
    """Fetch thumbnail image for a watch from S3."""
    try:
        prefix = f'{brand}/{model}/'
        response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        
        for item in response.get('Contents', []):
            key = item['Key']
            if 'thumbnail' in key.lower():
                return key
        
        # If no thumbnail, return first image
        for item in response.get('Contents', []):
            key = item['Key']
            if not key.endswith('/'):
                return key
        return None
    except Exception as e:
        logger.error(f'Error fetching thumbnail for {brand}/{model}: {str(e)}')
        return None


if __name__ == '__main__':
    mock_event = {}
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
