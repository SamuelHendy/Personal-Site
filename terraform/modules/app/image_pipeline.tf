# ===========================================
# Image Processing Pipeline
# ===========================================

# Raw uploads bucket
resource "aws_s3_bucket" "raw" {
  bucket = "shendy-raw"

  tags = merge(local.common_tags, {
    Name    = "shendy-raw"
    Purpose = "Raw image uploads for processing"
  })
}

resource "aws_s3_bucket_public_access_block" "raw" {
  bucket = aws_s3_bucket.raw.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS configuration for raw bucket (needed for presigned URL uploads from browser)
resource "aws_s3_bucket_cors_configuration" "raw" {
  bucket = aws_s3_bucket.raw.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "OPTIONS"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Lifecycle rule to clean up old raw files (in case processing fails)
resource "aws_s3_bucket_lifecycle_configuration" "raw" {
  bucket = aws_s3_bucket.raw.id

  rule {
    id     = "cleanup-old-raw-files"
    status = "Enabled"

    filter {}

    expiration {
      days = 1
    }
  }
}

# ===========================================
# Image Upload Lambda (presigned URL generation)
# ===========================================

resource "aws_lambda_function" "image_upload" {
  function_name = "personal-api-image-upload"
  role          = aws_iam_role.lambda_admin.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      RAW_BUCKET = aws_s3_bucket.raw.id
    }
  }

  tags = merge(local.common_tags, {
    Name     = "personal-api-image-upload"
    Function = "Image Upload Presigned URL"
  })

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# ===========================================
# Image Status Lambda (check processing status)
# ===========================================

resource "aws_lambda_function" "image_status" {
  function_name = "personal-api-image-status"
  role          = aws_iam_role.lambda_admin.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      RAW_BUCKET = aws_s3_bucket.raw.id
    }
  }

  tags = merge(local.common_tags, {
    Name     = "personal-api-image-status"
    Function = "Image Processing Status"
  })

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# ===========================================
# Image Processor Lambda (S3 triggered)
# ===========================================

resource "aws_lambda_function" "image_processor" {
  function_name = "personal-api-image-processor"
  role          = aws_iam_role.lambda_image_processor.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 512

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  # Pillow Lambda layer (Klayers community layer)
  layers = [
    "arn:aws:lambda:${var.aws_region}:770693421928:layer:Klayers-p312-Pillow:10"
  ]

  environment {
    variables = {
      RAW_BUCKET      = aws_s3_bucket.raw.id
      WATCHES_BUCKET  = var.watches_bucket_name
      ALBUMS_BUCKET   = var.albums_bucket_name
      FISHTANK_BUCKET = var.fishtank_bucket_name
    }
  }

  tags = merge(local.common_tags, {
    Name     = "personal-api-image-processor"
    Function = "Image Processing WebP conversion"
  })

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# S3 trigger for image processor
resource "aws_s3_bucket_notification" "raw_upload" {
  bucket = aws_s3_bucket.raw.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.image_processor_s3]
}

resource "aws_lambda_permission" "image_processor_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.raw.arn
}

# ===========================================
# IAM Role for Image Processor Lambda
# ===========================================

resource "aws_iam_role" "lambda_image_processor" {
  name = "personal-site-lambda-image-processor-role"

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

  tags = merge(local.iam_tags, {
    Purpose = "Image Processor Lambda"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_image_processor_logs" {
  role       = aws_iam_role.lambda_image_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_image_processor_s3" {
  name = "personal-site-lambda-image-processor-s3"
  role = aws_iam_role.lambda_image_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadRawBucket"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.raw.arn}/*"
      },
      {
        Sid    = "WriteDestinationBuckets"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.watches_bucket_name}/*",
          "arn:aws:s3:::${var.albums_bucket_name}/*",
          "arn:aws:s3:::${var.fishtank_bucket_name}/*"
        ]
      }
    ]
  })
}

# ===========================================
# API Gateway Routes for Image APIs
# ===========================================

# Image Upload Lambda permission
resource "aws_lambda_permission" "image_upload" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_upload.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Image Upload integration
resource "aws_apigatewayv2_integration" "image_upload" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.image_upload.invoke_arn
  payload_format_version = "2.0"
}

# Image Upload route (protected by Cognito)
resource "aws_apigatewayv2_route" "image_upload" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /api/admin/images/upload"
  target             = "integrations/${aws_apigatewayv2_integration.image_upload.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Image Status Lambda permission
resource "aws_lambda_permission" "image_status" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_status.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Image Status integration
resource "aws_apigatewayv2_integration" "image_status" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.image_status.invoke_arn
  payload_format_version = "2.0"
}

# Image Status route (protected by Cognito) - uses greedy path parameter
resource "aws_apigatewayv2_route" "image_status" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/images/status/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.image_status.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
