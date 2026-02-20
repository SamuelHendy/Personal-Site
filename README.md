# Personal Site

Personal portfolio and hobby showcase site built with React, Python Lambda functions, and AWS infrastructure managed by Terraform.

**Live at: [samhendy.com](https://samhendy.com)**

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cloudflare │────▶│  CloudFront │────▶│   S3 (UI)   │
│   (Proxy)   │     │             │     └─────────────┘
└─────────────┘     │             │     ┌─────────────┐
                    │  /api/*     │────▶│ API Gateway │──▶ Lambda
                    │             │     └─────────────┘
                    │  /cdn/*     │────▶┌─────────────┐
                    │             │     │ S3 (Content)│
                    └─────────────┘     └─────────────┘
```

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Python Lambda functions behind API Gateway
- **Infrastructure**: Terraform (S3, DynamoDB, Lambda, CloudFront, ACM)
- **CI/CD**: GitHub Actions with label-based deployment triggers

## Project Structure

```
├── frontend/          # React frontend application
├── admin/             # Admin panel (React + DaisyUI)
├── backend/           # Python Lambda function handlers
├── terraform/         # Infrastructure as Code
│   ├── modules/
│   │   ├── app/       # Lambdas, API Gateway, CloudFront, UI bucket, Cognito
│   │   └── content/   # DynamoDB tables, content S3 buckets
│   └── main.tf
└── .github/workflows/ # CI/CD pipelines
```

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. API requests proxy to `http://localhost:5000`.

### Backend

```bash
cd backend
pip install -r requirements.txt
python dev_server.py --profile personal
```

Runs at `http://localhost:5000`. Requires AWS credentials with access to DynamoDB/S3.

## Deployment

Deployments are triggered via **PR labels**:

| Label | Effect |
|-------|--------|
| `deploy-frontend` | Build and deploy frontend to S3 |
| `deploy-admin` | Build and deploy admin panel to S3 |
| `deploy-backend` | Package and deploy Lambda functions |
| `deploy-terraform` | Run terraform plan (on PR) / apply (on merge) |

### Manual Terraform

Use the **Terraform Manual** workflow in GitHub Actions:
1. Run with `action: plan` to create a plan
2. Run with `action: apply` and the `run_id` from the plan step

## GitHub Configuration

### Repository Variables

| Variable | Description |
|----------|-------------|
| `AWS_ROLE_ARN` | ARN of the GitHub Actions IAM role |
| `UI_BUCKET_NAME` | S3 bucket for frontend (`shendy-personal-site-ui`) |
| `ADMIN_BUCKET_NAME` | S3 bucket for admin panel (`shendy-personal-site-admin`) |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

### Cloudflare DNS

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `<cloudfront-dist>.cloudfront.net` | Proxied (orange) |
| CNAME | `_acm-validation...` | `_xxx.acm-validations.aws.` | DNS only (grey) |

## Content Buckets & CDN

Content is served via CloudFront at `/cdn/*` paths, with CloudFront Functions stripping the prefix before forwarding to S3.

| CDN Path | S3 Bucket | Purpose |
|----------|-----------|---------|
| `/cdn/albums/*` | `shendy-albums` | Photo albums |
| `/cdn/watches/*` | `shendy-watches` | Watch collection images |
| `/cdn/fishtank/*` | `shendy-fishtank` | Fishtank timeline/resident images |

## DynamoDB Tables

| Table | Purpose | Key |
|-------|---------|-----|
| `watch-collection` | Watch metadata (brand, model, specs) | `Brand` + `Model` |
| `fishtank-residents` | Fish/coral resident info | `Type` + `Id` |
| `fishtank-timeline` | Fishtank event timeline | `Id` |

## Admin Panel

The admin panel is available at `samhendy.com/admin` and requires Cognito authentication with TOTP MFA.

### Setting Up Admin Access

After deploying Terraform, you need to manually create your admin user:

1. Go to **AWS Console → Cognito → User Pools → personal-site-admin**
2. Click **Create user**
3. Enter your email as the username
4. Set a temporary password
5. **Check "Mark email as verified"** (required since self-signup is disabled)
6. Click **Create user**

On first login at `/admin`:
1. Enter your email and temporary password
2. You'll be prompted to set a new password
3. Set up TOTP by scanning the QR code with an authenticator app (e.g., Duo Mobile)
4. Enter the TOTP code to complete setup

### Cognito Resources

| Resource | Name | Purpose |
|----------|------|---------|
| User Pool | `personal-site-admin` | Admin authentication |
| App Client | `admin-frontend` | Frontend auth (no secret) |

Terraform outputs `cognito_user_pool_id` and `cognito_client_id` for reference.

## License

Private repository - all rights reserved.
