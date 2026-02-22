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

output "acm_validation_records" {
  description = "DNS records to add to Cloudflare for certificate validation"
  value       = module.app.acm_validation_records
}

output "custom_domain" {
  description = "Custom domain name (if configured)"
  value       = module.app.custom_domain
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID - use this to create your admin user in AWS Console"
  value       = module.app.cognito_user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID for admin frontend"
  value       = module.app.cognito_client_id
}

