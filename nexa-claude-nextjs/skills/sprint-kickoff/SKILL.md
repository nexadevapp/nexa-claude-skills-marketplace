---
name: sprint-kickoff
description: >
  User-facing entry point to start sprint delivery. Verifies sprint preparation is
  complete, then delegates to /sprint-deliver for autonomous execution.
user_invocable: true
arguments: none
---

# Sprint Kickoff

> **Status: DRAFT — core instructions to be implemented**

## Purpose

Provides the user-facing "kick off the sprint" command. Performs a quick readiness
check, confirms with the user, then hands off to `/sprint-deliver` for autonomous
delivery of all use cases.

## Flow

1. Locate the sprint folder (`docs/sprints/next-sprint/`)
2. Read and display a brief summary of:
   - Sprint scope (which UCs, delivery order)
   - Pre-delivery action status (done / pending)
   - Any blockers
3. Ask user for confirmation to proceed
4. Invoke `/sprint-deliver`

## Relationship to /sprint-deliver

`/sprint-kickoff` is the interactive entry point — it summarizes and confirms.
`/sprint-deliver` is the autonomous engine — it executes the delivery pipeline.

Users can call either directly:
- `/sprint-kickoff` — when starting a sprint (recommended)
- `/sprint-deliver` — when resuming or re-running without the confirmation step
