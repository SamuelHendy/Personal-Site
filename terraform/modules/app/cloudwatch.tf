# ╔═════════════════════════════════════╗
# ║       CLOUDWATCH ALARMS             ║
# ╚═════════════════════════════════════╝
#
# Alarms for monitoring API throttling and Lambda errors.
# Free tier includes 10 alarms - we use 3 here.
#

# SNS Topic for alarm notifications
resource "aws_sns_topic" "alarms" {
  name = "personal-site-alarms"

  tags = local.common_tags
}

# API Gateway 4xx errors (includes throttling - 429)
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "personal-site-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300 # 5 minutes
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "API Gateway 4xx errors exceeded threshold - possible throttling or abuse"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

# Lambda throttles across all functions
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "personal-site-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300 # 5 minutes
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda functions are being throttled - concurrency limit reached"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}

# Lambda errors across all functions
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "personal-site-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300 # 5 minutes
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda functions experiencing errors"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = local.common_tags
}
