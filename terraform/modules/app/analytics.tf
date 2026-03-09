# ╔═════════════════════════════════════╗
# ║       ANALYTICS INFRASTRUCTURE      ║
# ╚═════════════════════════════════════╝
#
# S3 bucket for CloudFront access logs, Athena database/tables for querying,
# and Glue catalog for schema management.
#

# S3 bucket for CloudFront access logs
resource "aws_s3_bucket" "logs" {
  bucket = "shendy-personal-site-logs"

  tags = merge(local.common_tags, {
    Purpose = "CloudFront access logs for analytics"
  })
}

# Enable ACLs for the logs bucket (required for CloudFront logging)
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Grant CloudFront permission to write logs
resource "aws_s3_bucket_acl" "logs" {
  depends_on = [aws_s3_bucket_ownership_controls.logs]

  bucket = aws_s3_bucket.logs.id
  acl    = "private"
}

# Block public access to logs bucket
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy to expire old logs (keep 90 days)
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# ╔═════════════════════════════════════╗
# ║       ATHENA CONFIGURATION          ║
# ╚═════════════════════════════════════╝

# S3 bucket for Athena query results
resource "aws_s3_bucket" "athena_results" {
  bucket = "shendy-personal-site-athena-results"

  tags = merge(local.common_tags, {
    Purpose = "Athena query results"
  })
}

resource "aws_s3_bucket_public_access_block" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy to expire Athena results after 7 days
resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "expire-query-results"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}

# Athena workgroup
resource "aws_athena_workgroup" "main" {
  name = "personal-site-analytics"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = false

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/results/"
    }
  }

  tags = local.common_tags
}

# Glue database for CloudFront logs
resource "aws_glue_catalog_database" "analytics" {
  name = "personal_site_analytics"

  description = "Database for personal site analytics (CloudFront logs)"
}

# Glue table for CloudFront logs (standard log format)
resource "aws_glue_catalog_table" "cloudfront_logs" {
  name          = "cloudfront_logs"
  database_name = aws_glue_catalog_database.analytics.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "skip.header.line.count" = "2"
    "EXTERNAL"               = "TRUE"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.logs.bucket}/cloudfront/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"

      parameters = {
        "field.delim" = "\t"
      }
    }

    # CloudFront standard log format columns
    columns {
      name = "date"
      type = "date"
    }
    columns {
      name = "time"
      type = "string"
    }
    columns {
      name = "x_edge_location"
      type = "string"
    }
    columns {
      name = "sc_bytes"
      type = "bigint"
    }
    columns {
      name = "c_ip"
      type = "string"
    }
    columns {
      name = "cs_method"
      type = "string"
    }
    columns {
      name = "cs_host"
      type = "string"
    }
    columns {
      name = "cs_uri_stem"
      type = "string"
    }
    columns {
      name = "sc_status"
      type = "int"
    }
    columns {
      name = "cs_referer"
      type = "string"
    }
    columns {
      name = "cs_user_agent"
      type = "string"
    }
    columns {
      name = "cs_uri_query"
      type = "string"
    }
    columns {
      name = "cs_cookie"
      type = "string"
    }
    columns {
      name = "x_edge_result_type"
      type = "string"
    }
    columns {
      name = "x_edge_request_id"
      type = "string"
    }
    columns {
      name = "x_host_header"
      type = "string"
    }
    columns {
      name = "cs_protocol"
      type = "string"
    }
    columns {
      name = "cs_bytes"
      type = "bigint"
    }
    columns {
      name = "time_taken"
      type = "double"
    }
    columns {
      name = "x_forwarded_for"
      type = "string"
    }
    columns {
      name = "ssl_protocol"
      type = "string"
    }
    columns {
      name = "ssl_cipher"
      type = "string"
    }
    columns {
      name = "x_edge_response_result_type"
      type = "string"
    }
    columns {
      name = "cs_protocol_version"
      type = "string"
    }
    columns {
      name = "fle_status"
      type = "string"
    }
    columns {
      name = "fle_encrypted_fields"
      type = "string"
    }
    columns {
      name = "c_port"
      type = "int"
    }
    columns {
      name = "time_to_first_byte"
      type = "double"
    }
    columns {
      name = "x_edge_detailed_result_type"
      type = "string"
    }
    columns {
      name = "sc_content_type"
      type = "string"
    }
    columns {
      name = "sc_content_len"
      type = "bigint"
    }
    columns {
      name = "sc_range_start"
      type = "bigint"
    }
    columns {
      name = "sc_range_end"
      type = "bigint"
    }
  }
}

# ╔═════════════════════════════════════╗
# ║       METRICS LAMBDA                ║
# ╚═════════════════════════════════════╝

# IAM role for metrics Lambda (needs Athena access)
resource "aws_iam_role" "metrics_lambda" {
  name = "personal-api-metrics-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "metrics_lambda_basic" {
  role       = aws_iam_role.metrics_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Athena and S3 access for metrics Lambda
resource "aws_iam_role_policy" "metrics_athena" {
  name = "athena-access"
  role = aws_iam_role.metrics_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:StopQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults"
        ]
        Resource = [
          "arn:aws:athena:*:*:workgroup/${aws_athena_workgroup.main.name}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetDatabase",
          "glue:GetPartitions"
        ]
        Resource = [
          "arn:aws:glue:*:*:catalog",
          "arn:aws:glue:*:*:database/${aws_glue_catalog_database.analytics.name}",
          "arn:aws:glue:*:*:table/${aws_glue_catalog_database.analytics.name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.athena_results.arn,
          "${aws_s3_bucket.athena_results.arn}/*"
        ]
      }
    ]
  })
}

# Metrics Lambda function
resource "aws_lambda_function" "metrics" {
  function_name = "personal-api-metrics"
  role          = aws_iam_role.metrics_lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60  # Athena queries can take time
  memory_size   = 256

  filename         = "${path.module}/templates/lambda/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/templates/lambda/placeholder.zip")

  environment {
    variables = {
      ATHENA_DATABASE      = aws_glue_catalog_database.analytics.name
      ATHENA_WORKGROUP     = aws_athena_workgroup.main.name
      ATHENA_OUTPUT_BUCKET = aws_s3_bucket.athena_results.bucket
    }
  }

  tags = local.common_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# API Gateway permission for metrics Lambda
resource "aws_lambda_permission" "metrics" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metrics.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# API Gateway integration for metrics
resource "aws_apigatewayv2_integration" "metrics" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.metrics.invoke_arn
  payload_format_version = "2.0"
}

# Admin metrics route (protected by Cognito)
resource "aws_apigatewayv2_route" "admin_metrics" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/metrics"
  target             = "integrations/${aws_apigatewayv2_integration.metrics.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
