---
name: deliver-use-case
description: >
  Orchestrates the full per-use-case delivery pipeline: verifies that the
  specification and design exist, implements the use case, runs an implementation
  audit, writes E2E tests, and evaluates test coverage against the spec. Iterates
  automatically until all quality gates pass. Specification and design must be
  created beforehand via /sprint-prepare, /use-case-spec, or /design-screens.
  This skill must only be invoked explicitly via /deliver-use-case or by
  /sprint-deliver — never inferred from user messages.
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

## Project Readiness Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/shared/readiness/PROJECT_READINESS.md`.

This gate verifies that cross-cutting infrastructure (middleware, error logging, security headers,
environment configuration) is in place before the pipeline begins. Without it, implemented use
cases will lack consistent auth checks, error handling, and security protections.

Do not proceed with the pipeline until all items pass or the user explicitly waives failures.

## DO NOT

- Skip any step without checking its skip condition
- Proceed past a failed verification without attempting to fix the issue
- Run more than 3 iteration cycles
- Modify the specification or design documents during fix iterations (only modify implementation code and tests)
- Ask the user for input between steps — run autonomously until the pipeline completes or exhausts retries
- Create or modify entities in `docs/entity_model.md` or `prisma/schema.prisma` during the pipeline — all entities must exist before `/deliver-use-case` is invoked

## Iteration Artifacts

Maintain a delivery log at `docs/delivery/$ARGUMENTS-iterations.md` that records every
iteration attempt. This file gives agents in subsequent iterations full context of what
was already tried and what failed, preventing repeated mistakes.

**Create the file** at the start of Step 3 (before launching the first E2E agent). Use
this format:

```markdown
# $ARGUMENTS Delivery Log

## E2E Test Iterations

### Iteration 1 — [timestamp]

#### Test Run Result
- **Result:** PASSED | FAILED (N/M passed)
- **Failures:**
  - `[test name]` — [classification: test bug / implementation bug] — [error summary]

#### Fixes Applied
- [description of each fix made]

---
```

**Update the file** after every Phase 2 verification in Step 3 and after every QA evaluation
and test run in Step 4. Append a new iteration section each time. For Step 4, add an
`## E2E Evaluation Iterations` heading and include both the QA gap analysis summary and
the subsequent test run result.

**Pass the file to agents** on every re-launch. When re-launching the E2E agent for fix
iterations (Step 3) or gap fixes (Step 4), include this in the agent prompt:

> **Previous iteration history** (read `docs/delivery/$ARGUMENTS-iterations.md` for full
> context of what was already attempted and what failed — do NOT repeat fixes that did not
> work):

This ensures agents never retry a fix that already failed.

## Entity Gate

**This check runs before any pipeline step and is a hard stop.**

After verifying artifacts exist (Step 1), identify every entity referenced in
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

## Rollback Checkpoint

Before any pipeline step begins, record the current git commit hash:

```
git rev-parse HEAD
```

Store this as the **rollback point**. If the pipeline fails and the user chooses to
roll back, all changes made after this commit will be reverted.

## Pipeline

Execute these steps in order. For each step, read the referenced SKILL.md and follow
its complete instructions (including its DO NOTs, workflow, templates, and verification)
before moving to the next step. Treat $ARGUMENTS as the argument for every sub-skill.

---

### Step 1: Verify Specification and Design Exist

The use case specification and frontend design must exist before delivery begins.
This pipeline does not generate them.

`docs/requirements.md` is a living document — `/sprint-prepare` updates it with
refined requirements (Phase 4a) before generating specs (Phase 6). All skills that
read requirements use the same canonical source: `docs/requirements.md`.

Check that both files exist:
1. `docs/use_cases/$ARGUMENTS.md`
2. `docs/designs/$ARGUMENTS-design.html`

If either is missing, stop and report:

```
PIPELINE STOPPED: Missing artifacts for $ARGUMENTS

- Specification (docs/use_cases/$ARGUMENTS.md): [exists / MISSING]
- Frontend Design (docs/designs/$ARGUMENTS-design.html): [exists / MISSING]

If this UC is part of a sprint:
  Re-run /sprint-prepare to generate them.

If this is a standalone delivery:
  Run /use-case-spec $ARGUMENTS then /design-screens $ARGUMENTS.
```

---

### Step 2: Implementation

Read and follow:
`~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/implement/SKILL.md`

**Verify:**
1. `npx next build` succeeds (or `npm run build`)
2. Unit tests pass: `npx vitest run`

If verification fails, fix the issues and re-verify. Do not proceed until both checks pass.

---

### Step 2.5: Implementation Audit (Isolated Agent)

After implementation passes build and unit tests, run an isolated audit to catch i18n gaps,
accessibility issues, and visual deviations before E2E tests are written. Fixing these issues
now avoids rewriting tests later when the UI changes.

**Skip if** the project does not use internationalization (no `messages/` directory and no
`i18n/` directory exist).

#### Phase 1: Audit (Isolated Agent)

Launch an **isolated agent** (using the Agent tool) to audit the implementation from a clean
context. The agent has no knowledge of implementation decisions — it works only from the
specification, design, message files, and the running application.

Agent prompt:
> You are an independent implementation auditor. Audit the implementation of $ARGUMENTS
> by running the following lenses **sequentially**. For each lens, collect all findings before
> moving to the next one. At the end, produce a single structured report.
>
> **Your inputs:**
> - Use case specification: `docs/use_cases/$ARGUMENTS.md`
> - Frontend design: `docs/designs/$ARGUMENTS-design.html`
> - Entity model: `docs/entity_model.md`
> - i18n configuration: `i18n/config.ts` (for supported locales)
> - Message files: `messages/*.json` (one per locale)
>
> ---
>
> **Lens 1: i18n Completeness** (file analysis — no browser)
>
> Identify every user-facing string introduced or modified for $ARGUMENTS. For each string:
> 1. Verify it uses a translation function (`t('key')`, `getTranslations`, `useTranslations`),
>    not a hardcoded literal. Search `.tsx` and `.ts` files in the implementation for:
>    - JSX text content that is not wrapped in a translation call
>    - String literals passed to UI props (`placeholder`, `title`, `aria-label`, `alt`) that
>      are not translation keys
>    - Validation error messages and toast messages that are hardcoded
> 2. For every translation key used, verify it exists in **all** locale files under `messages/`.
>    Read `i18n/config.ts` to get the list of supported locales.
> 3. Flag any key that exists in the default locale but is missing in other locales.
> 4. Flag any key in non-default locales that still has a `[TRANSLATE]` prefix (placeholder
>    not yet translated).
>
> **Lens 2: i18n Correctness** (file analysis — no browser)
>
> For every translation key used by $ARGUMENTS, compare the values across all locale files:
> 1. Verify placeholders (e.g., `{name}`, `{count}`) match across all locales — same names,
>    same count.
> 2. Verify pluralization rules are correct for each locale (if `{count}` is used, check that
>    `one`/`other` forms exist for languages that require them).
> 3. Flag translations that appear to be machine-translated gibberish or that are identical
>    to the default locale (suggesting they were not actually translated).
> 4. Flag translations where the meaning clearly diverges from the default locale.
>
> **Lens 3: Error Message i18n** (file analysis — no browser)
>
> Search all implementation files for $ARGUMENTS and identify every error-handling path:
> 1. `catch` blocks that display messages to the user
> 2. `error.tsx` boundary components
> 3. Form validation error messages (both client-side zod schemas and server-side)
> 4. Toast/notification error messages
> 5. API route error responses that surface to the UI
>
> For each error path, verify the message uses a translation key, not a hardcoded string.
> Hardcoded error strings like `"Something went wrong"`, `"Invalid input"`, or
> `"Please try again"` are findings.
>
> **Lens 4: Accessibility** (Playwright MCP — browser required)
>
> Start the dev server if not running (`npm run dev`). For each screen defined in the
> frontend design (`docs/designs/$ARGUMENTS-design.html`):
> 1. Navigate to the screen using the Playwright MCP tools (`browser_navigate`).
> 2. Run an axe-core accessibility audit by executing this in `browser_evaluate`:
>    ```javascript
>    await import('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js');
>    return axe.run();
>    ```
> 3. Collect all violations with their impact level (critical, serious, moderate, minor).
> 4. Additionally check:
>    - Every `<img>` has a non-empty `alt` attribute (or `alt=""` for decorative images with
>      `role="presentation"`)
>    - Every form input has an associated `<label>` or `aria-label`
>    - Focus order is logical (tab through the page with `browser_press_key`)
>    - Color contrast meets WCAG AA (axe-core covers this, but flag if axe is unavailable)
>
> **Lens 5: Screen Styles vs Design** (Playwright MCP — browser required)
>
> For each screen defined in the frontend design:
> 1. Open the design HTML artifact in the browser (`browser_navigate` to the file path or
>    serve it locally).
> 2. Take a snapshot of the design (`browser_snapshot`).
> 3. Navigate to the corresponding implemented screen in the running app.
> 4. Take a snapshot of the implementation (`browser_snapshot`).
> 5. Compare the two and flag:
>    - Missing components (present in design but absent in implementation)
>    - Layout deviations (different arrangement, alignment, or spacing)
>    - Typography mismatches (headings, font sizes, font weights)
>    - Color mismatches (background, text, border colors)
>    - Missing states (the design specifies an empty state but implementation doesn't handle it)
>
> **Lens 6: Loading and Error States** (Playwright MCP — browser required)
>
> For each screen that performs async operations (data fetching, form submissions):
> 1. Navigate to the screen.
> 2. Check that a `loading.tsx` or loading skeleton exists and renders (use `browser_snapshot`
>    or check the DOM for loading indicators).
> 3. Check that an `error.tsx` boundary exists for the route segment.
> 4. If the screen displays data, check that an empty state is handled (no data → meaningful
>    message, not a blank page or broken layout).
>
> ---
>
> **Output Format:**
>
> Produce a structured report with one section per lens. For each finding, include:
> - **Severity:** Critical / Major / Minor
> - **Location:** file path and line number (or screen name for Playwright lenses)
> - **Finding:** what is wrong
> - **Suggested fix:** how to fix it
>
> Use this severity guide:
> - **Critical:** User sees broken/untranslated text, app crashes, WCAG A violation
> - **Major:** Missing translation in non-default locale, WCAG AA violation, missing error state
> - **Minor:** Placeholder not yet translated (`[TRANSLATE]`), minor style deviation, missing
>   decorative alt text
>
> End the report with a summary: total findings by severity, and a verdict:
> - **PASS** — 0 Critical, 0 Major
> - **PASS WITH OBSERVATIONS** — 0 Critical, Minor findings only
> - **FAIL** — any Critical or Major findings

#### Phase 2: Fix (Main Context)

If the audit reports Critical or Major findings:

1. Fix each finding in the main context (do not modify specification or design documents).
2. Re-run `npx next build` and `npx vitest run` to confirm fixes don't break anything.
3. Re-launch the audit agent for **only the lenses that had findings** (pass the previous
   report so it knows what to re-check).

#### Iteration

Cap at **2 fix iterations**. After 2 iterations, if Critical or Major findings remain,
log them to `docs/delivery/$ARGUMENTS-iterations.md` under a `## Implementation Audit`
heading and continue to Step 3. These findings will be visible to the E2E test author
and evaluator.

**Log every iteration** — append the audit results and fixes applied to
`docs/delivery/$ARGUMENTS-iterations.md` (see Iteration Artifacts).

---

### Step 3: E2E Tests

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
> frontend design in `docs/designs/$ARGUMENTS-design.html`. Test scenarios derive from the
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

**Log the iteration** — append the test run result, failure classifications, and fixes
applied to `docs/delivery/$ARGUMENTS-iterations.md` (see Iteration Artifacts).

Then act based on the classification:

1. **Test bugs:** Re-launch the E2E agent with the error context and iteration history:
   > The following tests failed due to test issues. Fix them.
   > [paste the exact Playwright error output for each failing test]
   >
   > **Previous iteration history** (read `docs/delivery/$ARGUMENTS-iterations.md` for full
   > context of what was already attempted and what failed — do NOT repeat fixes that did not
   > work):
   After the agent returns, go back to Phase 2.

2. **Implementation bugs:** Fix the implementation in the main context (do not modify spec
   or design). Re-run `npx next build` and `npx vitest run` to confirm the fix doesn't break
   anything, then go back to Phase 2.

3. **Mixed:** Fix implementation bugs first, then re-launch the E2E agent for remaining
   test bugs.

After **3 iterations**, if tests still fail, stop and present a failure report to the user,
then follow the **Failure Recovery** procedure at the end of this document.

---

### Step 4: E2E Test Evaluation Loop (up to 3 iterations)

After E2E tests pass in Step 3, run an evaluation–fix loop to ensure the tests actually
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

**Log the QA evaluation** — append the gap analysis summary (gaps found, coverage verdict)
to `docs/delivery/$ARGUMENTS-iterations.md` under the `## E2E Evaluation Iterations` heading.

If the QA evaluation identifies gaps, launch the **E2E agent** with the gap analysis and
iteration history as input:

> You are an independent E2E test author. Read and follow the complete instructions in
> `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/playwright-test/SKILL.md`.
> Fix and extend the Playwright end-to-end tests for $ARGUMENTS.
>
> The following QA gap analysis was produced by reviewing the current tests against the
> use case specification in `docs/use_cases/$ARGUMENTS.md` and the frontend design in
> `docs/designs/$ARGUMENTS-design.html`:
>
> [paste the full QA evaluation / gap analysis report here]
>
> **Previous iteration history** (read `docs/delivery/$ARGUMENTS-iterations.md` for full
> context of what was already attempted and what failed — do NOT repeat fixes that did not
> work):
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

After the E2E agent returns, **independently verify** the tests pass (same as Step 3 Phase 2):
run `npx playwright test`, confirm 0 failed, 0 skipped, exit code 0.

**Log the test run result** — append the verification outcome (pass/fail, test counts,
errors) to `docs/delivery/$ARGUMENTS-iterations.md`.

**Post the test run outcome to the GitHub issue** (same as Step 3 — heading, iteration number,
pass/fail result, test counts, failure details if any, Playwright summary output, and the
`🤖 Generated by /deliver-use-case — E2E Test Run` footer).

If tests fail, apply the same fix loop from Step 3 to get them passing before the next
evaluation iteration.

#### Iteration

Go back to Phase 1 (QA Evaluation) with the updated tests. Repeat until the QA specialist
reports no gaps or **3 iterations** are exhausted.

After 3 iterations, if the QA specialist still reports gaps, stop and present a failure
report to the user, then follow the **Failure Recovery** procedure at the end of this
document.

## Completion

When the pipeline finishes successfully (E2E tests pass and the QA evaluation reports no
gaps), present a summary to the user and post it to the GitHub issue.

### Terminal Summary

Display the pipeline report to the user:

```
## Pipeline Complete: $ARGUMENTS

| Step                        | Status |
|-----------------------------|--------|
| Artifact Check (Spec+Design)| ...    |
| Entity Gate                 | ...    |
| Implementation              | ...    |
| Implementation Audit        | ...    |
| E2E Tests                   | ...    |
| E2E Evaluation Iterations   | N / 3  |
```

Include a **What was built** section listing the key artifacts: pages, API routes, services,
tests, and any notable implementation details.

Include a **Delivery log** line pointing to `docs/delivery/$ARGUMENTS-iterations.md`.

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

## Failure Recovery

When the pipeline fails (any step exhausts its retry limit), present the failure report
and then offer the user a choice:

```
DELIVERY FAILED: $ARGUMENTS

[failure details — failing tests, remaining gaps, or error summary]

Delivery log: docs/delivery/$ARGUMENTS-iterations.md

---

Roll back changes from this delivery attempt?

Recommended: Roll back all changes. This resets to the state before
/deliver-use-case started, removing implementation code, tests, and
the delivery log. The next attempt starts clean.

Alternative: Keep code and test files, remove only the delivery log.
Warning: the next delivery attempt will start from scratch but may
encounter conflicts with leftover code.

Roll back all changes? (Y/n)
```

### If the user chooses to roll back (default)

1. Reset to the rollback checkpoint:
   ```
   git reset --hard <saved-commit-hash>
   ```
2. Confirm to the user that all delivery changes have been reverted.

### If the user chooses to keep code

1. Delete only the delivery log:
   ```
   rm docs/delivery/$ARGUMENTS-iterations.md
   ```
2. Warn the user:
   ```
   Kept implementation code and tests. The delivery log has been removed
   so /sprint-deliver will not consider $ARGUMENTS as delivered.

   On the next /deliver-use-case run, Step 2 (Implementation) will see
   existing code and may produce conflicts or duplicates. Review the
   leftover code before re-running.
   ```
