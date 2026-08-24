# ===========================================
# Public Lambda Role (read-only access)
# ===========================================

resource "aws_iam_role" "lambda" {
  name = "personal-site-lambda-role"

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

  tags = local.iam_tags
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "personal-site-lambda-s3"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.albums_bucket_name}",
          "arn:aws:s3:::${var.albums_bucket_name}/*",
          "arn:aws:s3:::${var.watches_bucket_name}",
          "arn:aws:s3:::${var.watches_bucket_name}/*",
          "arn:aws:s3:::${var.fishtank_bucket_name}",
          "arn:aws:s3:::${var.fishtank_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_secrets_social" {
  name = "personal-site-lambda-secrets-social"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.social_links.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "personal-site-lambda-dynamodb-readonly"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.watches_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_residents_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_timeline_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.site_config_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.albums_table_name}"
        ]
      }
    ]
  })
}

# ===========================================
# Admin Lambda Role (read + write access)
# ===========================================

resource "aws_iam_role" "lambda_admin" {
  name = "personal-site-lambda-admin-role"

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
    Purpose = "Admin Lambda functions"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_admin_logs" {
  role       = aws_iam_role.lambda_admin.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_admin_dynamodb" {
  name = "personal-site-lambda-admin-dynamodb"
  role = aws_iam_role.lambda_admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.watches_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_residents_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_timeline_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.site_config_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.albums_table_name}"
        ]
      },
      {
        Sid    = "WriteAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.watches_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.site_config_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.albums_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_residents_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_timeline_table_name}"
        ]
      }
    ]
  })
}

# Admin Lambda S3 access for raw bucket (presigned URLs and status checks)
resource "aws_iam_role_policy" "lambda_admin_s3_raw" {
  name = "personal-site-lambda-admin-s3-raw"
  role = aws_iam_role.lambda_admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RawBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::shendy-raw",
          "arn:aws:s3:::shendy-raw/*"
        ]
      }
    ]
  })
}

# Admin Lambda S3 access for content buckets (image deletion)
resource "aws_iam_role_policy" "lambda_admin_s3_content" {
  name = "personal-site-lambda-admin-s3-content"
  role = aws_iam_role.lambda_admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ContentBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.watches_bucket_name}/*",
          "arn:aws:s3:::${var.albums_bucket_name}/*",
          "arn:aws:s3:::${var.fishtank_bucket_name}/*"
        ]
      },
      {
        Sid    = "ContentBucketList"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.fishtank_bucket_name}"
        ]
        Condition = {
          StringLike = {
            "s3:prefix" = ["hero/*"]
          }
        }
      }
    ]
  })
}
