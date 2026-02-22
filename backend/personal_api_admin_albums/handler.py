import json
import logging
import os
import boto3
from decimal import Decimal

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'albums')


class DecimalEncoder(json.JSONEncoder):
    """Handle Decimal types from DynamoDB."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def get_table():
    global _table
    if _table is None:
        _table = boto3.resource('dynamodb', region_name='eu-west-2').Table(TABLE_NAME)
    return _table


def lambda_handler(event, context):
    """
    AWS Lambda entry point for admin albums CRUD.
    Protected by Cognito JWT authorizer.
    
    Routes:
    - GET /api/admin/albums - List all albums
    - POST /api/admin/albums - Create an album
    - PUT /api/admin/albums/{album_name} - Update an album
    - DELETE /api/admin/albums/{album_name} - Delete an album
    """
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path_params = event.get('pathParameters') or {}
    
    logger.info(f"Method: {http_method}, Path params: {path_params}")
    
    try:
        if http_method == 'GET':
            return list_albums()
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_album(body)
        elif http_method == 'PUT':
            album_name = path_params.get('album_name')
            body = json.loads(event.get('body', '{}'))
            return update_album(album_name, body)
        elif http_method == 'DELETE':
            album_name = path_params.get('album_name')
            return delete_album(album_name)
        else:
            return response(405, {'error': f'Method {http_method} not allowed'})
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON body'})
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return response(500, {'error': str(e)})


def list_albums():
    """List all albums with all fields."""
    table = get_table()
    result = table.scan()
    items = result.get('Items', [])
    
    # Handle pagination if needed
    while 'LastEvaluatedKey' in result:
        result = table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
        items.extend(result.get('Items', []))
    
    return response(200, items)


def create_album(data):
    """Create a new album."""
    if not data.get('AlbumName'):
        return response(400, {'error': 'AlbumName is required'})
    
    table = get_table()
    
    # Check if already exists
    existing = table.get_item(Key={'AlbumName': data['AlbumName']})
    if 'Item' in existing:
        return response(409, {'error': 'Album already exists'})
    
    # Set defaults
    item = {
        'AlbumName': data['AlbumName'],
        'DisplayName': data.get('DisplayName'),
        'Description': data.get('Description'),
        'IsHidden': data.get('IsHidden', False),
        'ImageCount': data.get('ImageCount', 0),
        'LastUpdated': data.get('LastUpdated', 'n/a'),
        'Thumbnail': data.get('Thumbnail', f"{data['AlbumName']}/thumbnail.webp"),
    }
    
    # Convert floats to Decimal for DynamoDB
    item = convert_floats_to_decimal(item)
    
    table.put_item(Item=item)
    return response(201, {'message': 'Album created', 'item': data})


def update_album(album_name, data):
    """Update an existing album."""
    if not album_name:
        return response(400, {'error': 'AlbumName is required in path'})
    
    table = get_table()
    
    # Check if exists
    existing = table.get_item(Key={'AlbumName': album_name})
    if 'Item' not in existing:
        return response(404, {'error': 'Album not found'})
    
    # Build update expression
    update_expr_parts = []
    expr_attr_names = {}
    expr_attr_values = {}
    
    # Don't allow updating AlbumName (it's the key)
    for key, value in data.items():
        if key == 'AlbumName':
            continue
        
        attr_name = f'#{key}'
        attr_value = f':{key}'
        update_expr_parts.append(f'{attr_name} = {attr_value}')
        expr_attr_names[attr_name] = key
        
        # Convert floats to Decimal
        if isinstance(value, float):
            expr_attr_values[attr_value] = Decimal(str(value))
        else:
            expr_attr_values[attr_value] = value
    
    if not update_expr_parts:
        return response(400, {'error': 'No fields to update'})
    
    update_expr = 'SET ' + ', '.join(update_expr_parts)
    
    table.update_item(
        Key={'AlbumName': album_name},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    
    return response(200, {'message': 'Album updated'})


def delete_album(album_name):
    """Delete an album."""
    if not album_name:
        return response(400, {'error': 'AlbumName is required in path'})
    
    table = get_table()
    
    # Check if exists
    existing = table.get_item(Key={'AlbumName': album_name})
    if 'Item' not in existing:
        return response(404, {'error': 'Album not found'})
    
    table.delete_item(Key={'AlbumName': album_name})
    return response(200, {'message': 'Album deleted'})


def convert_floats_to_decimal(data):
    """Convert float values to Decimal for DynamoDB."""
    result = {}
    for key, value in data.items():
        if isinstance(value, float):
            result[key] = Decimal(str(value))
        elif isinstance(value, dict):
            result[key] = convert_floats_to_decimal(value)
        else:
            result[key] = value
    return result


def response(status_code, body):
    """Build API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }


if __name__ == '__main__':
    # Test locally
    mock_event = {
        'requestContext': {'http': {'method': 'GET'}},
        'pathParameters': None
    }
    result = lambda_handler(mock_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))
