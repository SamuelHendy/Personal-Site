# Planning area

This directory is the shared workspace for feature planning before implementation.

## Purpose

Use this area to capture design intent, requirements, technical choices, and implementation task breakdowns before making code changes.

## Structure

- plans/active/ — current, in-review feature plans
- plans/archive/ — completed or superseded plans
- plans/PLAN_TEMPLATE.md — reusable template for new plans

## Recommended workflow

1. Draft a plan with the feature planning skill.
2. Review it against repo architecture and product requirements.
3. Ask clarifying questions if the plan is missing anything critical.
4. If approved, hand the plan to the implementation skill.
5. Move completed plans to archive/ when they are implemented.

## Review expectations

A plan should answer:

- What problem are we solving?
- What are the requirements?
- Which app layer owns the behavior?
- What are the design choices and constraints?
- What exact tasks need to be implemented?
- How will we validate the result?
