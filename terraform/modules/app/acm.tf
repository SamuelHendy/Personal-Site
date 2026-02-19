# ACM Certificate for CloudFront (must be in us-east-1)
# Note: This requires a separate provider for us-east-1

resource "aws_acm_certificate" "cloudfront" {
  count             = var.domain_name != null ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "personal-site-certificate"
  })
}
