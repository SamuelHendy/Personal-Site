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
    AWS Lambda entry point for public config read-only access.
    No authentication required.
    
    Routes:
    - GET /api/config/{config_type}/{config_key} - Get config
    """
    path_params = event.get('pathParameters') or {}
    
    config_type = path_params.get('config_type')
    config_key = path_params.get('config_key')
    
    logger.info(f"GET config: {config_type}/{config_key}")
    
    try:
        return get_config(config_type, config_key)
    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return response(500, {'error': str(e)})


def get_config(config_type, config_key):
    """Get a config item (read-only)."""
    if not config_type or not config_key:
        return response(400, {'error': 'config_type and config_key are required'})
    
    table = get_table()
    result = table.get_item(Key={'ConfigType': config_type, 'ConfigKey': config_key})
    
    if 'Item' not in result:
        # Return empty config if not found
        return response(200, {'ConfigType': config_type, 'ConfigKey': config_key})
    
    return response(200, result['Item'])


def response(status_code, body):
    """Build API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body)
    }
