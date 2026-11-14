# Operations and Release Guide

This guide documents how the site is actually deployed and maintained in practice.

## 1. Deployment model

The deployment flow is defined in [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) and is driven by pull request labels.

### Trigger

Deployments run when a PR is merged into `main`:

```yaml
on:
  pull_request:
    branches:
      - main
    types: [closed]
```

The deploy job then checks labels on the merged PR and only runs the jobs matching those labels.

### Labels and jobs

The workflow checks for the following labels:

- `deploy-frontend`
- `deploy-backend`
- `deploy-terraform`
- `deploy-admin`

If present, the merged PR triggers the corresponding job.

### Important operational behavior

- This is a single production deployment flow.
- There is no separate stage environment in the current repo configuration.
- The repo owner or maintainer decides what gets promoted by setting the labels on the PR before merge.
- Terraform changes are applied through the deployment workflow after the PR is merged.

## 2. Terraform and infra deployment

Infrastructure is owned by Terraform in [terraform](../../terraform).

The flow is:

1. A PR is opened and a Terraform plan is generated as part of the plan workflow.
2. The PR is reviewed and approved.
3. The label `deploy-terraform` is set on the PR.
4. The PR is merged.
5. The workflow runs the Terraform apply job using the AWS role configured in GitHub variables.

This means the implementation is intentionally review-first and deploy-controlled by PR labels rather than ad hoc shell commands.

## 3. Backend deployment

The backend deployment job is a separate workflow triggered by the `deploy-backend` label.

That job packages and deploys the Lambda-based API layer without changing the public frontend or admin app unless their labels are also present.

The backend is not a monolith in the usual sense; it is a collection of Lambda handlers under [backend](../../backend).

## 4. Frontend and admin deployment

The frontend and admin apps are both built and deployed as S3-hosted static assets behind CloudFront.

The deployment job uses the repo variables:

- `AWS_ROLE_ARN`
- `UI_BUCKET_NAME`
- `ADMIN_BUCKET_NAME` (if configured for admin asset deployment)
- `CLOUDFRONT_DISTRIBUTION_ID`

These values are wired through GitHub Actions and then the deployment job invalidates CloudFront as needed.

## 5. AWS local requirements

Your laptop does not need to be configured to deploy the app every time if you are using the GitHub deployment flow.

However, local operational work may still require:

- AWS CLI if you want to inspect resources manually
- a local AWS profile if you want to run dev server code against AWS-backed services
- Terraform locally if you want to run a plan or apply outside GitHub Actions

The repo expects that the AWS account and Terraform state resources are already configured. This is not something the app code itself creates.

## 6. Production assumptions

This project assumes:

- CloudFront fronts the site
- S3 hosts the static app bundles
- API Gateway + Lambda serve the API
- DynamoDB stores site data
- Cognito protects the admin app
- CloudFront access logs feed the analytics system

That is all infrastructure-owned and should be treated as a runtime contract, not app-local state.

## 7. What to do when changing infrastructure

When changing Terraform or infra-sensitive behavior:

1. open a PR with the appropriate Terraform-related changes
2. run the plan review
3. confirm the plan is expected
4. merge with the `deploy-terraform` label
5. let the apply job run before or alongside other app deploys if the infra changes affect routing or auth

## 8. What to do when changing app code

When changing frontend, admin, or backend behavior:

1. open a PR
2. add the relevant deployment label(s)
3. merge the PR when ready
4. let the GitHub deploy workflow handle deployment in the correct order

This is the practical release pattern for the repo.
