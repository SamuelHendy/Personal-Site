terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "shendy-terraform-state"
    key            = "personal-site/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "personal-aws-terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "personal-site"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}

# Content module - DynamoDB tables and S3 buckets for images/data
module "content" {
  source = "./modules/content"

  environment = var.environment
  aws_region  = var.aws_region
}

# App module - Lambdas, API Gateway, CloudFront, UI bucket
module "app" {
  source = "./modules/app"

  environment = var.environment
  aws_region  = var.aws_region

  # Content bucket references
  albums_bucket_name   = module.content.albums_bucket_name
  watches_bucket_name  = module.content.watches_bucket_name
  fishtank_bucket_name = module.content.fishtank_bucket_name

  # DynamoDB table references
  watches_table_name            = module.content.watches_table_name
  fishtank_residents_table_name = module.content.fishtank_residents_table_name
  fishtank_timeline_table_name  = module.content.fishtank_timeline_table_name
}

# Import blocks for existing resources (must be in root module)
import {
  to = module.content.aws_s3_bucket.albums
  id = "shendy-albums"
}

import {
  to = module.content.aws_dynamodb_table.watches
  id = "watch-collection"
}
