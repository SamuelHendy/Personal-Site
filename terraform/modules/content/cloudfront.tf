# ╔═════════════════════════════════════╗
# ║   CLOUDFRONT FOR CONTENT BUCKETS    ║
# ╚═════════════════════════════════════╝
#
# Serves images from S3 buckets via CloudFront CDN.
# Benefits: caching, HTTPS, better performance.
#

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "content" {
  name                              = "personal-site-content-oac"
  description                       = "OAC for content buckets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution for albums
resource "aws_cloudfront_distribution" "albums" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Albums content CDN"
  price_class     = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.albums.bucket_regional_domain_name
    origin_id                = "S3-albums"
    origin_access_control_id = aws_cloudfront_origin_access_control.content.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-albums"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 2592000 # 30 days
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.albums_bucket_tags
}

# CloudFront distribution for watches
resource "aws_cloudfront_distribution" "watches" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Watches content CDN"
  price_class     = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.watches.bucket_regional_domain_name
    origin_id                = "S3-watches"
    origin_access_control_id = aws_cloudfront_origin_access_control.content.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-watches"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 2592000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.watches_bucket_tags
}

# CloudFront distribution for fishtank
resource "aws_cloudfront_distribution" "fishtank" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Fishtank content CDN"
  price_class     = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.fishtank.bucket_regional_domain_name
    origin_id                = "S3-fishtank"
    origin_access_control_id = aws_cloudfront_origin_access_control.content.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-fishtank"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 2592000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.fishtank_bucket_tags
}

# S3 bucket policies to allow CloudFront access
resource "aws_s3_bucket_policy" "albums" {
  bucket = aws_s3_bucket.albums.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.albums.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.albums.arn
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "watches" {
  bucket = aws_s3_bucket.watches.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.watches.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.watches.arn
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "fishtank" {
  bucket = aws_s3_bucket.fishtank.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.fishtank.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.fishtank.arn
          }
        }
      }
    ]
  })
}
