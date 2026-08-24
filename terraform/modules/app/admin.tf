# CloudFront Function to handle /admin SPA routing
# Files are stored at /admin/ in the UI bucket, so we keep the prefix
resource "aws_cloudfront_function" "admin_rewrite" {
  name    = "admin-path-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      // Static assets (e.g. /admin/assets/index.js)
      if (uri.includes('.')) {
        return request;
      }

      // Known admin SPA routes only — unknown paths return 404 (not index.html)
      var isAdminRoot = uri === '/admin' || uri === '/admin/';
      var isAdminRoute = uri === '/admin/watches'
        || uri === '/admin/fishtank'
        || uri === '/admin/albums';

      if (isAdminRoot || isAdminRoute) {
        request.uri = '/admin/index.html';
        return request;
      }

      // Unknown admin route — pass through to S3 (403). CloudFront serves /404.html with 404 status.
      return request;
    }
  EOF
}

# CloudFront Function to handle /admin (without trailing slash)
# Rewrite to serve index.html instead of redirecting (avoids URL change on refresh)
resource "aws_cloudfront_function" "admin_redirect" {
  name    = "admin-path-redirect"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      request.uri = '/admin/index.html';
      return request;
    }
  EOF
}

# CloudFront Function for main site SPA routing.
# Route allowlist — update when adding new public pages (also update PAGE_ROUTE_FILTER in
# backend/personal_api_metrics/handler.py so Popular Pages metrics stay in sync).
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "spa-path-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      // Static assets (e.g. /assets/index.js, /favicon.ico)
      if (uri.includes('.')) {
        return request;
      }

      // Known public SPA routes only — unknown paths return 404 (not index.html).
      // Keep in sync with PAGE_ROUTE_FILTER in backend/personal_api_metrics/handler.py.
      var isRoot = uri === '/';
      var isAlbums = uri === '/albums' || uri.startsWith('/albums/');
      var isWatches = uri === '/watches';
      var isFishtank = uri === '/fishtank';

      if (isRoot || isAlbums || isWatches || isFishtank) {
        request.uri = '/index.html';
        return request;
      }

      // Unknown route — pass through to S3 (403). CloudFront serves /404.html with 404 status.
      return request;
    }
  EOF
}
