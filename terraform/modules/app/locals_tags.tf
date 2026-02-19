# ╔═════════════════════════════════════╗
# ║       COST ALLOCATION TAGS          ║
# ╚═════════════════════════════════════╝
#
# Centralized tag definitions for cost allocation and resource management.
# These tags enable AWS Cost Explorer breakdowns by component.
#
# Tag Strategy:
# - Project: High-level cost allocation (Personal-Site)
# - Component: Specific part (Frontend, Lambda, API, etc.)
# - ManagedBy: How the resource is managed (terraform)
#

locals {
  # Common tags applied to all resources
  common_tags = {
    Project   = "Personal-Site"
    ManagedBy = "terraform"
  }

  # ──────────────────────────────────────
  #              FRONTEND
  # ──────────────────────────────────────

  ui_tags = merge(local.common_tags, {
    Component = "Frontend"
  })

  cloudfront_tags = merge(local.common_tags, {
    Component = "CloudFront"
  })

  # ──────────────────────────────────────
  #            API GATEWAY
  # ──────────────────────────────────────

  api_gateway_tags = merge(local.common_tags, {
    Component = "API-Gateway"
  })

  # ──────────────────────────────────────
  #         LAMBDA FUNCTIONS
  # ──────────────────────────────────────

  lambda_common_tags = merge(local.common_tags, {
    Component = "Lambda"
  })

  lambda_health_tags = merge(local.lambda_common_tags, {
    Function = "Health"
  })

  lambda_albums_tags = merge(local.lambda_common_tags, {
    Function = "Albums"
  })

  lambda_album_detail_tags = merge(local.lambda_common_tags, {
    Function = "Album-Detail"
  })

  lambda_recently_updated_tags = merge(local.lambda_common_tags, {
    Function = "Recently-Updated"
  })

  lambda_watches_tags = merge(local.lambda_common_tags, {
    Function = "Watches"
  })

  lambda_watch_detail_tags = merge(local.lambda_common_tags, {
    Function = "Watch-Detail"
  })

  lambda_fishtank_residents_tags = merge(local.lambda_common_tags, {
    Function = "Fishtank-Residents"
  })

  lambda_fishtank_timeline_tags = merge(local.lambda_common_tags, {
    Function = "Fishtank-Timeline"
  })

  # ──────────────────────────────────────
  #               IAM
  # ──────────────────────────────────────

  iam_tags = merge(local.common_tags, {
    Component = "IAM"
  })
}
