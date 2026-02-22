# Lambda functions for API
# Note: Lambdas are created with placeholder code. 
# Actual code is deployed via deploy_backend.yml workflow.

locals {
  lambda_runtime   = "python3.11"
  lambda_timeout   = 30
  lambda_memory    = 256
  placeholder_zip  = "${path.module}/templates/lambda/placeholder.zip"
  placeholder_hash = filebase64sha256("${path.module}/templates/lambda/placeholder.zip")
}

# Health check lambda
resource "aws_lambda_function" "health" {
  function_name = "personal-api-health"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  tags = local.lambda_health_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Albums lambda
resource "aws_lambda_function" "albums" {
  function_name = "personal-api-albums"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME = var.albums_table_name
    }
  }

  tags = local.lambda_albums_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Album detail lambda
resource "aws_lambda_function" "album_detail" {
  function_name = "personal-api-album-detail"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      BUCKET_NAME = var.albums_bucket_name
    }
  }

  tags = local.lambda_album_detail_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Recently updated lambda
resource "aws_lambda_function" "recently_updated" {
  function_name = "personal-api-recently-updated"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      BUCKET_NAME = var.albums_bucket_name
    }
  }

  tags = local.lambda_recently_updated_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Watches lambda
resource "aws_lambda_function" "watches" {
  function_name = "personal-api-watches"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME  = var.watches_table_name
      BUCKET_NAME = var.watches_bucket_name
    }
  }

  tags = local.lambda_watches_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Watch detail lambda
resource "aws_lambda_function" "watch_detail" {
  function_name = "personal-api-watch-detail"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME  = var.watches_table_name
      BUCKET_NAME = var.watches_bucket_name
    }
  }

  tags = local.lambda_watch_detail_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Fishtank residents lambda
resource "aws_lambda_function" "fishtank_residents" {
  function_name = "personal-api-fishtank-residents"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME  = var.fishtank_residents_table_name
      BUCKET_NAME = var.fishtank_bucket_name
    }
  }

  tags = local.lambda_fishtank_residents_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Fishtank timeline lambda
resource "aws_lambda_function" "fishtank_timeline" {
  function_name = "personal-api-fishtank-timeline"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME  = var.fishtank_timeline_table_name
      BUCKET_NAME = var.fishtank_bucket_name
    }
  }

  tags = local.lambda_fishtank_timeline_tags

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Public Config lambda (read-only, no auth)
resource "aws_lambda_function" "config" {
  function_name = "personal-api-config"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME = var.site_config_table_name
    }
  }

  tags = merge(local.common_tags, {
    Name     = "personal-api-config"
    Function = "Public Config Read"
  })

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Admin Watches CRUD lambda (protected by Cognito)
resource "aws_lambda_function" "admin_watches" {
  function_name = "personal-api-admin-watches"
  role          = aws_iam_role.lambda_admin.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME = var.watches_table_name
    }
  }

  tags = merge(local.common_tags, {
    Name     = "personal-api-admin-watches"
    Function = "Admin Watches CRUD"
  })

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Admin Config lambda (protected by Cognito)
resource "aws_lambda_function" "admin_config" {
  function_name = "personal-api-admin-config"
  role          = aws_iam_role.lambda_admin.arn
  handler       = "handler.lambda_handler"
  runtime       = local.lambda_runtime
  timeout       = local.lambda_timeout
  memory_size   = local.lambda_memory

  filename         = local.placeholder_zip
  source_code_hash = local.placeholder_hash

  environment {
    variables = {
      TABLE_NAME = var.site_config_table_name
    }
  }

  tags = merge(local.common_tags, {
    Name     = "personal-api-admin-config"
    Function = "Admin Site Config"
  })

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}
