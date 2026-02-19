# Albums bucket - IMPORT EXISTING (import block in root main.tf)
resource "aws_s3_bucket" "albums" {
  bucket = "shendy-albums"

  tags = local.albums_bucket_tags
}

# Watches bucket - NEW
resource "aws_s3_bucket" "watches" {
  bucket = "shendy-watches"

  tags = local.watches_bucket_tags
}

# Fishtank bucket - NEW
resource "aws_s3_bucket" "fishtank" {
  bucket = "shendy-fishtank"

  tags = local.fishtank_bucket_tags
}

# Block public access for all content buckets
# Note: block_public_policy and restrict_public_buckets are false to allow CloudFront OAC policy
resource "aws_s3_bucket_public_access_block" "albums" {
  bucket = aws_s3_bucket.albums.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "watches" {
  bucket = aws_s3_bucket.watches.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "fishtank" {
  bucket = aws_s3_bucket.fishtank.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}
