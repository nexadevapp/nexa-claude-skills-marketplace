---
name: deliver-use-case
description: >
  Orchestrates the full per-use-case delivery pipeline: verifies spec and design exist,
  implements the use case, writes E2E tests, and evaluates coverage against the spec.
  Iterates automatically until quality gates pass. Specification and design must exist
  beforehand via /sprint-prepare, /use-case-spec, or /design-screens.
  This skill must only be invoked explicitly via /deliver-use-case or by /sprint-deliver —
  never inferred from user messages.
---

# Deliver Use Case Pipeline

## Instructions

Run the complete pipeline for $ARGUMENTS (a use case ID like `UC-XXX`).

## Prerequisites

- `docs/requirements.md` (from `/requirements`)
- `docs/entity_model.md` (from `/entity-model`)

If any prerequisite is missing, stop and tell the user which `/command` to run first.

## Project Readiness Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/PROJECT_READINESS.md`.

Do not proceed until all items pass or the user explicitly waives failures.

## DO NOT

- Skip any step without checking its skip condition
- Proceed past a failed verification without attempting to fix the issue
- Run more than 2 iteration cycles per loop
- Modify the specification or design documents during fix iterations — only modify implementation code and tests
- Ask the user for input between steps — run autonomously until the pipeline completes or exhausts retries
- Create or modify entities in `docs/entity_model.md` or `prisma/schema.prisma` during the pipeline — all entities must exist before this skill is invoked
- Sleep or wait between test retries — diagnose and fix immediately, then re-run

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Delivery Log

Maintain `docs/delivery/$ARGUMENTS-iterations.md` throughout the pipeline. Create it before
Step 3; append a new section after every verification (E2E test run, coverage evaluation):

```markdown
# $ARGUMENTS Delivery Log

## Iteration N — [timestamp]

- **Phase:** E2E Tests | Coverage Evaluation
- **Result:** PASSED | FAILED (N/M passed)
- **Failures:** [test name] — [classification: test bug / implementation bug] — [error summary]
- **Fixes:** [description of each fix applied]
```

Pass this file to every re-launched agent: "Read `docs/delivery/$ARGUMENTS-iterations.md` —
do NOT repeat fixes that already failed."

## Entity Gate

Hard stop before any pipeline step begins.

Identify every entity referenced in `docs/use_cases/$ARGUMENTS.md` (from scenario steps,
alternative flows, business rules, and postconditions). Verify:
1. Each entity exists in `docs/entity_model.md`
2. Each entity has a Prisma model in `prisma/schema.prisma`

If any entity is missing from either file, stop immediately:

```
PIPELINE STOPPED: Missing entities for $ARGUMENTS

Missing from docs/entity_model.md: [entity names]
Missing from prisma/schema.prisma: [entity names]

Run /entity-model to update the entity model, then /prisma-migration to create the
database migration before re-running /deliver-use-case $ARGUMENTS.
```

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

`docs/requirements.md` is a living document — `/sprint-prepare` updates it with refined
requirements before generating specs. All skills use the same canonical source.

If either artifact is missing, stop:

```
PIPELINE STOPPED: Missing artifacts for $ARGUMENTS

- Specification (docs/use_cases/$ARGUMENTS.md): [exists / MISSING]
- Frontend Design (docs/designs/$ARGUMENTS-design.html): [exists / MISSING]

If part of a sprint: re-run /sprint-prepare.
If standalone: run /use-case-spec $ARGUMENTS then /design-screens $ARGUMENTS.
```

---

### Step 2: Implementation

Read and follow: `${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md`

**Verify:**
1. `npx next build` succeeds
2. `npx vitest run` passes

**Definition of Done check** — after build and unit tests pass, read
`${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_DONE.md` and verify every checklist
item against the code. Fix any Critical failures (DoD items that are entirely missing) before
proceeding. Log remaining Minor items to the delivery log.

Do not proceed until both build and unit tests pass and no Critical DoD items are outstanding.

---

### Step 3: E2E Tests

Two phases: an isolated agent writes and self-fixes the tests; the main context independently
verifies them. The main agent is the only authority that can declare tests as passing.

#### Phase 1: Write Tests (Isolated Agent)

Spawn a **typed `playwright-test` subagent** (not general-purpose). The agent's system
prompt is its operating manual — the `playwright-test` SKILL is loaded as identity, not
as a referenced doc. The agent runs in a cold context: it has not seen the implementation
reasoning from earlier steps, so tests validate what was *designed*, not what was *built*.

Invoke via the Agent tool with `subagent_type: "playwright-test"`. Prompt:

> Write Playwright end-to-end tests for $ARGUMENTS.
>
> Inputs:
> - `docs/use_cases/$ARGUMENTS.md`
> - `docs/designs/$ARGUMENTS-design.html`
> - `docs/delivery/$ARGUMENTS-iterations.md` (prior fix attempts — do NOT repeat fixes
>   that already failed)
>
> Follow your operating manual (`playwright-test/SKILL.md`) to the letter. Return each
> test file created, test count, and whether your final `npx playwright test` run showed
> pass or fail (with full error output if failing).

#### Phase 2: Independent Verification (Main Context)

**Do NOT trust the agent's reported results.** Run the tests yourself:

1. `npx playwright test` (no filters)
2. Confirm: 0 failed, 0 skipped, exit code 0
3. Confirm test count matches what the agent reported

#### Fix Loop (up to 2 iterations)

If Phase 2 fails, classify each failure:

- **Test bug** — bad selector, missing wait, wrong assertion, syntax error. Indicators:
  `locator.click: Target closed`, `expect(locator).toHaveText`, element not found errors.
- **Implementation bug** — wrong behavior, missing route, server error, data mismatch.
  Indicators: wrong HTTP status, missing API route, UI renders wrong content.

Log the iteration to the delivery log (see Delivery Log), then act:

1. **Test bugs:** Re-launch the `playwright-test` subagent with the error context and
   iteration history. Return to Phase 2.
2. **Implementation bugs:** Fix in main context. Re-run `npx next build` and
   `npx vitest run` to confirm the fix doesn't break anything. Return to Phase 2.
3. **Mixed:** Fix implementation bugs first, then re-launch the `playwright-test`
   subagent for test bugs.

After 2 iterations with tests still failing, stop and follow **Failure Recovery**.

---

### Step 4: Coverage Evaluation

After E2E tests pass, evaluate coverage against the spec. Up to 2 iterations.

#### Phase 1: QA Evaluation (Isolated Agent)

Spawn a **typed `evaluate` subagent** (not general-purpose). The agent's system prompt
is its operating manual — the `evaluate` SKILL is loaded as identity, not as a referenced
doc. The agent runs in a cold context: it has not seen the implementation reasoning.

Invoke via the Agent tool with `subagent_type: "evaluate"`. Prompt:

> Review the Playwright tests for $ARGUMENTS against `docs/use_cases/$ARGUMENTS.md`
> and `docs/requirements.md`.
>
> Your report must include:
>
> 1. **Coverage Matrix** — table mapping every FR, MSS step, alternative flow, and
>    business rule to the test that covers it. Verdict: Covered / Partial / Missing.
> 2. **Gap Analysis** — for each Partial or Missing item: the FR ID or spec step, the
>    expected behavior, and what the test should assert.
> 3. **Recommendations** — prioritized gaps to fix with concrete guidance.
>
> **Severity rules:**
> - **Missing** — zero tests for an entire requirement or spec flow. Requires a fix.
> - **Partial** — a significant behavioral branch is untested. Fix only if High-priority FR
>   or a critical UC step; otherwise flag as observation.
> - **Observation** — nice-to-have improvement. Do not fix.
>
> **PASS** = every FR, MSS step, alternative flow, and business rule has at least one test,
> and no Partial on critical items. Missing edge case variations within a covered flow are
> observations, not gaps.
>
> **Do NOT flag as gaps:**
> - Testing the absence of un-built functionality
> - Initial page state when tests implicitly validate by interacting with elements
> - Error-recovery round-trips when both error and success paths are already tested individually
> - Postconditions that are the natural default
>
> Output format:
> ```
> QA Review: $ARGUMENTS
>
> Coverage Matrix
> | Target | Spec/Req Flow | Test Coverage | Verdict |
> |--------|---------------|---------------|---------|
>
> Gap Analysis (only if Partial or Missing items exist)
>
> Recommendations (only for Missing and significant Partial)
> ```

#### Phase 2: Fix Gaps (Isolated Agent)

Log the QA evaluation result to the delivery log under `## Coverage Evaluation Iterations`.

If there are **Missing** items, re-launch the `playwright-test` subagent with the gap
analysis and iteration history as input. After it returns, independently verify tests pass
(same as Step 3 Phase 2).

Then return to Phase 1 for re-evaluation.

After 2 iterations with Missing items remaining, stop and follow **Failure Recovery**.

---

## Completion

### 1. Update Spec Status

Update the **Status** in `docs/use_cases/$ARGUMENTS.md` from `Implemented` to `Done`.

This is the only point in the workflow where a UC is marked Done — it requires both a
passing implementation (set to Implemented by TRACKING.md after implementation) and a
passing coverage evaluation (this step).

### 2. Traceability Report

Generate `docs/delivery/$ARGUMENTS-traceability.md`:

```markdown
# Traceability Report: $ARGUMENTS

| Requirement | Spec Flow | Test File | Verdict |
|-------------|-----------|-----------|---------|
| FR-XXX      | MSS Step N| `e2e/UC-XXX.spec.ts:L24` | VERIFIED |
| BR-XXX      | AF-YYY    | `e2e/UC-XXX.spec.ts:L45` | VERIFIED |
```

To find line numbers, grep the test file for BR/FR annotations introduced in the tests.

### 3. Terminal Summary

```
## Pipeline Complete: $ARGUMENTS

| Step                    | Status |
|-------------------------|--------|
| Artifact Check          | ...    |
| Entity Gate             | ...    |
| Implementation          | ...    |
| E2E Tests               | ...    |
| Coverage Evaluation     | N / 2  |
```

Include a **What was built** section listing key artifacts (pages, API routes, services, tests)
and links to `docs/delivery/$ARGUMENTS-iterations.md` and `docs/delivery/$ARGUMENTS-traceability.md`.

> To run a deep quality audit (i18n, accessibility, visual fidelity): `/audit $ARGUMENTS`

### 4. GitHub Issue Report

Post the pipeline summary to the GitHub issue for $ARGUMENTS:

```
gh issue list --search "in:title $ARGUMENTS" --state all --json number,title -q '.[] | select(.title | startswith("$ARGUMENTS:")) | .number'
```

If found:
```
gh issue comment <issue-number> --body "<report>"
```

Include: pipeline status table, What was built list, and footer `🤖 Generated by /deliver-use-case`.

If no issue found, skip and inform the user.

---

## Failure Recovery

When any step exhausts its iteration limit, present:

```
DELIVERY FAILED: $ARGUMENTS

[failure details — failing tests, remaining gaps, or error summary]

Delivery log: docs/delivery/$ARGUMENTS-iterations.md

Roll back all changes from this delivery attempt? (Y/n)

Recommended: Roll back. Resets to the pre-delivery state for a clean retry.
Alternative: Keep code and tests, remove only the delivery log.
  Warning: Step 2 will encounter existing code on the next attempt — review before re-running.
```

### Roll back (default)

```
git reset --hard <saved-commit-hash>
```

Confirm all delivery changes have been reverted.

### Keep code

```
rm docs/delivery/$ARGUMENTS-iterations.md
```
