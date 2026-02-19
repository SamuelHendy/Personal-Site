output "albums_bucket_name" {
  description = "Albums S3 bucket name"
  value       = aws_s3_bucket.albums.id
}

output "albums_bucket_arn" {
  description = "Albums S3 bucket ARN"
  value       = aws_s3_bucket.albums.arn
}

output "watches_bucket_name" {
  description = "Watches S3 bucket name"
  value       = aws_s3_bucket.watches.id
}

output "watches_bucket_arn" {
  description = "Watches S3 bucket ARN"
  value       = aws_s3_bucket.watches.arn
}

output "fishtank_bucket_name" {
  description = "Fishtank S3 bucket name"
  value       = aws_s3_bucket.fishtank.id
}

output "fishtank_bucket_arn" {
  description = "Fishtank S3 bucket ARN"
  value       = aws_s3_bucket.fishtank.arn
}

output "watches_table_name" {
  description = "Watches DynamoDB table name"
  value       = aws_dynamodb_table.watches.name
}

output "watches_table_arn" {
  description = "Watches DynamoDB table ARN"
  value       = aws_dynamodb_table.watches.arn
}

output "fishtank_residents_table_name" {
  description = "Fishtank residents DynamoDB table name"
  value       = aws_dynamodb_table.fishtank_residents.name
}

output "fishtank_residents_table_arn" {
  description = "Fishtank residents DynamoDB table ARN"
  value       = aws_dynamodb_table.fishtank_residents.arn
}

output "fishtank_timeline_table_name" {
  description = "Fishtank timeline DynamoDB table name"
  value       = aws_dynamodb_table.fishtank_timeline.name
}

output "fishtank_timeline_table_arn" {
  description = "Fishtank timeline DynamoDB table ARN"
  value       = aws_dynamodb_table.fishtank_timeline.arn
}

# CloudFront URLs for content
output "albums_cdn_url" {
  description = "CloudFront URL for albums content"
  value       = "https://${aws_cloudfront_distribution.albums.domain_name}"
}

output "watches_cdn_url" {
  description = "CloudFront URL for watches content"
  value       = "https://${aws_cloudfront_distribution.watches.domain_name}"
}

output "fishtank_cdn_url" {
  description = "CloudFront URL for fishtank content"
  value       = "https://${aws_cloudfront_distribution.fishtank.domain_name}"
}
