# S3 bucket for Admin UI
resource "aws_s3_bucket" "admin_ui" {
  bucket = "shendy-personal-site-admin"

  tags = merge(local.common_tags, {
    Name = "personal-site-admin-ui"
  })
}

resource "aws_s3_bucket_public_access_block" "admin_ui" {
  bucket = aws_s3_bucket.admin_ui.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "admin_ui" {
  bucket = aws_s3_bucket.admin_ui.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.admin_ui.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

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

# CloudFront Function to redirect /admin to /admin/
resource "aws_cloudfront_function" "admin_redirect" {
  name    = "admin-path-redirect"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: {
          'location': { value: '/admin/' }
        }
      };
    }
  EOF
}

# OAC for admin bucket (kept for backwards compatibility, will be removed later)
resource "aws_cloudfront_origin_access_control" "admin" {
  name                              = "admin-ui-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
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
