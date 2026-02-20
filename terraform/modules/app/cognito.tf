# Cognito User Pool for Admin Authentication
resource "aws_cognito_user_pool" "admin" {
  name = "personal-site-admin"

  # Username is email
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # MFA - TOTP required
  mfa_configuration = "ON"
  software_token_mfa_configuration {
    enabled = true
  }

  # Account recovery via email
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # No self-signup - admin creates users manually
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  # Schema - just email, no custom attributes needed
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = merge(local.common_tags, {
    Name = "personal-site-admin-pool"
  })
}

# App Client for Admin Frontend (public client - no secret)
resource "aws_cognito_user_pool_client" "admin" {
  name         = "admin-frontend"
  user_pool_id = aws_cognito_user_pool.admin.id

  # No client secret for SPA
  generate_secret = false

  # Token validity
  access_token_validity  = 1  # hours
  id_token_validity      = 1  # hours
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Auth flows for username/password + SRP
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Prevent user existence errors (security)
  prevent_user_existence_errors = "ENABLED"

  # No OAuth - using direct Cognito auth
  supported_identity_providers = ["COGNITO"]
}
