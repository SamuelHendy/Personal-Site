# Watches table - IMPORT EXISTING (import block in root main.tf)
resource "aws_dynamodb_table" "watches" {
  name         = "watch-collection"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Brand"
  range_key    = "Model"

  attribute {
    name = "Brand"
    type = "S"
  }

  attribute {
    name = "Model"
    type = "S"
  }

  tags = local.watches_table_tags
}

# Fishtank residents table - NEW
resource "aws_dynamodb_table" "fishtank_residents" {
  name         = "fishtank-residents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Type"
  range_key    = "Id"

  attribute {
    name = "Type"
    type = "S"
  }

  attribute {
    name = "Id"
    type = "S"
  }

  tags = local.fishtank_residents_table_tags
}

# Fishtank timeline table - NEW
resource "aws_dynamodb_table" "fishtank_timeline" {
  name         = "fishtank-timeline"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }

  tags = local.fishtank_timeline_table_tags
}

# Site config table - stores display_config, page toggles, etc.
resource "aws_dynamodb_table" "site_config" {
  name         = "site-config"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ConfigType"
  range_key    = "ConfigKey"

  attribute {
    name = "ConfigType"
    type = "S"
  }

  attribute {
    name = "ConfigKey"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name    = "site-config"
    Purpose = "Site configuration and display settings"
  })
}
