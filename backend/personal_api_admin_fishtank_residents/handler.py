import json
import logging
import os
import boto3
from decimal import Decimal

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'fishtank-residents')


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
    AWS Lambda entry point for admin fishtank residents CRUD.
    Protected by Cognito JWT authorizer.
    
    Routes:
    - GET /api/admin/fishtank/residents - List all residents
    - POST /api/admin/fishtank/residents - Create a resident
    - PUT /api/admin/fishtank/residents/{type}/{id} - Update a resident
    - DELETE /api/admin/fishtank/residents/{type}/{id} - Delete a resident
    """
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path_params = event.get('pathParameters') or {}
    
    logger.info(f"Method: {http_method}, Path params: {path_params}")
    
    try:
        if http_method == 'GET':
            return list_residents()
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_resident(body)
        elif http_method == 'PUT':
            resident_type = path_params.get('type')
            resident_id = path_params.get('id')
            body = json.loads(event.get('body', '{}'))
            return update_resident(resident_type, resident_id, body)
        elif http_method == 'DELETE':
            resident_type = path_params.get('type')
            resident_id = path_params.get('id')
            return delete_resident(resident_type, resident_id)
        else:
            return response(405, {'error': f'Method {http_method} not allowed'})
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON body'})
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return response(500, {'error': str(e)})


def list_residents():
    """List all residents with all fields."""
    table = get_table()
    result = table.scan()
    items = result.get('Items', [])
    
    # Handle pagination if needed
    while 'LastEvaluatedKey' in result:
        result = table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
        items.extend(result.get('Items', []))
    
    return response(200, items)


def create_resident(data):
    """Create a new resident."""
    if not data.get('Type') or not data.get('Id'):
        return response(400, {'error': 'Type and Id are required'})
    
    table = get_table()
    
    # Check if already exists
    existing = table.get_item(Key={'Type': data['Type'], 'Id': data['Id']})
    if 'Item' in existing:
        return response(409, {'error': 'Resident already exists'})
    
    # Convert floats to Decimal for DynamoDB
    item = convert_floats_to_decimal(data)
    
    table.put_item(Item=item)
    return response(201, {'message': 'Resident created', 'item': data})


def update_resident(resident_type, resident_id, data):
    """Update an existing resident."""
    if not resident_type or not resident_id:
        return response(400, {'error': 'Type and Id are required in path'})
    
    table = get_table()
    
    # Check if exists
    existing = table.get_item(Key={'Type': resident_type, 'Id': resident_id})
    if 'Item' not in existing:
        return response(404, {'error': 'Resident not found'})
    
    # Build update expression
    update_expr_parts = []
    expr_attr_names = {}
    expr_attr_values = {}
    
    # Don't allow updating Type/Id (they're the key)
    for key, value in data.items():
        if key in ('Type', 'Id'):
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
        Key={'Type': resident_type, 'Id': resident_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )
    
    return response(200, {'message': 'Resident updated'})


def delete_resident(resident_type, resident_id):
    """Delete a resident."""
    if not resident_type or not resident_id:
        return response(400, {'error': 'Type and Id are required in path'})
    
    table = get_table()
    
    # Check if exists
    existing = table.get_item(Key={'Type': resident_type, 'Id': resident_id})
    if 'Item' not in existing:
        return response(404, {'error': 'Resident not found'})
    
    table.delete_item(Key={'Type': resident_type, 'Id': resident_id})
    return response(200, {'message': 'Resident deleted'})


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
