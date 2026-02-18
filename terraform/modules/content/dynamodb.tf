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
}
