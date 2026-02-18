# Lambda execution role
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
}

# CloudWatch Logs policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# S3 read access for content buckets
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

# DynamoDB access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "personal-site-lambda-dynamodb"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.watches_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_residents_table_name}",
          "arn:aws:dynamodb:${var.aws_region}:*:table/${var.fishtank_timeline_table_name}"
        ]
      }
    ]
  })
}
