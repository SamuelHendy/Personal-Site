# Terraform Infrastructure

This directory contains Terraform configuration for the Personal Site infrastructure.

## Structure

```
terraform/
├── main.tf              # Root module, provider config, module calls
├── variables.tf         # Root variables
├── outputs.tf           # Root outputs
└── modules/
    ├── app/             # Application infrastructure
    │   ├── api_gateway.tf
    │   ├── buckets.tf   # UI bucket
    │   ├── cloudfront.tf
    │   ├── iam.tf
    │   ├── lambdas.tf
    │   ├── outputs.tf
    │   └── variables.tf
    └── content/         # Content storage
        ├── buckets.tf   # Albums, watches, fishtank buckets
        ├── dynamodb.tf  # DynamoDB tables
        ├── outputs.tf
        └── variables.tf
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0
3. S3 bucket for Terraform state: `shendy-terraform-state`

## Imported Resources

The following existing resources are imported (not created):
- `shendy-albums` S3 bucket
- `watch-collection` DynamoDB table

## Usage

```bash
# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply
```

## Outputs

- `api_gateway_url` - API Gateway endpoint URL
- `cloudfront_url` - CloudFront distribution URL
- `ui_bucket_name` - S3 bucket for frontend deployment
