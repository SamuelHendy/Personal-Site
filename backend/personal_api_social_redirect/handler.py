import json
import logging
import os
import re

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_social_map_cache = None

# Fallback for local dev when SOCIAL_MAP_JSON is not configured
DEFAULT_SOCIAL_MAP = {
    'linkedin': 'https://www.linkedin.com/in/samuel-hendy-958773179/',
    'github': 'https://github.com/SamuelHendy',
    'instagram': 'https://instagram.com/sam.hendy_',
    'unsplash': 'https://unsplash.com/@samuel_h',
    'spotify': 'https://open.spotify.com/user/21yl4qbxlvja34wdtqyrs5zpy',
}

PLATFORM_PATTERN = re.compile(r'^[a-z0-9_-]{1,32}$')


def load_social_map() -> dict:
    """Load platform -> URL map from SOCIAL_MAP_JSON env var."""
    global _social_map_cache
    if _social_map_cache is not None:
        return _social_map_cache

    raw_json = os.environ.get('SOCIAL_MAP_JSON')
    if raw_json:
        payload = json.loads(raw_json)
        social_map = payload.get('SOCIAL_MAP', payload)
        if not isinstance(social_map, dict):
            raise ValueError('SOCIAL_MAP must be an object')
        _social_map_cache = {k.lower(): v for k, v in social_map.items()}
        return _social_map_cache

    _social_map_cache = dict(DEFAULT_SOCIAL_MAP)
    return _social_map_cache


def lambda_handler(event, context):
    """
    Public passthrough redirect for social links.

    GET /api/social/{platform} -> 302 to configured destination (logged in CloudFront for Athena)
    """
    path_params = event.get('pathParameters') or {}
    platform = (path_params.get('platform') or '').lower().strip()

    if not platform or not PLATFORM_PATTERN.match(platform):
        return response(404, {'error': 'Unknown social platform'})

    try:
        social_map = load_social_map()
    except Exception:
        return response(500, {'error': 'Social links unavailable'})

    destination = social_map.get(platform)
    if not destination:
        return response(404, {'error': 'Unknown social platform'})

    if not destination.startswith('https://'):
        logger.error(f'Blocked non-HTTPS social URL for platform {platform}')
        return response(500, {'error': 'Invalid social link configuration'})

    logger.info(f'Redirecting social platform {platform}')

    return {
        'statusCode': 302,
        'headers': {
            'Location': destination,
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
        },
        'body': '',
    }


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(body),
    }


if __name__ == '__main__':
    mock_event = {
        'pathParameters': {'platform': 'linkedin'},
    }
    result = lambda_handler(mock_event, None)
    print(json.dumps(result, indent=2))
