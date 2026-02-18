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
