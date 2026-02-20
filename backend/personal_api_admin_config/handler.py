import json
import logging
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_table = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'site-config')


def get_table():
    global _table
    if _table is None:
        _table = boto3.resource('dynamodb', region_name='eu-west-2').Table(TABLE_NAME)
    return _table


def lambda_handler(event, context):
    """
    AWS Lambda entry point for site config management.
    Protected by Cognito JWT authorizer.
    
    Routes:
    - GET /api/admin/config/{config_type}/{config_key} - Get config
    - PUT /api/admin/config/{config_type}/{config_key} - Update config
    """
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path_params = event.get('pathParameters') or {}
    
    config_type = path_params.get('config_type')
    config_key = path_params.get('config_key')
    
    logger.info(f"Method: {http_method}, Type: {config_type}, Key: {config_key}")
    
    try:
        if http_method == 'GET':
            return get_config(config_type, config_key)
        elif http_method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            return put_config(config_type, config_key, body)
        else:
            return response(405, {'error': f'Method {http_method} not allowed'})
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON body'})
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return response(500, {'error': str(e)})


def get_config(config_type, config_key):
    """Get a config item."""
    if not config_type or not config_key:
        return response(400, {'error': 'config_type and config_key are required'})
    
    table = get_table()
    result = table.get_item(Key={'ConfigType': config_type, 'ConfigKey': config_key})
    
    if 'Item' not in result:
        # Return empty config if not found
        return response(200, {'ConfigType': config_type, 'ConfigKey': config_key})
    
    return response(200, result['Item'])


def put_config(config_type, config_key, data):
    """Update a config item (creates if doesn't exist)."""
    if not config_type or not config_key:
        return response(400, {'error': 'config_type and config_key are required'})
    
    table = get_table()
    
    # Merge with existing or create new
    item = {
        'ConfigType': config_type,
        'ConfigKey': config_key,
        **data
    }
    
    table.put_item(Item=item)
    return response(200, {'message': 'Config updated', 'item': item})


def response(status_code, body):
    """Build API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
        },
        'body': json.dumps(body)
    }


if __name__ == '__main__':
    # Test locally
    mock_event = {
        'requestContext': {'http': {'method': 'GET'}},
        'pathParameters': {'config_type': 'display_config', 'config_key': 'watches'}
    }
    result = lambda_handler(mock_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))
