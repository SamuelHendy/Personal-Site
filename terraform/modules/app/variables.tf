variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

# Content bucket names
variable "albums_bucket_name" {
  description = "Albums S3 bucket name"
  type        = string
}

variable "watches_bucket_name" {
  description = "Watches S3 bucket name"
  type        = string
}

variable "fishtank_bucket_name" {
  description = "Fishtank S3 bucket name"
  type        = string
}

# Content bucket ARNs (for CloudFront policies)
variable "albums_bucket_arn" {
  description = "Albums S3 bucket ARN"
  type        = string
}

variable "albums_bucket_domain" {
  description = "Albums S3 bucket regional domain name"
  type        = string
}

variable "watches_bucket_arn" {
  description = "Watches S3 bucket ARN"
  type        = string
}

variable "watches_bucket_domain" {
  description = "Watches S3 bucket regional domain name"
  type        = string
}

variable "fishtank_bucket_arn" {
  description = "Fishtank S3 bucket ARN"
  type        = string
}

variable "fishtank_bucket_domain" {
  description = "Fishtank S3 bucket regional domain name"
  type        = string
}

# DynamoDB table names
variable "watches_table_name" {
  description = "Watches DynamoDB table name"
  type        = string
}

variable "fishtank_residents_table_name" {
  description = "Fishtank residents DynamoDB table name"
  type        = string
}

variable "fishtank_timeline_table_name" {
  description = "Fishtank timeline DynamoDB table name"
  type        = string
}

variable "site_config_table_name" {
  description = "Site config DynamoDB table name"
  type        = string
}

variable "albums_table_name" {
  description = "Albums DynamoDB table name"
  type        = string
}

variable "albums_table_arn" {
  description = "Albums DynamoDB table ARN"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for CloudFront (e.g., samhendy.com)"
  type        = string
  default     = null
}
