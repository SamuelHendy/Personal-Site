# Terraform Infrastructure

This directory documents the AWS infrastructure managed by Terraform in `terraform/`.

## Purpose

Terraform is responsible for the deployed runtime resources: API Gateway, Lambda functions, CloudFront, S3 buckets, DynamoDB tables, and Cognito.

## Main files and folders

- `terraform/main.tf` — root module composition
- `terraform/variables.tf` — input variables
- `terraform/outputs.tf` — outputs for important endpoints/resources
- `terraform/modules/app/` — app resources and deployment wiring
- `terraform/modules/content/` — S3 and DynamoDB content resources

## Typical local workflow

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Resource geography

The project deploys:

- public frontend assets to S3
- admin app assets to a separate S3 bucket
- API Gateway + Lambdas for backend endpoints
- CloudFront distribution in front of the site
- DynamoDB content tables for watch, fish tank, and timeline data
- Cognito pools and clients for admin auth

## Important notes

- The `terraform/README.md` in the repo explains imported existing resources and the S3 state bucket expectations.
- The repo-level `README.md` documents Cloudflare DNS and CloudFront routing.
- Any change to AWS service contracts should be reflected in both Terraform and the corresponding backend docs.

## Related docs

- [Architecture overview](../architecture/README.md)
- [Backend documentation](../backend/README.md)
- [Admin documentation](../admin/README.md)
