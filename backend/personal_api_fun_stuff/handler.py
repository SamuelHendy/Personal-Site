import json
import logging
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by API Gateway for GET /fun-stuff
    Lists games/fun stuff from S3 bucket.
    """
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    try:
        response = _s3.list_objects_v2(Bucket='shendy-funstuff')
        
        games = []
        for item in response.get('Contents', []):
            key = item['Key']
            
            if '/hidden/' in key:
                continue
            
            if key.endswith('/'):
                raw_name = key[:-1]
                uri = f'http://shendy-funstuff.s3-website.eu-west-2.amazonaws.com/{key}'
                games.append({
                    'name': ' '.join(raw_name.split('_')),
                    'raw_name': raw_name,
                    'uri': uri,
                    'last_updated': item['LastModified'].strftime('%d/%m/%Y')
                })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(games)
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


if __name__ == '__main__':
    mock_event = {}
    mock_context = None
    
    result = lambda_handler(mock_event, mock_context)
    print(json.dumps(result, indent=2, default=str))
