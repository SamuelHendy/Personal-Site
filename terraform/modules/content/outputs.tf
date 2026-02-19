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

# Bucket domain names for CloudFront
output "albums_bucket_domain" {
  description = "Albums S3 bucket regional domain name"
  value       = aws_s3_bucket.albums.bucket_regional_domain_name
}

output "watches_bucket_domain" {
  description = "Watches S3 bucket regional domain name"
  value       = aws_s3_bucket.watches.bucket_regional_domain_name
}

output "fishtank_bucket_domain" {
  description = "Fishtank S3 bucket regional domain name"
  value       = aws_s3_bucket.fishtank.bucket_regional_domain_name
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

