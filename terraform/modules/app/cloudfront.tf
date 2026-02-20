# CloudFront Function to strip /cdn/albums/ prefix
resource "aws_cloudfront_function" "strip_cdn_albums" {
  name    = "strip-cdn-albums-prefix"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      request.uri = request.uri.replace(/^\/cdn\/albums/, '');
      return request;
    }
  EOF
}

# CloudFront Function to strip /cdn/watches/ prefix
resource "aws_cloudfront_function" "strip_cdn_watches" {
  name    = "strip-cdn-watches-prefix"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      request.uri = request.uri.replace(/^\/cdn\/watches/, '');
      return request;
    }
  EOF
}

# CloudFront Function to strip /cdn/fishtank/ prefix
resource "aws_cloudfront_function" "strip_cdn_fishtank" {
  name    = "strip-cdn-fishtank-prefix"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      request.uri = request.uri.replace(/^\/cdn\/fishtank/, '');
      return request;
    }
  EOF
}

# CloudFront Origin Access Control for S3 (UI bucket)
resource "aws_cloudfront_origin_access_control" "ui" {
  name                              = "personal-site-ui-oac"
  description                       = "OAC for personal site UI bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Origin Access Control for content buckets
resource "aws_cloudfront_origin_access_control" "content" {
  name                              = "personal-site-content-oac"
  description                       = "OAC for content buckets (albums, watches, fishtank)"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  comment             = "Personal Site - UI, API, and CDN"
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = var.domain_name != null ? [var.domain_name] : []

  viewer_certificate {
    acm_certificate_arn            = var.domain_name != null ? aws_acm_certificate.cloudfront[0].arn : null
    ssl_support_method             = var.domain_name != null ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != null ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = var.domain_name == null
  }

  # S3 origin for static UI files
  origin {
    domain_name              = aws_s3_bucket.ui.bucket_regional_domain_name
    origin_id                = "S3-UI"
    origin_access_control_id = aws_cloudfront_origin_access_control.ui.id
  }

  # API Gateway origin
  origin {
    domain_name = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
    origin_id   = "API"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Albums S3 origin
  origin {
    domain_name              = var.albums_bucket_domain
    origin_id                = "S3-Albums"
    origin_access_control_id = aws_cloudfront_origin_access_control.content.id
  }

  # Watches S3 origin
  origin {
    domain_name              = var.watches_bucket_domain
    origin_id                = "S3-Watches"
    origin_access_control_id = aws_cloudfront_origin_access_control.content.id
  }

  # Fishtank S3 origin
  origin {
    domain_name              = var.fishtank_bucket_domain
    origin_id                = "S3-Fishtank"
    origin_access_control_id = aws_cloudfront_origin_access_control.content.id
  }

  # Admin UI S3 origin
  origin {
    domain_name              = aws_s3_bucket.admin_ui.bucket_regional_domain_name
    origin_id                = "S3-Admin"
    origin_access_control_id = aws_cloudfront_origin_access_control.admin.id
  }

  # Default behavior - S3 UI
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-UI"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # API behavior - forward to API Gateway
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "API"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # CDN behavior - Albums content
  ordered_cache_behavior {
    path_pattern           = "/cdn/albums/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-Albums"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_cdn_albums.arn
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 2592000 # 30 days
  }

  # CDN behavior - Watches content
  ordered_cache_behavior {
    path_pattern           = "/cdn/watches/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-Watches"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_cdn_watches.arn
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 2592000 # 30 days
  }

  # CDN behavior - Fishtank content
  ordered_cache_behavior {
    path_pattern           = "/cdn/fishtank/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-Fishtank"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_cdn_fishtank.arn
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 2592000 # 30 days
  }

  # Admin UI behavior
  ordered_cache_behavior {
    path_pattern           = "/admin/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-Admin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.admin_rewrite.arn
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA routing - return index.html for 404s
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = local.cloudfront_tags
}
