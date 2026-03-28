---
name: deliver-use-case
description: >
  Orchestrates the full per-use-case pipeline: specification, design, migration,
  implementation, testing, and E2E evaluation. Iterates automatically
  until all quality gates pass. Use when the user asks to "deliver a use case",
  "build a use case", "run the full pipeline", "implement end-to-end", or wants
  to automate the complete workflow for a use case.
---

# Deliver Use Case Pipeline

## Instructions

Run the complete pipeline for $ARGUMENTS (a use case ID like `UC-XXX`).

This skill orchestrates multiple sub-skills sequentially, verifying each step before
proceeding. If the QA evaluation finds gaps in E2E test coverage, it loops back to fix
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

#### Post Test Run Outcome to GitHub Issue

After each Phase 2 verification (whether tests pass or fail), post the outcome as a comment
on the GitHub issue for `$ARGUMENTS`:

1. Find the issue number:
   ```
   gh issue list --search "in:title $ARGUMENTS" --state all --json number,title -q '.[] | select(.title | startswith("$ARGUMENTS:")) | .number'
   ```
2. If an issue is found, post the test run outcome:
   ```
   gh issue comment <issue-number> --body "<report>"
   ```
   The comment body must include:
   - **E2E Test Run — $ARGUMENTS** as the heading
   - The iteration number (e.g., "Iteration 1 of 3")
   - Overall result: **PASSED** or **FAILED**
   - Number of tests passed, failed, and skipped
   - If failed: the classification of each failure (test bug / implementation bug) and a one-line error summary
   - The full Playwright summary output (the last few lines showing pass/fail counts)
   - A footer line: `🤖 Generated by /deliver-use-case — E2E Test Run`

3. If no issue is found, skip posting and continue.

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

### Step 5: E2E Test Evaluation Loop (up to 3 iterations)

After E2E tests pass in Step 4, run an evaluation–fix loop to ensure the tests actually
cover the use case journeys. This loop iterates up to **3 times**.

#### Phase 1: QA Evaluation (Isolated Agent)

Launch an **isolated agent** (using the Agent tool) to evaluate the E2E tests against the
use case specification.

Agent prompt:
> You are a QA specialist. Review the Playwright end-to-end tests introduced for $ARGUMENTS
> and compare them against the use case specification in `docs/use_cases/$ARGUMENTS.md`.
> Let me know if there are gaps. Are the E2E tests actually validating the user journeys
> defined in the specification (main success scenario and alternative flows)?
>
> Your report MUST include:
>
> 1. **Coverage Matrix** — a table mapping every spec flow (MSS steps, each alternative flow)
>    to the test that covers it, with a verdict: Covered, Partial, or Missing.
> 2. **Gap Analysis** — for each Partial or Missing item, explain what is not tested and why
>    it matters. Be specific: name the spec step, the expected behavior, and what the test
>    should assert.
> 3. **What's Done Well** — acknowledge tests that go beyond the spec or cover smart edge cases.
> 4. **Recommendations** — prioritized list of gaps to fix, with concrete guidance on how to
>    test each one.
>
> Return the full gap analysis report.
>
> **Example output format** (for UC-001 Register):
>
> ```
> QA Review: UC-001_register.spec.ts vs UC-001_register.md
>
> Coverage Matrix
>
> ┌───────────────────────────────────────────────────────────┬─────────────────┬─────────┐
> │                         Spec Flow                         │  Test Coverage  │ Verdict │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ MSS (steps 1-10) — Register → check-your-email            │ MSS test        │ Covered │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ MSS (steps 11-14) — Email verification + redirect by type │ MSS-verify test │ Partial │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ A1 — Duplicate email                                      │ AF1 test        │ Covered │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ A2 — Weak password → correct → resubmit                   │ AF2 test        │ Covered │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ A3 — Verification link expired                            │ —               │ Missing │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ A4 — Unconfirmed email on next login                      │ —               │ Missing │
> ├───────────────────────────────────────────────────────────┼─────────────────┼─────────┤
> │ A5 — Consent not given                                    │ AF5 test        │ Covered │
> └───────────────────────────────────────────────────────────┴─────────────────┴─────────┘
>
> Gap Analysis
>
> GAP 1: Verification link expired (A3) — Not tested at all
> The spec defines a flow where an expired token shows "This verification link has expired"
> with a "Resend verification email" option. No test navigates to /verify-email with an
> expired/invalid token. This is a real user journey (24-hour expiry per BR-004).
>
> GAP 2: Unconfirmed email on next login (A4) — Not tested at all
> The spec says a user who never verified should see a "resend verification" prompt on their
> next login attempt. This crosses into login territory but is explicitly part of UC-001's scope.
>
> GAP 3: Account-type-specific redirect after verification (MSS step 14) — Not validated
> The spec says:
> - Volunteer → Onboarding Wizard (UC-003)
> - ONG → ONG data form (UC-002)
> - Company → Company data form (UC-002)
> The MSS-verify test only checks Volunteer and only asserts a link to /onboarding. It doesn't
> test ONG or Company redirects, and it doesn't actually click the CTA to confirm the redirect works.
>
> GAP 4: Verification test is synthetic, not a real journey
> MSS-verify navigates directly to /verify-email?success=true — it never hits the actual token
> validation API route (/api/auth/verify-email?token=...). The comment says "covered by unit
> tests," but from an E2E perspective, the real verification flow (token → API → redirect) is
> untested. At minimum, the test should hit the API route with a known token to validate the
> full chain.
>
> GAP 5: ONG and Company account types only partially exercised
> - MSS test: Volunteer only
> - AF1 test: uses ONG for the duplicate attempt (but doesn't complete registration as ONG)
> - AF2 test: uses Company (completes registration)
> - No test registers as ONG through to the check-your-email screen and verifies ONG-specific behavior
>
> GAP 6: Email format validation not tested
> The spec says step 7 validates email format. No test submits an invalid email and checks for
> an inline error.
>
> GAP 7: No assertion on backend state
> The spec's postconditions state: Account created with status "PENDING", email_confirmed = false,
> auth_provider = "EMAIL", consent flags set to true, onboarding_completed = false. No test
> queries the database or API to verify these postconditions. E2E tests can validate backend state
> via API calls — without it, you're only testing the UI facade.
>
> What's Done Well
>
> - The consent test (AF5) is thorough — it tests partial consent and verifies it still blocks.
> - The AF-no-account-type test covers a scenario the spec doesn't explicitly call out — good
>   defensive testing.
> - Password strength indicator assertions go beyond the spec to validate UX quality.
> - Navigation is tested from the landing page (not just /register), validating the real entry point.
>
> Recommendations (Priority Order)
>
> 1. Add A3 test — navigate to /verify-email?token=expired-token and assert the expired message
>    + resend option
> 2. Add email format validation test — submit with invalid email, assert inline error
> 3. Add ONG/Company verification redirect tests — register as each type, verify type-appropriate
>    redirect destination
> 4. Add backend state assertions — after registration, call an API or query DB to confirm account
>    status, consent flags, auth_provider
> 5. Consider A4 test — register without verifying, attempt login, assert resend prompt (may depend
>    on UC-004 login being implemented)
> ```

#### Post Gap Analysis to GitHub Issue

After the QA evaluation completes, post the full gap analysis report as a comment on the
GitHub issue for `$ARGUMENTS`:

1. Find the issue number:
   ```
   gh issue list --search "in:title $ARGUMENTS" --state all --json number,title -q '.[] | select(.title | startswith("$ARGUMENTS:")) | .number'
   ```
2. If an issue is found, post the gap analysis:
   ```
   gh issue comment <issue-number> --body "<report>"
   ```
   The comment body must include:
   - **QA Gap Analysis — $ARGUMENTS** as the heading
   - The iteration number (e.g., "Evaluation Iteration 1 of 3")
   - The full gap analysis report from the QA specialist (Coverage Matrix, Gap Analysis, What's Done Well, Recommendations)
   - A footer line: `🤖 Generated by /deliver-use-case — QA Evaluation`

3. If no issue is found, skip posting and continue.

#### Phase 2: Fix E2E Tests (Isolated Agent)

If the QA evaluation identifies gaps, launch the **E2E agent** with the gap analysis as input:

> You are an independent E2E test author. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/playwright-test/SKILL.md`.
> Fix and extend the Playwright end-to-end tests for $ARGUMENTS.
>
> The following QA gap analysis was produced by reviewing the current tests against the
> use case specification in `docs/use_cases/$ARGUMENTS.md` and the frontend design in
> `docs/designs/$ARGUMENTS-design.md`:
>
> [paste the full QA evaluation / gap analysis report here]
>
> Address every identified gap. Ensure all user journeys from the specification are covered.
>
> **CRITICAL RULES:**
> - Run ALL tests with `npx playwright test` — no filters, no `--grep`, no `--grep-invert`, no project subsets
> - Testcontainers provides the database — never skip DB-dependent tests; if Docker is not running, STOP and report it
> - After running tests, check the output: it must show 0 failed and exit code 0. If it shows failures or timeouts, the tests DID NOT PASS — fix them
> - Never use `test.skip()`, `test.fixme()`, or any mechanism to avoid running tests
> - Every test must have meaningful assertions that would fail if the feature were broken
>
> When you are done, return a summary listing: each test file created/modified, the number
> of tests, and whether your own run showed them passing or failing (with error output if failing).

After the E2E agent returns, **independently verify** the tests pass (same as Step 4 Phase 2):
run `npx playwright test`, confirm 0 failed, 0 skipped, exit code 0.

**Post the test run outcome to the GitHub issue** (same as Step 4 — heading, iteration number,
pass/fail result, test counts, failure details if any, Playwright summary output, and the
`🤖 Generated by /deliver-use-case — E2E Test Run` footer).

If tests fail, apply the same fix loop from Step 4 to get them passing before the next
evaluation iteration.

#### Iteration

Go back to Phase 1 (QA Evaluation) with the updated tests. Repeat until the QA specialist
reports no gaps or **3 iterations** are exhausted.

After 3 iterations, if the QA specialist still reports gaps, present a report to the user:
```
E2E EVALUATION FAILED: $ARGUMENTS (3 iterations exhausted)

Remaining gaps:
- [gap description from latest QA evaluation]
```

## Completion

When the pipeline finishes successfully (E2E tests pass and the QA evaluation reports no
gaps), present a summary to the user and post it to the GitHub issue.

### Terminal Summary

Display the pipeline report to the user:

```
## Pipeline Complete: $ARGUMENTS

| Step                        | Status |
|-----------------------------|--------|
| Use Case Spec               | ...    |
| Frontend Design             | ...    |
| Entity Gate                 | ...    |
| Implementation              | ...    |
| E2E Tests                   | ...    |
| E2E Evaluation Iterations   | N / 3  |
```

Include a **What was built** section listing the key artifacts: pages, API routes, services,
tests, and any notable implementation details.

### GitHub Issue Report

Post the pipeline report as a comment on the GitHub issue for `$ARGUMENTS`:

1. Find the issue number:
   ```
   gh issue list --search "in:title $ARGUMENTS" --state all --json number,title -q '.[] | select(.title | startswith("$ARGUMENTS:")) | .number'
   ```
2. If an issue is found, post the report:
   ```
   gh issue comment <issue-number> --body "<report>"
   ```
   The comment body must include:
   - The pipeline status table (same as the terminal summary above)
   - The **What was built** list
   - A footer line: `🤖 Generated by /deliver-use-case`

3. If no issue is found, skip this step and inform the user that no GitHub issue was found
   for `$ARGUMENTS` so the report was not posted.
