# Lambda functions for API

locals {
  lambda_runtime = "python3.11"
  lambda_timeout = 30
  lambda_memory  = 256
}

# Health check lambda
resource "aws_lambda_function" "health" {
  function_name = "personal-api-health"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.health.output_path
  source_code_hash = data.archive_file.health.output_base64sha256
}

data "archive_file" "health" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_health"
  output_path = "${path.module}/builds/health.zip"
}

# Albums lambda
resource "aws_lambda_function" "albums" {
  function_name = "personal-api-albums"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.albums.output_path
  source_code_hash = data.archive_file.albums.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = var.albums_bucket_name
    }
  }
}

data "archive_file" "albums" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_albums"
  output_path = "${path.module}/builds/albums.zip"
}

# Album detail lambda
resource "aws_lambda_function" "album_detail" {
  function_name = "personal-api-album-detail"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.album_detail.output_path
  source_code_hash = data.archive_file.album_detail.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = var.albums_bucket_name
    }
  }
}

data "archive_file" "album_detail" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_album_detail"
  output_path = "${path.module}/builds/album_detail.zip"
}

# Recently updated lambda
resource "aws_lambda_function" "recently_updated" {
  function_name = "personal-api-recently-updated"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.recently_updated.output_path
  source_code_hash = data.archive_file.recently_updated.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = var.albums_bucket_name
    }
  }
}

data "archive_file" "recently_updated" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_recently_updated"
  output_path = "${path.module}/builds/recently_updated.zip"
}

# Watches lambda
resource "aws_lambda_function" "watches" {
  function_name = "personal-api-watches"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.watches.output_path
  source_code_hash = data.archive_file.watches.output_base64sha256

  environment {
    variables = {
      TABLE_NAME  = var.watches_table_name
      BUCKET_NAME = var.watches_bucket_name
    }
  }
}

data "archive_file" "watches" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_watches"
  output_path = "${path.module}/builds/watches.zip"
}

# Watch detail lambda
resource "aws_lambda_function" "watch_detail" {
  function_name = "personal-api-watch-detail"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.watch_detail.output_path
  source_code_hash = data.archive_file.watch_detail.output_base64sha256

  environment {
    variables = {
      TABLE_NAME  = var.watches_table_name
      BUCKET_NAME = var.watches_bucket_name
    }
  }
}

data "archive_file" "watch_detail" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_watch_detail"
  output_path = "${path.module}/builds/watch_detail.zip"
}

# Fishtank residents lambda
resource "aws_lambda_function" "fishtank_residents" {
  function_name = "personal-api-fishtank-residents"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.fishtank_residents.output_path
  source_code_hash = data.archive_file.fishtank_residents.output_base64sha256

  environment {
    variables = {
      TABLE_NAME  = var.fishtank_residents_table_name
      BUCKET_NAME = var.fishtank_bucket_name
    }
  }
}

data "archive_file" "fishtank_residents" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_fishtank_residents"
  output_path = "${path.module}/builds/fishtank_residents.zip"
}

# Fishtank timeline lambda
resource "aws_lambda_function" "fishtank_timeline" {
  function_name = "personal-api-fishtank-timeline"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = data.archive_file.fishtank_timeline.output_path
  source_code_hash = data.archive_file.fishtank_timeline.output_base64sha256

  environment {
    variables = {
      TABLE_NAME  = var.fishtank_timeline_table_name
      BUCKET_NAME = var.fishtank_bucket_name
    }
  }
}

data "archive_file" "fishtank_timeline" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/personal_api_fishtank_timeline"
  output_path = "${path.module}/builds/fishtank_timeline.zip"
}
