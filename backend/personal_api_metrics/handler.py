import json
import logging
import os
import time
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_athena = None

# Configuration
ATHENA_DATABASE = os.environ.get('ATHENA_DATABASE', 'personal_site_analytics')
ATHENA_WORKGROUP = os.environ.get('ATHENA_WORKGROUP', 'personal-site-analytics')
ATHENA_OUTPUT_BUCKET = os.environ.get('ATHENA_OUTPUT_BUCKET', 'shendy-personal-site-athena-results')


def get_athena_client():
    global _athena
    if _athena is None:
        _athena = boto3.client('athena')
    return _athena


def execute_query(query: str, timeout_seconds: int = 30) -> list:
    """Execute an Athena query and wait for results."""
    athena = get_athena_client()
    
    # Start query execution
    response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={'Database': ATHENA_DATABASE},
        WorkGroup=ATHENA_WORKGROUP
    )
    
    query_execution_id = response['QueryExecutionId']
    
    # Wait for query to complete
    start_time = time.time()
    while True:
        status_response = athena.get_query_execution(QueryExecutionId=query_execution_id)
        status = status_response['QueryExecution']['Status']['State']
        
        if status == 'SUCCEEDED':
            break
        elif status in ['FAILED', 'CANCELLED']:
            reason = status_response['QueryExecution']['Status'].get('StateChangeReason', 'Unknown')
            raise Exception(f"Query {status}: {reason}")
        
        if time.time() - start_time > timeout_seconds:
            athena.stop_query_execution(QueryExecutionId=query_execution_id)
            raise Exception("Query timeout")
        
        time.sleep(0.5)
    
    # Get results
    results = athena.get_query_results(QueryExecutionId=query_execution_id)
    
    # Parse results into list of dicts
    rows = results['ResultSet']['Rows']
    if len(rows) < 2:
        return []
    
    headers = [col['VarCharValue'] for col in rows[0]['Data']]
    data = []
    for row in rows[1:]:
        values = [col.get('VarCharValue', '') for col in row['Data']]
        data.append(dict(zip(headers, values)))
    
    return data


def get_page_views_today() -> int:
    """Get total page views for today."""
    query = """
    SELECT COUNT(*) as count
    FROM cloudfront_logs
    WHERE date = CURRENT_DATE
      AND cs_uri_stem NOT LIKE '/api/%'
      AND cs_uri_stem NOT LIKE '/cdn/%'
      AND sc_status < 400
    """
    try:
        results = execute_query(query)
        return int(results[0]['count']) if results else 0
    except Exception as e:
        logger.warning(f"Failed to get page views: {e}")
        return 0


def get_unique_visitors_today() -> int:
    """Get unique visitors (by IP) for today."""
    query = """
    SELECT COUNT(DISTINCT c_ip) as count
    FROM cloudfront_logs
    WHERE date = CURRENT_DATE
    """
    try:
        results = execute_query(query)
        return int(results[0]['count']) if results else 0
    except Exception as e:
        logger.warning(f"Failed to get unique visitors: {e}")
        return 0


def get_errors_24h() -> int:
    """Get error count (4xx, 5xx) in last 24 hours."""
    query = """
    SELECT COUNT(*) as count
    FROM cloudfront_logs
    WHERE date >= CURRENT_DATE - INTERVAL '1' DAY
      AND sc_status >= 400
    """
    try:
        results = execute_query(query)
        return int(results[0]['count']) if results else 0
    except Exception as e:
        logger.warning(f"Failed to get errors: {e}")
        return 0


def get_avg_response_time() -> float:
    """Get average response time in ms for today."""
    query = """
    SELECT AVG(time_taken * 1000) as avg_ms
    FROM cloudfront_logs
    WHERE date = CURRENT_DATE
      AND time_taken IS NOT NULL
    """
    try:
        results = execute_query(query)
        if results and results[0]['avg_ms']:
            return round(float(results[0]['avg_ms']), 1)
        return 0.0
    except Exception as e:
        logger.warning(f"Failed to get avg response time: {e}")
        return 0.0


def get_traffic_over_time(days: int = 7) -> list:
    """Get daily page views for the last N days."""
    query = f"""
    SELECT date, COUNT(*) as views, COUNT(DISTINCT c_ip) as visitors
    FROM cloudfront_logs
    WHERE date >= CURRENT_DATE - INTERVAL '{days}' DAY
      AND cs_uri_stem NOT LIKE '/api/%'
      AND cs_uri_stem NOT LIKE '/cdn/%'
      AND sc_status < 400
    GROUP BY date
    ORDER BY date ASC
    """
    try:
        results = execute_query(query)
        return [
            {
                'date': r['date'],
                'views': int(r['views']),
                'visitors': int(r['visitors'])
            }
            for r in results
        ]
    except Exception as e:
        logger.warning(f"Failed to get traffic over time: {e}")
        return []


def get_popular_pages(limit: int = 10) -> list:
    """Get top pages by view count."""
    query = f"""
    SELECT cs_uri_stem as page, COUNT(*) as views
    FROM cloudfront_logs
    WHERE date >= CURRENT_DATE - INTERVAL '7' DAY
      AND cs_uri_stem NOT LIKE '/api/%'
      AND cs_uri_stem NOT LIKE '/cdn/%'
      AND cs_uri_stem NOT LIKE '%.js'
      AND cs_uri_stem NOT LIKE '%.css'
      AND cs_uri_stem NOT LIKE '%.ico'
      AND cs_uri_stem NOT LIKE '%.png'
      AND cs_uri_stem NOT LIKE '%.jpg'
      AND cs_uri_stem NOT LIKE '%.webp'
      AND sc_status < 400
    GROUP BY cs_uri_stem
    ORDER BY views DESC
    LIMIT {limit}
    """
    try:
        results = execute_query(query)
        return [
            {'page': r['page'], 'views': int(r['views'])}
            for r in results
        ]
    except Exception as e:
        logger.warning(f"Failed to get popular pages: {e}")
        return []


def get_api_performance() -> list:
    """Get API endpoint performance stats."""
    query = """
    SELECT 
        cs_uri_stem as endpoint,
        COUNT(*) as requests,
        AVG(time_taken * 1000) as avg_ms,
        MAX(time_taken * 1000) as max_ms
    FROM cloudfront_logs
    WHERE date >= CURRENT_DATE - INTERVAL '7' DAY
      AND cs_uri_stem LIKE '/api/%'
      AND sc_status < 500
    GROUP BY cs_uri_stem
    ORDER BY requests DESC
    LIMIT 10
    """
    try:
        results = execute_query(query)
        return [
            {
                'endpoint': r['endpoint'],
                'requests': int(r['requests']),
                'avg_ms': round(float(r['avg_ms']), 1) if r['avg_ms'] else 0,
                'max_ms': round(float(r['max_ms']), 1) if r['max_ms'] else 0
            }
            for r in results
        ]
    except Exception as e:
        logger.warning(f"Failed to get API performance: {e}")
        return []


def lambda_handler(event, context):
    """
    Lambda handler for metrics API.
    
    GET /api/admin/metrics - Returns dashboard metrics
    GET /api/admin/metrics?type=traffic&days=7 - Returns traffic over time
    GET /api/admin/metrics?type=pages - Returns popular pages
    GET /api/admin/metrics?type=api - Returns API performance
    """
    try:
        # Parse query parameters
        params = event.get('queryStringParameters') or {}
        metric_type = params.get('type', 'summary')
        
        if metric_type == 'summary':
            # Return all summary stats for dashboard
            data = {
                'pageViews': get_page_views_today(),
                'uniqueVisitors': get_unique_visitors_today(),
                'errors24h': get_errors_24h(),
                'avgResponseMs': get_avg_response_time()
            }
            cache_ttl = 300  # 5 minutes for summary
        elif metric_type == 'traffic':
            days = int(params.get('days', 7))
            data = get_traffic_over_time(days)
            cache_ttl = 900  # 15 minutes for traffic
        elif metric_type == 'pages':
            data = get_popular_pages()
            cache_ttl = 900  # 15 minutes for pages
        elif metric_type == 'api':
            data = get_api_performance()
            cache_ttl = 900  # 15 minutes for API stats
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Unknown metric type: {metric_type}'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={cache_ttl}'
            },
            'body': json.dumps(data)
        }
        
    except Exception as e:
        logger.error(f"Error in metrics handler: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
