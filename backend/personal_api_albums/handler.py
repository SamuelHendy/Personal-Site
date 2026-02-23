import json
import logging
import os
import boto3
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_dynamodb = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'albums')
DEFAULT_PAGE_SIZE = 30


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /albums
    Returns list of all albums with metadata from DynamoDB.
    
    Query params:
    - limit: number of albums per page (default 20, max 100)
    - cursor: pagination cursor (LastEvaluatedKey from previous response)
    """
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'eu-west-2'))
    
    try:
        # Parse query parameters
        params = event.get('queryStringParameters') or {}
        limit = min(int(params.get('limit', DEFAULT_PAGE_SIZE)), 100)
        cursor = params.get('cursor')
        
        result = get_albums(limit=limit, cursor=cursor)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
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


def get_albums(limit=DEFAULT_PAGE_SIZE, cursor=None):
    """List albums from DynamoDB table with pagination."""
    table = _dynamodb.Table(TABLE_NAME)
    
    scan_kwargs = {
        'Limit': limit,
        'FilterExpression': Attr('IsHidden').ne(True) | Attr('IsHidden').not_exists()
    }
    
    # Resume from cursor if provided
    if cursor:
        try:
            scan_kwargs['ExclusiveStartKey'] = json.loads(cursor)
        except json.JSONDecodeError:
            pass
    
    response = table.scan(**scan_kwargs)
    items = response.get('Items', [])
    
    # Format response
    albums = []
    for item in items:
        albums.append({
            'name': item['AlbumName'],
            'display_name': item.get('DisplayName'),
            'thumbnail': item.get('Thumbnail', f"{item['AlbumName']}/thumbnail.jpg"),
            'img_count': int(item.get('ImageCount', 0)),
            'last_updated': item.get('LastUpdated', 'n/a')
        })
    
    result = {'albums': albums}
    
    # Include cursor for next page if more results exist
    if 'LastEvaluatedKey' in response:
        result['nextCursor'] = json.dumps(response['LastEvaluatedKey'])
    
    return result


if __name__ == '__main__':
    mock_event = {}
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
