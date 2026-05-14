---
name: tdd-deliver-use-case
description: >
  TDD-mode counterpart to /deliver-use-case. Orchestrates the full per-use-case delivery
  pipeline in test-first order: spec/design → entity gate → RED Playwright tests
  (/tdd-playwright-test) → RED verification → /tdd-implement drives GREEN via inner Vitest
  TDD → coverage sanity check. Specification and design must exist beforehand via
  /sprint-prepare, /use-case-spec, or /design-screens. Invoke explicitly — never inferred.
---

# TDD Deliver Use Case Pipeline

## Instructions

Run the test-first delivery pipeline for $ARGUMENTS (a use case ID like `UC-XXX`).

This skill is the TDD-mode parallel to `/deliver-use-case`. Both pipelines start from the
same specification and design artifacts and end with the same `Done` status — they
differ only in the order of construction.

| Step | `/deliver-use-case` | `/tdd-deliver-use-case` |
|------|---------------------|--------------------------|
| Implementation | First | Second (test-driven) |
| E2E tests | Second (post-hoc) | First (RED-authored) |
| Coverage evaluation | Gap-finder | Sanity check (RED ensures coverage) |

## Prerequisites

- `docs/requirements.md`
- `docs/entity_model.md`
- `docs/use_cases/$ARGUMENTS.md`
- `docs/designs/$ARGUMENTS-design.html`

If any prerequisite is missing, stop and tell the user which `/command` to run first.

## Project Readiness Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/PROJECT_READINESS.md`.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/readiness/SPRINT_BRANCH_GATE.md`.

## DO NOT

- Skip any step without checking its skip condition.
- Proceed past a failed verification without attempting to fix the root cause.
- Run more than the iteration limits defined for each step.
- Modify the specification or design documents during the pipeline.
- Modify the outer E2E tests once they reach valid RED — re-spawn `tdd-playwright-test`
  instead if the tests themselves are wrong.
- Implement anything before the outer RED is verified.
- Allow `tdd-implement` to change the outer tests to make them pass.
- Sleep or wait between iterations — diagnose and re-run immediately.

## Delivery Log

Maintain `docs/delivery/$ARGUMENTS-iterations.md` throughout the pipeline. Append a new
section after every verification:

```markdown
# $ARGUMENTS TDD Delivery Log

## Iteration N — [timestamp]

- **Phase:** RED Authoring | RED Verification | GREEN Drive | Coverage Sanity
- **Result:** PASSED | FAILED (N/M)
- **Failures:** [test name] — [classification] — [summary]
- **Fixes:** [description]
```

Pass this file to every re-launched subagent: "Read `docs/delivery/$ARGUMENTS-iterations.md`
— do NOT repeat fixes that already failed."

## Entity Gate

Hard stop before any pipeline step begins.

Identify every entity referenced in `docs/use_cases/$ARGUMENTS.md`. Verify:
1. Each entity exists in `docs/entity_model.md`.
2. Each entity has a Prisma model in `prisma/schema.prisma`.

If anything is missing, stop with the same message as `/deliver-use-case` Entity Gate and
direct the user to `/entity-model` and `/prisma-migration`.

## Rollback Checkpoint

Before the pipeline begins, record the current commit:

```
git rev-parse HEAD
```

Store as the rollback point for Failure Recovery.

## Pipeline

---

### Step 1: Verify Specification and Design

Check both files exist:
1. `docs/use_cases/$ARGUMENTS.md`
2. `docs/designs/$ARGUMENTS-design.html`

If either is missing, stop with the same message as `/deliver-use-case` Step 1.

---

### Step 2: Author RED E2E Tests

Two phases: an isolated agent writes the RED tests; the main context independently
verifies the RED is substantive.

#### Phase 1: Write RED Tests (Isolated Agent)

Spawn a **typed `tdd-playwright-test` subagent** (not general-purpose). The agent runs in
a cold context: it has not seen any implementation reasoning, so tests validate what was
*designed*, not what could be *easily built*.

Invoke via the Agent tool with `subagent_type: "tdd-playwright-test"`. Prompt:

> Author RED Playwright end-to-end tests for $ARGUMENTS.
>
> Inputs:
> - `docs/use_cases/$ARGUMENTS.md`
> - `docs/designs/$ARGUMENTS-design.html`
> - `docs/delivery/$ARGUMENTS-iterations.md` (prior fix attempts — do NOT repeat fixes
>   that already failed)
>
> Implementation does not yet exist. Tests must fail substantively (assertion failures or
> missing UI), not on compile / import / Testcontainers / webServer / traceability
> errors. Follow your operating manual (`tdd-playwright-test/SKILL.md`) to the letter.
>
> Return each test file created, test count, the per-test substantive-failure summary,
> and the full `npx playwright test` output.

#### Phase 2: Independent RED Verification (Main Context)

**Do NOT trust the agent's reported results.** Re-run the tests yourself:

1. `npx playwright test` (no filters).
2. For every test, confirm:
   - It ran (Playwright launched, navigated, executed steps).
   - It failed on a substantive assertion or expected element.
   - It did not pass.
   - It did not fail on compile / import / Testcontainers / webServer / traceability errors.
3. Confirm test count matches what the agent reported.

#### Fix Loop (up to 2 iterations)

If any test is **invalid RED**, classify:

- **Trivially-true test (passes in RED)** — assertion is too weak. Re-launch
  `tdd-playwright-test` with the iteration log.
- **Setup/wiring failure** — fix the helper, template, or env (main context). Re-run
  Phase 2.
- **Traceability rejection** — missing UC/CR/BUG file. Surface to user; do not silence.

Log the iteration. After 2 iterations with invalid RED remaining, stop and follow
**Failure Recovery**.

---

### Step 3: GREEN Drive

Read and follow: `${CLAUDE_PLUGIN_ROOT}/skills/tdd-implement/SKILL.md`

The `tdd-implement` skill runs the inner Vitest unit-TDD loop driven by the failing outer
E2E. It must not modify the outer tests.

**Verification (main context, do not delegate):**
1. `npx playwright test` (no filters). Must show 0 failed, exit code 0.
2. `npx vitest run`. Must show 0 failed.
3. `npx next build` succeeds.

**Definition of Done check** — after build and tests pass, read
`${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_DONE.md` and verify every item.
Fix any Critical failures before proceeding. Log Minor items.

If any verification fails:

- **Outer E2E still fails** — relaunch `/tdd-implement` with the iteration log, up to
  2 outer iterations total. Repeated failure means the spec or design is ambiguous —
  surface, do not patch.
- **Unit tests fail** — `tdd-implement` introduced a regression; relaunch with the
  failure context.
- **Build fails** — fix in main context; this is usually trivial (type errors, missing
  imports).

After 2 outer iterations with the E2E still red, stop and follow **Failure Recovery**.

---

### Step 4: Coverage Sanity Check

In TDD mode, coverage should be near-complete by construction: tests were authored from
the spec before code existed. This step is a **sanity check**, not the primary coverage
gate it is in `/deliver-use-case`.

Spawn a **typed `evaluate` subagent** with the same prompt shape as `/deliver-use-case`
Step 4, but with this added preamble:

> NOTE: These tests were authored BEFORE implementation under TDD. Coverage gaps would
> indicate the RED-authored tests missed a spec branch — not a post-hoc oversight. Flag
> any **Missing** items as a RED-authoring deficiency rather than an implementation gap.

#### Fix Gaps (one iteration only)

If there are **Missing** items, re-launch the `tdd-playwright-test` subagent with the gap
analysis to **author additional RED tests**. Those new tests must fail (because the
corresponding behaviour was not driven by the original RED suite). Then loop back through
Step 3 to drive them GREEN.

After 1 coverage iteration with Missing items remaining, stop and follow **Failure
Recovery**.

---

## Completion

### 1. Update Spec Status

Update **Status** in `docs/use_cases/$ARGUMENTS.md` from `Implemented` to `Done`.

### 2. Traceability Report

Generate `docs/delivery/$ARGUMENTS-traceability.md` — same shape as `/deliver-use-case`
Completion step 2, plus a **TDD provenance** line per row indicating whether the test was
authored in the initial RED suite (Step 2) or as a coverage-gap fix (Step 4).

### 3. Terminal Summary

```
## TDD Pipeline Complete: $ARGUMENTS

| Step                       | Status |
|----------------------------|--------|
| Artifact Check             | ...    |
| Entity Gate                | ...    |
| RED Authoring              | N / 2  |
| RED Verification           | ...    |
| GREEN Drive                | N / 2  |
| Coverage Sanity            | ...    |
```

Include a **What was built** section and links to
`docs/delivery/$ARGUMENTS-iterations.md` and `docs/delivery/$ARGUMENTS-traceability.md`.

> To run a deep quality audit: `/audit $ARGUMENTS`

### 4. GitHub Issue Report

Same as `/deliver-use-case` Completion step 4. Footer:
`🤖 Generated by /tdd-deliver-use-case`.

---

## Failure Recovery

Same shape as `/deliver-use-case` Failure Recovery. Default to rollback via
`git reset --hard <saved-commit-hash>`. Alternative: keep code and tests, remove only the
delivery log.

In TDD mode, "keep code" is rarely the right choice — the failure usually means the RED
suite was wrong, and keeping a partially-built implementation against a flawed test set
makes the next attempt harder, not easier.
