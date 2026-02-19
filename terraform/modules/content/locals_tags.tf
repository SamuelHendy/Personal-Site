# ╔═════════════════════════════════════╗
# ║       COST ALLOCATION TAGS          ║
# ╚═════════════════════════════════════╝
#
# Centralized tag definitions for content module resources.
#

locals {
  common_tags = {
    Project   = "Personal-Site"
    ManagedBy = "terraform"
  }

  # S3 Buckets
  albums_bucket_tags = merge(local.common_tags, {
    Component = "Content-S3"
    Content   = "Albums"
  })

  watches_bucket_tags = merge(local.common_tags, {
    Component = "Content-S3"
    Content   = "Watches"
  })

  fishtank_bucket_tags = merge(local.common_tags, {
    Component = "Content-S3"
    Content   = "Fishtank"
  })

  # DynamoDB Tables
  watches_table_tags = merge(local.common_tags, {
    Component = "DynamoDB"
    Content   = "Watches"
  })

  fishtank_residents_table_tags = merge(local.common_tags, {
    Component = "DynamoDB"
    Content   = "Fishtank-Residents"
  })

  fishtank_timeline_table_tags = merge(local.common_tags, {
    Component = "DynamoDB"
    Content   = "Fishtank-Timeline"
  })
}
