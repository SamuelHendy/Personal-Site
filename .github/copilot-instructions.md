# Copilot instructions for Personal Site

## Project overview

This repository is the Personal Site monorepo. It contains:

- frontend/: public React app
- admin/: authenticated admin app
- backend/: Python Lambda handlers and local Flask dev server
- terraform/: AWS infrastructure as code
- docs/: architecture and operational documentation
- plans/: feature planning artifacts
- implemented/: completed implementation notes and outcomes

## Required context

Before making a change, read the relevant project guidance:

- AGENTS.md at the repo root
- docs/architecture/ADRs.md for architecture constraints
- the nearest layer doc in docs/frontend, docs/admin, docs/backend, or docs/terraform

## Working rules

- Keep frontend, admin, backend, and Terraform responsibilities separate.
- Do not bypass the Lambda/API layer from the frontend or admin app.
- Preserve the CloudFront + S3 + API Gateway + Lambda split.
- If a feature affects the public route set, update the relevant route filters and metrics logic.
- If a feature changes admin auth, routes, or API contracts, keep docs and handlers in sync.
- Prefer minimal, repo-native patterns over new frameworks or abstractions.

## Planning workflow

For any feature work, create or update a plan in the plans/ area before implementation.

Use the plan skill to generate a structured plan that includes:

- Requirements
- Design choices
- Risks or open questions
- Task breakdown with main tasks and subtasks
- Validation steps

## Implementation workflow

After the plan is reviewed and approved, use the implementation skill to execute the plan in manageable units.

Implementation should be done in small, scoped workstreams, not one large patch.

## Documentation expectations

When behavior or contracts change, update the relevant documentation in docs/ and the plan record in plans/.
