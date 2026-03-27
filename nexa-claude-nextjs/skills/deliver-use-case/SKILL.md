---
name: deliver-use-case
description: >
  Orchestrates the full per-use-case pipeline: specification, design, migration,
  implementation, testing, code review, and evaluation. Iterates automatically
  until all quality gates pass. Use when the user asks to "deliver a use case",
  "build a use case", "run the full pipeline", "implement end-to-end", or wants
  to automate the complete workflow for a use case.
---

# Deliver Use Case Pipeline

## Instructions

Run the complete pipeline for $ARGUMENTS (a use case ID like `UC-XXX`).

This skill orchestrates multiple sub-skills sequentially, verifying each step before
proceeding. If code review or evaluation finds critical issues, it loops back to fix
them automatically.

## Prerequisites

The following must exist before running this pipeline:

- `docs/requirements.md` (from `/requirements`)
- `docs/entity_model.md` (from `/entity-model`)

If any prerequisite is missing, stop and tell the user which `/command` to run first.

## DO NOT

- Skip any step without checking its skip condition
- Proceed past a failed verification without attempting to fix the issue
- Run more than 3 iteration cycles
- Modify the specification or design documents during fix iterations (only modify implementation code and tests)
- Ask the user for input between steps — run autonomously until the pipeline completes or exhausts retries
- Create or modify entities in `docs/entity_model.md` or `prisma/schema.prisma` during the pipeline — all entities must exist before `/deliver-use-case` is invoked

## Entity Gate

**This check runs before any pipeline step and is a hard stop.**

After the use case specification exists (Step 1), identify every entity referenced in
`docs/use_cases/$ARGUMENTS.md` (from scenario steps, alternative flows, business rules,
and postconditions).

1. Read `docs/entity_model.md` and verify every referenced entity is defined there.
2. Read `prisma/schema.prisma` and verify every referenced entity has a corresponding Prisma model.

**If any entity is missing from either file, STOP the pipeline immediately.** Do not
attempt to create the entity, the migration, or proceed with implementation. Report:

```
PIPELINE STOPPED: Missing entities for $ARGUMENTS

Missing from docs/entity_model.md:
- [entity name]

Missing from prisma/schema.prisma:
- [entity name]

Run /entity-model to update the entity model, then /prisma-migration to create
the database migration before re-running /deliver-use-case $ARGUMENTS.
```

## Pipeline

Execute these steps in order. For each step, read the referenced SKILL.md and follow
its complete instructions (including its DO NOTs, workflow, templates, and verification)
before moving to the next step. Treat $ARGUMENTS as the argument for every sub-skill.

---

### Step 1: Use Case Specification

**Skip if** `docs/use_cases/$ARGUMENTS.md` already exists.

Read and follow:
`~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/use-case-spec/SKILL.md`

**Verify:** The file `docs/use_cases/$ARGUMENTS.md` exists and contains Overview, Main Success Scenario,
Alternative Flows, Postconditions, and Business Rules sections.

---

### Step 2: Frontend Design

**Skip if** `docs/designs/$ARGUMENTS-design.md` already exists.

Read and follow:
`~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/frontend-design/SKILL.md`

Inputs for this step: the use case specification from Step 1, plus any wireframe in `docs/wireframes/`
matching the use case ID. See the skill's Inputs section for details.

**Verify:** The file `docs/designs/$ARGUMENTS-design.md` exists and contains at least one screen definition.

---

### Step 3: Implementation

Read and follow:
`~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/implement/SKILL.md`

**Verify:**
1. `npx next build` succeeds (or `npm run build`)
2. Unit tests pass: `npx vitest run`

If verification fails, fix the issues and re-verify. Do not proceed until both checks pass.

---

### Step 4: E2E Tests

This step has two phases: an isolated agent **writes and self-fixes** the tests, then the
main context **independently verifies** them. The main agent is the only authority that can
declare tests as passing.

#### Phase 1: Write Tests (Isolated Agent)

Launch an **isolated agent** (using the Agent tool) to write E2E tests from a clean context.
The agent must NOT have access to implementation reasoning from earlier steps — it works only
from the specification and design artifacts, so tests validate what was *designed*, not what
was *built*.

Agent prompt:
> You are an independent E2E test author. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/playwright-test/SKILL.md`.
> Write Playwright end-to-end tests for $ARGUMENTS.
> Your inputs are the use case specification in `docs/use_cases/$ARGUMENTS.md` and the
> frontend design in `docs/designs/$ARGUMENTS-design.md`. Test scenarios derive from the
> use case flows; page structure, selectors, and assertions derive from the frontend design's
> screens, components, and states.
>
> **CRITICAL RULES:**
> - Run ALL tests with `npx playwright test` — no filters, no `--grep`, no `--grep-invert`, no project subsets
> - Testcontainers provides the database — never skip DB-dependent tests; if Docker is not running, STOP and report it
> - After running tests, check the output: it must show 0 failed and exit code 0. If it shows failures or timeouts, the tests DID NOT PASS — fix them
> - Never use `test.skip()`, `test.fixme()`, or any mechanism to avoid running tests
> - Every test must have meaningful assertions that would fail if the feature were broken
>
> When you are done, return a summary listing: each test file created, the number of tests,
> and whether your own run showed them passing or failing (with error output if failing).

#### Phase 2: Independent Verification (Main Context)

**Do NOT trust the agent's reported results.** Run the tests yourself and verify:

1. Run `npx playwright test` (no filters, no `--grep`, no `--grep-invert`, no project subsets)
2. Check the output: it must show **0 failed**, **0 skipped**, and **exit code 0**
3. Confirm the number of passed tests matches the number of tests the agent wrote
4. If the output shows failures, timeouts, or errors — the tests **did not pass**

#### Fix Loop (up to 3 iterations)

If Phase 2 verification fails, **classify each failure** by reading the error output:

**Test bug** — the test itself is wrong (bad selector, missing wait, incorrect assertion,
syntax error). Indicators: `locator.click: Target closed`, `expect(locator).toHaveText`,
`waiting for selector`, element not found errors.

**Implementation bug** — the application does not behave as the spec and design require.
Indicators: wrong HTTP status, missing API route, incorrect data returned, UI renders
wrong content, server error in console output.

Then act based on the classification:

1. **Test bugs:** Re-launch the E2E agent with the error context:
   > The following tests failed due to test issues. Fix them.
   > [paste the exact Playwright error output for each failing test]
   After the agent returns, go back to Phase 2.

2. **Implementation bugs:** Fix the implementation in the main context (do not modify spec
   or design). Re-run `npx next build` and `npx vitest run` to confirm the fix doesn't break
   anything, then go back to Phase 2.

3. **Mixed:** Fix implementation bugs first, then re-launch the E2E agent for remaining
   test bugs.

After **3 iterations**, if tests still fail, stop and present a failure report to the user:
```
E2E VERIFICATION FAILED: $ARGUMENTS (3 iterations exhausted)

Failing tests:
- [test name]: [classification: test bug / implementation bug] — [one-line error summary]

Playwright output (last run):
[paste full output]
```

---

### Step 5: Code Review (Isolated)

Launch an **isolated agent** (using the Agent tool) to perform an independent code review.
The agent must NOT have access to the implementation reasoning from earlier steps.

Agent prompt:
> You are an independent code reviewer. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/code-review/SKILL.md`.
> Review the implementation for $ARGUMENTS. Return the full review report.

**If Critical findings exist:**
1. Fix the issues in the main context (do not modify the spec or design)
2. Re-run `npx next build` and `npx playwright test` — verify both pass (0 failed, exit code 0)
3. Re-launch the code review agent
4. Repeat up to 3 times

---

### Step 6: Evaluation (Isolated)

Launch an **isolated agent** (using the Agent tool) to evaluate the implementation against
the specification and design.

Agent prompt:
> You are an independent evaluator. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/evaluate/SKILL.md`.
> Evaluate the implementation for $ARGUMENTS. Return the full evaluation report.

**If verdict is FAIL:**
1. Fix the issues in the main context (do not modify the spec or design)
2. Re-run `npx next build` and `npx playwright test` — verify both pass (0 failed, exit code 0)
3. Re-launch the evaluation agent
4. Repeat up to 3 times

---

## Iteration Protocol

After completing Steps 5-6, if any fixes were made:

1. Re-run `npx next build`
2. Re-run `npx playwright test` and verify 0 failed
3. If code review had critical findings: re-run Step 5
4. If evaluation verdict was FAIL: re-run Step 6

Maximum **3 full iteration cycles**. If issues remain after 3 cycles, present the
outstanding findings to the user for manual resolution.

## Completion

When the pipeline finishes successfully (code review has no critical findings and
evaluation verdict is PASS or PASS WITH OBSERVATIONS), present a summary:

```
## Pipeline Complete: $ARGUMENTS

| Step                  | Status |
|-----------------------|--------|
| Use Case Spec         | ...    |
| Frontend Design       | ...    |
| Entity Gate           | ...    |
| Implementation        | ...    |
| E2E Tests             | ...    |
| Code Review           | ...    |
| Evaluation            | ...    |
| Iteration Cycles Used | N / 3  |
```
