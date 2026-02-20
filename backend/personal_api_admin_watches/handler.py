import json
import logging
import os
import boto3
from decimal import Decimal

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'watch-collection')


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
    AWS Lambda entry point for admin watches CRUD.
    Protected by Cognito JWT authorizer.
    
    Routes:
    - GET /api/admin/watches - List all watches
    - POST /api/admin/watches - Create a watch
    - PUT /api/admin/watches/{brand}/{model} - Update a watch
    - DELETE /api/admin/watches/{brand}/{model} - Delete a watch
    """
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path_params = event.get('pathParameters') or {}
    
    logger.info(f"Method: {http_method}, Path params: {path_params}")
    
    try:
        if http_method == 'GET':
            return list_watches()
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_watch(body)
        elif http_method == 'PUT':
            brand = path_params.get('brand')
            model = path_params.get('model')
            body = json.loads(event.get('body', '{}'))
            return update_watch(brand, model, body)
        elif http_method == 'DELETE':
            brand = path_params.get('brand')
            model = path_params.get('model')
            return delete_watch(brand, model)
        else:
            return response(405, {'error': f'Method {http_method} not allowed'})
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON body'})
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return response(500, {'error': str(e)})


def list_watches():
    """List all watches with all fields."""
    table = get_table()
    result = table.scan()
    items = result.get('Items', [])
    
    # Handle pagination if needed
    while 'LastEvaluatedKey' in result:
        result = table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
        items.extend(result.get('Items', []))
    
    return response(200, items)


def create_watch(data):
    """Create a new watch."""
    if not data.get('Brand') or not data.get('Model'):
        return response(400, {'error': 'Brand and Model are required'})
    
    table = get_table()
    
    # Check if already exists
    existing = table.get_item(Key={'Brand': data['Brand'], 'Model': data['Model']})
    if 'Item' in existing:
        return response(409, {'error': 'Watch already exists'})
    
    # Convert floats to Decimal for DynamoDB
    item = convert_floats_to_decimal(data)
    
    table.put_item(Item=item)
    return response(201, {'message': 'Watch created', 'item': data})


def update_watch(brand, model, data):
    """Update an existing watch."""
    if not brand or not model:
        return response(400, {'error': 'Brand and Model are required in path'})
    
    table = get_table()
    
    # Check if exists
    existing = table.get_item(Key={'Brand': brand, 'Model': model})
    if 'Item' not in existing:
        return response(404, {'error': 'Watch not found'})
    
    # Build update expression
    update_expr_parts = []
    expr_attr_names = {}
    expr_attr_values = {}
    
    # Don't allow updating Brand/Model (they're the key)
    for key, value in data.items():
        if key in ('Brand', 'Model'):
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
        Key={'Brand': brand, 'Model': model},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    
    return response(200, {'message': 'Watch updated'})


def delete_watch(brand, model):
    """Delete a watch."""
    if not brand or not model:
        return response(400, {'error': 'Brand and Model are required in path'})
    
    table = get_table()
    
    # Check if exists
    existing = table.get_item(Key={'Brand': brand, 'Model': model})
    if 'Item' not in existing:
        return response(404, {'error': 'Watch not found'})
    
    table.delete_item(Key={'Brand': brand, 'Model': model})
    return response(200, {'message': 'Watch deleted'})


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
