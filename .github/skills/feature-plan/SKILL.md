# Feature planning skill

## Purpose

Create a thoughtful implementation plan for a requested feature in this repository.

This skill is meant to turn a vague idea into a concrete plan file under plans/ that an engineer or AI agent can implement safely.

## Inputs

The user gives a feature or change request, such as:

- add a new page
- add a new admin feature
- change an API contract
- improve analytics
- update deployment behavior

## Required workflow

1. Read the repo-level guidance first.
   - Review AGENTS.md
   - Review docs/architecture/ADRs.md
   - Review the relevant layer docs as needed

2. Inspect the relevant code paths.
   - frontend app routes and page patterns
   - admin app screens and forms
   - backend Lambda handlers
   - Terraform modules and deployment flow

3. Clarify unknowns before finalizing the plan.
   - Ask concise, targeted questions if requirements, intended UX, or missing constraints are unclear.
   - Keep this to a short discussion instead of broad exploration.

4. Produce a feature plan in the plans/ directory.
   - Create a new markdown file under plans/active/ or a feature-specific file under plans/
   - Keep the filename descriptive, such as feature-name-plan.md

## Required plan structure

Each plan must contain:

### Requirements

- user-facing feature goals
- technical requirements
- business or product constraints
- data or auth requirements
- any environment or deployment concerns

### Design choices

- likely route structure and screen flow
- API contract changes or data access pattern
- admin vs public frontend split
- Terraform or AWS impacts if relevant
- edge cases or trade-offs

### Task list

A two-tier task list:

- Section-level workstreams, such as Frontend, Backend, Admin, Infra, Docs, Validation
- Subtasks under each section that define the actual work

### Open questions / to-be-fleshed-out

Add a section for details not yet decided.

This should not block planning; it should clearly mark items that still require user input.

### Validation

List how the work will be validated:

- local app checks
- lint/build commands
- API contract checks
- Terraform validation if applicable

## Grill-me behavior

If the feature is not well-defined, the agent should ask targeted questions until it can draft a credible plan.

Prefer a short list of questions such as:

- What should the user flow look like?
- Which app area owns this (public, admin, backend, infra)?
- Do you want a new route or only a data change?
- Is this a production-facing feature or an internal tooling change?
- Are there any required permissions, providers, or UX constraints?

## Output expectations

The final output should be a ready-to-review plan document and a brief summary of key assumptions and open questions.

It should be written in a way that another engineer can review, refine, and then hand off to the implementation skill.
