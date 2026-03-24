---
name: technical-task
description: >
  Creates technical task specification documents for engineering work that has no
  user-facing scenario: configuration, cleanup, dependency updates, infrastructure,
  and developer experience improvements. Use when the user asks to "create a technical
  task", "set up the database", "bump a dependency", "add a dev profile", "clean up code",
  or mentions infrastructure tasks, configuration changes, or maintenance work.
---

# Technical Task Specification

## Instructions

Create or update technical task specification documents for $ARGUMENTS in `docs/technical_tasks/`. Each technical task describes engineering work that does not correspond to a use case.

## DO NOT

- Write vague or unmeasurable acceptance criteria
- Mix multiple unrelated tasks in one document
- Use a technical task for work that has user-facing scenarios (use a use case instead)

## Template

Use [templates/technical-task.md](templates/technical-task.md) as the document structure.

## Example Technical Task

# Technical Task: Set Up Dev Profile

## Overview

**Task ID:** TT-001
**Task Name:** Set Up Dev Profile
**Category:** Configuration
**Goal:** Create a development profile with seed data and relaxed security so developers can run the application locally without external dependencies.
**Status:** Approved

## Acceptance Criteria

- [ ] A dev profile exists that starts the application with an in-memory or local database
- [ ] Seed data is loaded automatically when the dev profile is active
- [ ] The application starts successfully with the dev profile and no external services
- [ ] README documents how to activate the dev profile

## Affected Areas

- Application configuration files
- Database seed scripts
- README.md

## Dependencies

- None

## Workflow

1. Read existing technical tasks in `docs/technical_tasks/` to determine the next TT-XXX ID
2. Understand the task to document from the user's request or from a prerequisite discovered during UC implementation
3. Write the Overview section with category and goal
4. Define concrete, verifiable acceptance criteria
5. Identify affected areas of the codebase
6. List dependencies on other TTs or UCs
7. Set status to Draft (or Approved if the user confirms)
8. Create a GitHub tracking issue by following the **Before Implementation** steps in `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/tracking/TRACKING.md`
