# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "personal-site-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 300
  }

  tags = local.api_gateway_tags
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "health" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "albums" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.albums.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "album_detail" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.album_detail.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "recently_updated" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.recently_updated.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "watches" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.watches.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "watch_detail" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.watch_detail.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "fishtank_residents" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fishtank_residents.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "fishtank_timeline" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fishtank_timeline.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# API Gateway integrations
resource "aws_apigatewayv2_integration" "health" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.health.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "albums" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.albums.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "album_detail" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.album_detail.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "recently_updated" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.recently_updated.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "watches" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.watches.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "watch_detail" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.watch_detail.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "fishtank_residents" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fishtank_residents.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "fishtank_timeline" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fishtank_timeline.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway routes
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/health"
  target    = "integrations/${aws_apigatewayv2_integration.health.id}"
}

resource "aws_apigatewayv2_route" "albums" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/albums"
  target    = "integrations/${aws_apigatewayv2_integration.albums.id}"
}

resource "aws_apigatewayv2_route" "album_detail" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/albums/{album_name}"
  target    = "integrations/${aws_apigatewayv2_integration.album_detail.id}"
}

resource "aws_apigatewayv2_route" "recently_updated" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/recently-updated"
  target    = "integrations/${aws_apigatewayv2_integration.recently_updated.id}"
}

resource "aws_apigatewayv2_route" "watches" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/watches"
  target    = "integrations/${aws_apigatewayv2_integration.watches.id}"
}

resource "aws_apigatewayv2_route" "watch_detail" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/watches/{brand}/{model}"
  target    = "integrations/${aws_apigatewayv2_integration.watch_detail.id}"
}

resource "aws_apigatewayv2_route" "fishtank_residents" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/fishtank/residents"
  target    = "integrations/${aws_apigatewayv2_integration.fishtank_residents.id}"
}

resource "aws_apigatewayv2_route" "fishtank_timeline" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/fishtank/timeline"
  target    = "integrations/${aws_apigatewayv2_integration.fishtank_timeline.id}"
}
