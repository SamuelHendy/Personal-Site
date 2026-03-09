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
      
      // Handle /admin/ root
      if (uri === '/admin' || uri === '/admin/') {
        request.uri = '/admin/index.html';
      }
      // Handle SPA routing - if no file extension, serve admin index.html
      else if (!uri.includes('.')) {
        request.uri = '/admin/index.html';
      }
      // Otherwise serve the file as-is (e.g. /admin/assets/index.js)
      
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

# CloudFront Function for main site SPA routing
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "spa-path-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      
      // Handle root
      if (uri === '/') {
        request.uri = '/index.html';
      }
      // Handle SPA routing - if no file extension, serve index.html
      else if (!uri.includes('.')) {
        request.uri = '/index.html';
      }
      
      return request;
    }
  EOF
}
