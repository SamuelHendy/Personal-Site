import json
import logging
import os
import boto3
from decimal import Decimal

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None
_s3 = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'watch-collection')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-watches')


class DecimalEncoder(json.JSONEncoder):
    """Handle Decimal types from DynamoDB."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /watches/{brand}/{model}
    Returns full details for a specific watch including images.
    """
    global _table, _s3
    if _table is None:
        _table = boto3.resource('dynamodb', region_name='eu-west-2').Table(TABLE_NAME)
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    path_params = event.get('pathParameters') or {}
    brand = path_params.get('brand', '')
    model = path_params.get('model', '')
    
    # Convert URL-encoded values
    brand = brand.replace('_', ' ').replace('%20', ' ')
    model = model.replace('_', ' ').replace('%20', ' ')
    
    if not brand or not model:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'brand and model are required'})
        }
    
    try:
        # Query by Brand and Model
        response = _table.scan(
            FilterExpression='Brand = :brand AND Model = :model',
            ExpressionAttributeValues={
                ':brand': brand,
                ':model': model
            }
        )
        items = response.get('Items', [])
        
        if not items:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Watch not found'})
            }
        
        watch = items[0]
        
        # Fetch images from S3 (including thumbnail and hero)
        images_data = fetch_images(brand, model)
        watch['Images'] = images_data['images']
        watch['Hero'] = images_data['hero']
        watch['Thumbnail'] = images_data['thumbnail']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(watch, cls=DecimalEncoder)
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


def fetch_images(brand, model):
    """Fetch all images for a watch from S3, separating thumbnail, hero, and other images."""
    try:
        prefix = f'{brand}/{model}/'
        response = _s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        
        images = []
        hero = None
        thumbnail = None
        
        for item in response.get('Contents', []):
            key = item['Key']
            filename = key.split('/')[-1].lower()
            
            # Skip folders and JSON sidecars
            if key.endswith('/') or key.endswith('.json'):
                continue
            
            # Check for thumbnail
            if filename == 'thumbnail.webp':
                thumbnail = key
                continue
            
            # Check for hero image
            if filename == 'hero.webp':
                hero = key
                continue
            
            # Include other image files
            if key.endswith(('.webp', '.jpg', '.jpeg', '.png')):
                images.append(key)
        
        return {'images': images, 'hero': hero, 'thumbnail': thumbnail}
    except Exception as e:
        logger.error(f'Error fetching images for {brand}/{model}: {str(e)}')
        return {'images': [], 'hero': None, 'thumbnail': None}


if __name__ == '__main__':
    mock_event = {
        'pathParameters': {
            'brand': 'Custom',
            'model': 'First_Build'
        }
    }
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
