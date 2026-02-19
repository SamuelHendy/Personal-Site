output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "ui_bucket_name" {
  description = "S3 bucket for frontend UI"
  value       = aws_s3_bucket.ui.id
}

output "acm_validation_records" {
  description = "DNS records to add to Cloudflare for certificate validation"
  value = var.domain_name != null ? [
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ] : []
}

output "custom_domain" {
  description = "Custom domain name (if configured)"
  value       = var.domain_name
}
