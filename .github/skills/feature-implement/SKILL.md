# Feature implementation skill

## Purpose

Take an approved plan document from plans/ and implement it in small, reviewable chunks.

This skill is intended to follow the plan rather than improvising architecture during implementation.

## Inputs

- a plan file under plans/
- the reviewed requirements and task breakdown
- the repo guidance in AGENTS.md and docs/architecture/ADRs.md

## Required workflow

1. Read the plan file carefully.
2. Confirm the plan is approved or ready for implementation.
3. Break the work into subagent-sized workstreams based on the plan sections.
4. Implement each subtask in sequence.
5. Update docs if the feature changes behavior, contracts, or routes.
6. Run the smallest relevant validation commands before finishing.

## Recommended execution pattern

Use a small set of clear implementation streams such as:

- Frontend work
- Admin work
- Backend/API work
- Terraform or deployment work
- Docs and maintenance
- Validation

Each stream should be assigned to a focused subagent or task owner.

## Required plan execution rules

- Do not skip the design plan in favor of ad hoc changes.
- Do not mix unrelated concerns in the same implementation task.
- Keep each task scoped to one outcome.
- If the implementation reveals a mismatch with the plan, update the plan and note it clearly.
- Prefer deriving the smallest fix that matches the plan.

## Expected implementation output

The implementer should produce:

- code changes required by the plan
- any plan adjustments needed because of discovered constraints
- related documentation updates
- validation results from local checks

## Validation expectations

Validation should be proportional to the feature:

- frontend: relevant build or lint checks
- backend: run local API checks or minimal scripts when applicable
- admin: relevant UI/build validation
- terraform: plan if infrastructure is involved
- docs: ensure references stay valid

## Completion gate

The feature is not done until:

- the plan has been implemented according to the approved scope
- the relevant checks pass
- the docs are updated as needed
- any open questions are either resolved or explicitly tracked in a follow-up plan
