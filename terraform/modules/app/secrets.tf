# Social link destinations for /api/social/{platform} passthrough redirects.
# Update the secret value in AWS Secrets Manager to change URLs without redeploying Lambda code.
resource "aws_secretsmanager_secret" "social_links" {
  name        = "personal-site/social-links"
  description = "SOCIAL_MAP: platform slug -> HTTPS destination URL for social passthrough redirects"

  tags = merge(local.common_tags, {
    Name = "personal-site-social-links"
  })
}

resource "aws_secretsmanager_secret_version" "social_links" {
  secret_id = aws_secretsmanager_secret.social_links.id
  secret_string = jsonencode({
    SOCIAL_MAP = {
      linkedin  = "https://www.linkedin.com/in/samuel-hendy-958773179/"
      github    = "https://github.com/SamuelHendy"
      instagram = "https://instagram.com/sam.hendy_"
      unsplash  = "https://unsplash.com/@samuel_h"
      spotify   = "https://open.spotify.com/user/21yl4qbxlvja34wdtqyrs5zpy"
    }
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
