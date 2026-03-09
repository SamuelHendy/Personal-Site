import json
import logging
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

BUCKET_NAME = os.environ.get('BUCKET_NAME', 'shendy-fishtank')
HERO_PREFIX = 'hero/'


def get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    return _s3


def lambda_handler(event, context):
    """
    Public API to get the active hero image filename.
    
    GET /api/fishtank/hero - Returns the active hero image info
    """
    try:
        s3 = get_s3()
        
        result = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=HERO_PREFIX)
        
        active_hero = None
        for item in result.get('Contents', []):
            key = item['Key']
            if key == HERO_PREFIX or key.endswith('/'):
                continue
            
            filename = key.replace(HERO_PREFIX, '')
            if filename.startswith('active_'):
                active_hero = {
                    'key': key,
                    'filename': filename,
                    'url': f"hero/{filename}"
                }
                break
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(active_hero)
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
