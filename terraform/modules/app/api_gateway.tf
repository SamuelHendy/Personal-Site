# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "personal-site-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = local.api_gateway_tags
}

# Cognito JWT Authorizer for Admin routes
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-admin"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.admin.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.admin.id}"
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  # Rate limiting to prevent abuse
  default_route_settings {
    throttling_burst_limit = 50 # Max concurrent requests
    throttling_rate_limit  = 20 # Requests per second
  }

  tags = local.api_gateway_tags
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

# Fishtank Hero Lambda permission
resource "aws_lambda_permission" "fishtank_hero" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fishtank_hero.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "fishtank_hero" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fishtank_hero.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "fishtank_hero" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/fishtank/hero"
  target    = "integrations/${aws_apigatewayv2_integration.fishtank_hero.id}"
}

# Public Config Lambda (read-only)
resource "aws_lambda_permission" "config" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.config.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "config" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.config.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "config" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/config/{config_type}/{config_key}"
  target    = "integrations/${aws_apigatewayv2_integration.config.id}"
}

# ============================================
# Admin API Routes (protected by Cognito JWT)
# ============================================

# Admin Watches Lambda permission
resource "aws_lambda_permission" "admin_watches" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_watches.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Admin Watches integration
resource "aws_apigatewayv2_integration" "admin_watches" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin_watches.invoke_arn
  payload_format_version = "2.0"
}

# Admin Watches routes - all protected by Cognito authorizer
resource "aws_apigatewayv2_route" "admin_watches_list" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/watches"
  target             = "integrations/${aws_apigatewayv2_integration.admin_watches.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_watches_create" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /api/admin/watches"
  target             = "integrations/${aws_apigatewayv2_integration.admin_watches.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_watches_update" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /api/admin/watches/{brand}/{model}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_watches.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_watches_delete" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "DELETE /api/admin/watches/{brand}/{model}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_watches.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Admin Albums Lambda permission
resource "aws_lambda_permission" "admin_albums" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_albums.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Admin Albums integration
resource "aws_apigatewayv2_integration" "admin_albums" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin_albums.invoke_arn
  payload_format_version = "2.0"
}

# Admin Albums routes - all protected by Cognito authorizer
resource "aws_apigatewayv2_route" "admin_albums_list" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/albums"
  target             = "integrations/${aws_apigatewayv2_integration.admin_albums.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_albums_create" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /api/admin/albums"
  target             = "integrations/${aws_apigatewayv2_integration.admin_albums.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_albums_update" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /api/admin/albums/{album_name}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_albums.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_albums_delete" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "DELETE /api/admin/albums/{album_name}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_albums.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Admin Config Lambda permission
resource "aws_lambda_permission" "admin_config" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_config.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Admin Config integration
resource "aws_apigatewayv2_integration" "admin_config" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin_config.invoke_arn
  payload_format_version = "2.0"
}

# Admin Config routes - protected by Cognito authorizer
resource "aws_apigatewayv2_route" "admin_config_get" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/config/{config_type}/{config_key}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_config.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_config_put" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /api/admin/config/{config_type}/{config_key}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_config.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Admin Fishtank Residents Lambda permission
resource "aws_lambda_permission" "admin_fishtank_residents" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_fishtank_residents.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Admin Fishtank Residents integration
resource "aws_apigatewayv2_integration" "admin_fishtank_residents" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin_fishtank_residents.invoke_arn
  payload_format_version = "2.0"
}

# Admin Fishtank Residents routes - all protected by Cognito authorizer
resource "aws_apigatewayv2_route" "admin_fishtank_residents_list" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/fishtank/residents"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_residents.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_residents_create" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /api/admin/fishtank/residents"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_residents.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_residents_update" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /api/admin/fishtank/residents/{type}/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_residents.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_residents_delete" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "DELETE /api/admin/fishtank/residents/{type}/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_residents.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Admin Fishtank Timeline Lambda permission
resource "aws_lambda_permission" "admin_fishtank_timeline" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_fishtank_timeline.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Admin Fishtank Timeline integration
resource "aws_apigatewayv2_integration" "admin_fishtank_timeline" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin_fishtank_timeline.invoke_arn
  payload_format_version = "2.0"
}

# Admin Fishtank Timeline routes - all protected by Cognito authorizer
resource "aws_apigatewayv2_route" "admin_fishtank_timeline_list" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/fishtank/timeline"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_timeline.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_timeline_create" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /api/admin/fishtank/timeline"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_timeline.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_timeline_update" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /api/admin/fishtank/timeline/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_timeline.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_timeline_delete" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "DELETE /api/admin/fishtank/timeline/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_timeline.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Admin Fishtank Hero Lambda permission
resource "aws_lambda_permission" "admin_fishtank_hero" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_fishtank_hero.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Admin Fishtank Hero integration
resource "aws_apigatewayv2_integration" "admin_fishtank_hero" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.admin_fishtank_hero.invoke_arn
  payload_format_version = "2.0"
}

# Admin Fishtank Hero routes - all protected by Cognito authorizer
resource "aws_apigatewayv2_route" "admin_fishtank_hero_list" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /api/admin/fishtank/hero"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_hero.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_hero_set_active" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "PUT /api/admin/fishtank/hero/{filename}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_hero.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "admin_fishtank_hero_delete" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "DELETE /api/admin/fishtank/hero/{filename}"
  target             = "integrations/${aws_apigatewayv2_integration.admin_fishtank_hero.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
