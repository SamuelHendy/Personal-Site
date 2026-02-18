# Albums bucket - IMPORT EXISTING (import block in root main.tf)
resource "aws_s3_bucket" "albums" {
  bucket = "shendy-albums"
}

# Watches bucket - NEW
resource "aws_s3_bucket" "watches" {
  bucket = "shendy-watches"
}

# Fishtank bucket - NEW
resource "aws_s3_bucket" "fishtank" {
  bucket = "shendy-fishtank"
}

# Block public access for all content buckets
resource "aws_s3_bucket_public_access_block" "albums" {
  bucket = aws_s3_bucket.albums.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "watches" {
  bucket = aws_s3_bucket.watches.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "fishtank" {
  bucket = aws_s3_bucket.fishtank.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
