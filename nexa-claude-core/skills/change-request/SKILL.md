---
name: change-request
description: >
  Creates structured change request documents for intentional modifications to already-implemented
  use cases. Use when the user asks to "create a change request", "log a CR", "document a change",
  or describes a stakeholder-requested modification to existing behavior (e.g., renaming a field,
  changing validation rules, restructuring data). A change request always references exactly one
  use case and describes only the delta — the original use case remains immutable.
---

# Change Request

## Instructions

Create a change request document for $ARGUMENTS in `docs/change_requests/`. $ARGUMENTS is a
description of the requested change, a reference to a use case (`UC-XXX`) where the behavior
is currently defined, or a full GitHub issue URL.

A change request describes an **intentional, stakeholder-approved modification** to behavior
that is already implemented. It is not a bug (unintended deviation) and not a new use case
(net-new behavior). It is a delta: what changes, why, and what is affected.

## Constraint

**One change request references exactly one use case.** If a change spans multiple use cases,
create one CR per use case.

## DO NOT

- Rewrite or reproduce the full use case spec — describe only what changes
- Create a CR for unintended behavior (use `report-bug` instead)
- Create a CR for net-new behavior with no prior use case (use `use-case-spec` instead)
- Leave the E2E Test Impact section vague — enumerate specific test files and test names
- Create a CR that references more than one use case

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Template

Use [templates/change-request.md](templates/change-request.md) as the document structure.

## Example Change Request

# Change Request: Replace 'Role' field with 'Department' on User Profile form

## Overview

| | |
|---|---|
| **CR ID** | CR-001 |
| **Title** | Replace 'Role' field with 'Department' on User Profile form |
| **Status** | Open |
| **References** | UC-007: Edit User Profile |
| **Requested By** | Product — customer feedback Q1 2026 |
| **Origin** | `human-in-the-loop` |
| **GitHub Issue** | https://github.com/acme/app/issues/88 |

## Context

UC-007 currently allows users to edit their profile, which includes a free-text `role` field
stored in the `users` table. The field is displayed on the profile page and used in team listings.

## Requested Change

Replace the `role` free-text field with a `department` dropdown backed by a `departments`
lookup table. The dropdown must be populated from the database and validated server-side.
The `role` column in `users` is renamed to `department_id` (foreign key).

## Affected Layers

- [x] UI — Profile edit form: replace text input with dropdown
- [x] API — Profile update action: validate `department_id` against lookup table
- [x] Database — Rename `users.role` to `users.department_id`; add `departments` table; migrate data
- [ ] Business Logic
- [x] Tests — E2E and integration tests that reference the `role` field

## Acceptance Criteria

- [ ] Profile edit form shows a `Department` dropdown populated from the database
- [ ] Selecting a department and saving persists the correct `department_id`
- [ ] The `role` free-text field no longer appears anywhere in the UI
- [ ] Server-side validation rejects unknown `department_id` values
- [ ] Existing users have their `role` value migrated to the closest matching department

## E2E Test Impact

| Test File | Test Name | Action Required |
|-----------|-----------|-----------------|
| `e2e/profile/edit-profile.spec.ts` | `user can update role` | Update — rename to `user can update department`, replace text input interaction with dropdown selection |
| `e2e/team/team-listing.spec.ts` | `team members display role` | Update — assert `department` label instead of `role` |

**Annotation:** All updated and new E2E tests must carry both `@UC-007` and `@CR-001`.

## Related Artifacts

- **Use Case:** UC-007 (Edit User Profile) — `docs/use_cases/UC-007-edit-user-profile.md`
- **Affected Files:** `src/app/profile/`, `src/actions/profile.ts`, `prisma/schema.prisma`

## Origin Detection

Determine the **origin** of the change request from $ARGUMENTS:

- **`github-issue`** — $ARGUMENTS contains a GitHub issue URL. The issue already exists and is
  the source of truth.
- **`human-in-the-loop`** — $ARGUMENTS is a description or artifact reference with no issue URL.
  The CR document becomes the source of truth and a new GitHub issue will be created.

## Workflow

1. Check `docs/change_requests/` for existing CRs to determine the next CR-XXX ID
2. Read the referenced use case from `docs/use_cases/` to understand the current behavior
3. **If origin is `github-issue`:**
   a. Read the issue: `gh issue view <issue-number> --json title,body,labels`
   b. Extract the change description and context from the issue
   c. Set **Origin** to the full GitHub issue URL
   d. Set **GitHub Issue** to the same URL — do NOT create a new issue
4. **If origin is `human-in-the-loop`:**
   a. Gather the change description from the user's request
   b. Set **Origin** to `human-in-the-loop`
5. Write the **Context** section — describe the current behavior from the use case (2–4 sentences max)
6. Write the **Requested Change** section — describe only the delta, precisely and completely
7. Check the affected layers — mark every layer that requires code or schema changes
8. Define concrete, verifiable acceptance criteria (one criterion per observable outcome)
9. **Enumerate E2E Test Impact** — search the project's E2E test files for tests annotated with
   the referenced UC or that exercise the affected behavior; list each by file path and test name
   with the required action (Update / Add / Remove). If no E2E tests are affected, write "None"
   explicitly.
10. Set status to Open
11. Note for implementation: when this CR is delivered, the implementer must:
    - Update the affected requirement entry in `docs/requirements.md` to reflect the new desired behavior
    - Append an entry to the `## Amendments` section of the referenced UC file in this format:
      ```
      - **CR-XXX** ([date]) — [One-line summary of what changed]. Full spec: `docs/change_requests/CR-XXX-<slug>.md`
      ```
      If the UC file has no `## Amendments` section yet, add it above the `---` divider.
13. **If origin is `human-in-the-loop`:**
    a. Create a GitHub tracking issue by following the **Before Implementation** steps in
       `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`
    b. Update the CR's **GitHub Issue** field with the issue URL
14. **If origin is `github-issue`:**
    a. Follow the **Before Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`
       — the issue already exists, so only ensure the CR `.md` and the issue link to each other (no new issue is created)
