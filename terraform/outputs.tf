output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.app.api_gateway_url
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = module.app.cloudfront_url
}

output "ui_bucket_name" {
  description = "S3 bucket for frontend UI"
  value       = module.app.ui_bucket_name
}
