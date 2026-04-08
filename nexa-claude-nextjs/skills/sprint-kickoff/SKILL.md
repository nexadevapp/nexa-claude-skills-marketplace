---
name: sprint-kickoff
description: >
  User-facing entry point to start sprint delivery. Verifies sprint preparation is
  complete, creates the sprint branch, then delegates to /sprint-deliver for autonomous execution.
user_invocable: true
arguments: none
---

# Sprint Kickoff

## Purpose

Provides the user-facing "kick off the sprint" command. Performs a quick readiness
check, creates the sprint branch, confirms with the user, then hands off to
`/sprint-deliver` for autonomous delivery of all use cases.

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Flow

### Step 1: Locate the Sprint

1. Verify `docs/sprints/next-sprint/` exists.
   - If not, stop: "No active sprint found. Run `/sprint-prepare` to start a sprint."
2. Read `docs/sprints/next-sprint/readiness-report.md`.
   - If not found, stop: "Readiness report missing. Run `/sprint-prepare` first."

### Step 2: Determine Sprint Number

1. List existing sprint folders in `docs/sprints/`:
   - Pattern: `sprint-1/`, `sprint-2/`, etc.
   - Find the highest number N
   - New sprint number = N + 1
   - If no numbered sprints exist, start with sprint-1

### Step 3: Display Sprint Summary

Present a brief summary to the user:
- Sprint number (N)
- Sprint scope (which UCs, delivery order)
- Pre-delivery action status (done / pending)
- Any blockers or warnings

### Step 4: Create the Sprint Branch

1. Ensure the working tree is clean:
   ```bash
   git status --porcelain
   ```
   If there are uncommitted changes, ask the user to commit or stash them before proceeding.

2. Create and checkout the sprint branch from main:
   ```bash
   git checkout -b sprint-<N>
   ```

3. Push the branch to remote:
   ```bash
   git push -u origin sprint-<N>
   ```

4. Confirm the branch was created:

   > **Sprint branch `sprint-<N>` created and pushed.**
   >
   > All delivery work will happen on this branch.
   > At sprint completion, a PR will be created to merge into `main`.

### Step 5: Confirm and Delegate

Ask user for confirmation to proceed with delivery:

> **Ready to kick off Sprint N?**
>
> - Branch: `sprint-<N>` (checked out)
> - Scope: [N use cases]
> - Delivery order: [list UC IDs]
>
> Proceed with delivery?

If confirmed, invoke `/sprint-deliver`.

## Relationship to /sprint-deliver

`/sprint-kickoff` is the interactive entry point — it summarizes, creates the branch, and confirms.
`/sprint-deliver` is the autonomous engine — it executes the delivery pipeline.

Users can call either directly:
- `/sprint-kickoff` — when starting a sprint (recommended)
- `/sprint-deliver` — when resuming or re-running without the branch creation / confirmation step
