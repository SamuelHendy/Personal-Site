import json
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.modules.setdefault('boto3', types.ModuleType('boto3'))

from personal_api_metrics import handler as metrics


class MetricsFilterTests(unittest.TestCase):
    def capture_query(self, function):
        with patch.object(metrics, 'execute_query', return_value=[]) as execute_query:
            function()
        return execute_query.call_args.args[0]

    def test_public_page_route_allowlist_matches_known_routes(self):
        for route in (
            "cs_uri_stem = '/'",
            "cs_uri_stem = '/albums'",
            "cs_uri_stem LIKE '/albums/%'",
            "cs_uri_stem = '/watches'",
            "cs_uri_stem = '/fishtank'",
        ):
            with self.subTest(route=route):
                self.assertIn(route, metrics.PAGE_ROUTE_FILTER)

    def test_page_traffic_queries_share_route_status_and_bot_filters(self):
        queries = (
            self.capture_query(metrics.get_page_views_today),
            self.capture_query(metrics.get_unique_visitors_today),
            self.capture_query(metrics.get_traffic_over_time),
            self.capture_query(metrics.get_popular_pages),
        )

        for query in queries:
            with self.subTest(query=query.splitlines()[1].strip()):
                self.assertIn(metrics.PAGE_VIEW_FILTER, query)
                self.assertIn('AND sc_status < 400', query)
                self.assertIn('cs_uri_stem LIKE', query)
                self.assertIn('regexp_like', query)

    def test_bot_filter_is_case_insensitive_and_keeps_missing_agents(self):
        self.assertIn("lower(coalesce(cs_user_agent, ''))", metrics.BOT_USER_AGENT_FILTER)
        for signature in ('bot', 'crawler', 'spider', 'facebookexternalhit'):
            with self.subTest(signature=signature):
                self.assertIn(signature, metrics.BOT_USER_AGENT_FILTER)

    def test_summary_response_shape_is_unchanged(self):
        with (
            patch.object(metrics, 'get_page_views_today', return_value=12),
            patch.object(metrics, 'get_unique_visitors_today', return_value=5),
            patch.object(metrics, 'get_errors_24h', return_value=1),
            patch.object(metrics, 'get_avg_response_time', return_value=23.4),
        ):
            response = metrics.lambda_handler({'queryStringParameters': None}, None)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(
            set(json.loads(response['body'])),
            {'pageViews', 'uniqueVisitors', 'errors24h', 'avgResponseMs'},
        )


if __name__ == '__main__':
    unittest.main()