# Sprint Branch Gate

## Instructions

Before executing this skill, verify that the current git branch is a sprint branch.
Code-writing skills (implementation, migration, testing) must never run on `main` or `master`.
All code changes happen on a sprint branch created by `/sprint-kickoff`.

## How to Check

1. Get the current branch name:
   ```bash
   git branch --show-current
   ```
2. Verify the branch name matches the pattern `sprint-*` (e.g., `sprint-1`, `sprint-2`).

## On Pass

The current branch is a sprint branch. Proceed with the skill.

## On Failure

The current branch is **not** a sprint branch. **Stop immediately** and report:

```
SPRINT BRANCH GATE — FAILED

Current branch: <branch-name>
Expected: a sprint branch (sprint-*)

Code-writing skills must run on a sprint branch, not on main/master.
Run /sprint-kickoff to create a sprint branch and start delivery.
```

Do not proceed with the skill. Do not offer to create the branch manually —
the user must go through `/sprint-kickoff` which performs readiness checks
and creates the branch from the correct base.

## Exceptions

This gate does **not** apply to:
- **Setup skills** (`/setup-*`) — these establish infrastructure and run on `main`
- **Elaboration skills** (`/requirements`, `/entity-model`, `/use-case-diagram`, `/engineer-requirements`, `/generate-wireframe`) — these produce documentation, not code
- **Construction planning skills** (`/use-case-spec`, `/design-screens`, `/sprint-prepare`, `/technical-task`) — these produce specifications and designs, not code
- **Verification skills** (`/code-review`, `/evaluate`, `/report-bug`) — these are read-only reviews
