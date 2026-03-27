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

### Step 4: Integration Tests

Read and follow:
`~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/vitest-test/SKILL.md`

**Verify:** `npx vitest run` passes (all tests, including the new integration tests).

If tests fail, fix them and re-run. Do not proceed until all tests pass.

---

### Step 4.5: Environment Preflight

**Before running e2e tests, verify the test environment is ready.**

Read and follow:
`~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/preflight/SKILL.md`

**Verify:**
1. Docker daemon is running
2. PostgreSQL container is healthy
3. Migrations have been applied
4. Dev server responds at `http://localhost:3000`

If preflight fails, fix the reported issue before proceeding. Do not skip this step.

---

### Step 5: E2E Tests (Isolated)

Launch an **isolated agent** (using the Agent tool) to write Playwright e2e tests.
The agent must NOT have access to implementation reasoning from earlier steps.

Agent prompt:
> You are an independent test author. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/playwright-test/SKILL.md`.
> Write e2e tests for $ARGUMENTS based on the use case specification and design artifact.
> Do not reference implementation details — test against the spec.
> Run the tests and return a structured PASS/FAIL result.

**If PASS:** Proceed to Step 6.

**If FAIL:**
1. Review the failure report in the main context
2. Determine if it's an implementation bug or a test assumption error
3. If implementation bug: fix the code in main context, re-run `npx playwright test`
4. If test assumption error: re-launch the isolated tester with a correction note explaining the spec clarification
5. Repeat up to 3 cycles

**Verify:** `npx playwright test` passes.

---

### Step 6: Code Review (Isolated)

Launch an **isolated agent** (using the Agent tool) to perform an independent code review.
The agent must NOT have access to the implementation reasoning from earlier steps.

Agent prompt:
> You are an independent code reviewer. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/code-review/SKILL.md`.
> Review the implementation for $ARGUMENTS. Return the full review report.

**If Critical findings exist:**
1. Fix the issues in the main context (do not modify the spec or design)
2. Re-run build and tests to verify fixes don't break anything
3. Re-launch the code review agent
4. Repeat up to 3 times

---

### Step 7: Evaluation (Isolated)

Launch an **isolated agent** (using the Agent tool) to evaluate the implementation against
the specification and design.

Agent prompt:
> You are an independent evaluator. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/evaluate/SKILL.md`.
> Evaluate the implementation for $ARGUMENTS. Return the full evaluation report.

**If verdict is FAIL:**
1. Fix the issues in the main context (do not modify the spec or design)
2. Re-run build and tests to verify fixes don't break anything
3. Re-launch the evaluation agent
4. Repeat up to 3 times

---

## Iteration Protocol

After completing Steps 6-7, if any fixes were made:

1. Re-run `npx vitest run`
2. Re-run `npx next build`
3. If code review had critical findings: re-run Step 6
4. If evaluation verdict was FAIL: re-run Step 7

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
| Integration Tests     | ...    |
| E2E Tests             | ...    |
| Code Review           | ...    |
| Evaluation            | ...    |
| Iteration Cycles Used | N / 3  |
```
