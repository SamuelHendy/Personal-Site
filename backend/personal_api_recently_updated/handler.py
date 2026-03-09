import json
import logging
import os
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_dynamodb = None

TABLE_NAME = os.environ.get('TABLE_NAME', 'albums')


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /recently-updated
    Query params:
      - limit: number of albums to return (default 5)
    Returns the N most recently updated albums (excluding hidden ones).
    """
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'eu-west-2'))
    
    # Get limit from query params (default 5)
    query_params = event.get('queryStringParameters') or {}
    try:
        limit = int(query_params.get('limit', 5))
        limit = max(1, min(limit, 20))  # Clamp between 1 and 20
    except (ValueError, TypeError):
        limit = 5
    
    try:
        albums = get_albums()
        
        # Sort by last_updated descending and take top N
        albums_with_dates = []
        for album in albums:
            if album['last_updated'] and album['last_updated'] != 'n/a':
                try:
                    album['_date'] = datetime.strptime(album['last_updated'], '%Y-%m-%d')
                    albums_with_dates.append(album)
                except ValueError:
                    pass
        
        albums_with_dates.sort(key=lambda x: x['_date'], reverse=True)
        recent_albums = albums_with_dates[:limit]
        
        # Remove internal _date field
        for album in recent_albums:
            del album['_date']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(recent_albums)
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


def get_albums():
    """List all visible albums from DynamoDB table."""
    table = _dynamodb.Table(TABLE_NAME)
    
    # Scan for non-hidden albums
    response = table.scan(
        FilterExpression=Attr('IsHidden').ne(True) | Attr('IsHidden').not_exists()
    )
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
    
    return albums


if __name__ == '__main__':
    mock_event = {}
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
