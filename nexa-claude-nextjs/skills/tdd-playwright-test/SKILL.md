---
name: tdd-playwright-test
description: >
  TDD-mode counterpart to /playwright-test. Authors Playwright E2E tests for a use case
  BEFORE implementation exists. Verifies tests fail substantively (RED gate) — i.e., tests
  ran, navigated, and failed on assertions or missing UI — never on compile/import errors.
  Used by /tdd-deliver-use-case to seed the outer loop of double-loop TDD.
---

# TDD Playwright Test (Outer Loop, RED phase)

## Instructions

Author Playwright E2E tests for $ARGUMENTS as the **first artifact of the implementation
cycle**. Implementation does not yet exist — the tests are written from spec and design
alone, and they are expected to fail.

This skill is the outer-loop **RED** author for double-loop TDD. The GREEN transition
happens in `/tdd-implement`. The post-GREEN coverage check happens in `/tdd-deliver-use-case`.

## Relationship to `/playwright-test`

Test **authoring** is identical to `/playwright-test`. Read and follow:

  `${CLAUDE_PLUGIN_ROOT}/skills/playwright-test/SKILL.md`

Treat every section of that file as binding — Inputs, Test Philosophy, Traceability
Convention, Test User Provisioning, Testcontainers Global Setup, Common Patterns,
Assertions Reference — **except** the **Workflow** section and the **DO NOT** rule that
demands `0 failed` to declare success. Those are overridden below for the RED phase.

The tests themselves must look exactly like a post-hoc `/playwright-test` test would —
the only difference is *when* they are written and *what counts as "done"*.

## Why a Separate Skill

`/playwright-test` declares success only on `0 failed`. In TDD, that semantic is wrong:
the test running against absent implementation is *supposed* to fail. Inverting that check
in-place would break the post-hoc workflow, so this skill is a sibling, not a replacement.

## RED Gate — what counts as a valid failure

After authoring, run `npx playwright test` once. Every test must reach a **substantive
failure**, not a setup or wiring failure.

**Valid RED (the test correctly demonstrates absent behaviour):**
- Assertion failure (`expect(...).toBeVisible()` timed out waiting for an element that
  doesn't render)
- Element-not-found on a selector that the design specifies should exist
- Navigation reaches the entry point but the page is empty / wrong content
- Login flow runs but the dashboard never appears

**Invalid RED — fix before declaring RED-ready:**
- Compile / TypeScript errors
- Import errors (missing helpers, bad paths)
- `[traced] UC-XXX not found` — traceability helper rejected the test registration
- Testcontainers / Docker failure
- `webServer` failed to start (Next.js build error unrelated to the use case)
- Trivially-true assertions (`expect(true).toBe(true)`, or assertions that pass without
  the feature)
- Tests that pass because they don't actually exercise the feature (e.g., asserting only
  that a page loads)

A test that passes in RED phase is also invalid — it means the assertion is too weak to
distinguish absent behaviour from present behaviour. Strengthen the assertion.

## DO NOT

All "DO NOT" items from `/playwright-test/SKILL.md` apply, **except** the rules about
declaring success on `0 failed`. In addition:

- **Do not write tests that pass in RED phase.** If a test passes before the feature exists,
  the assertion is too weak.
- **Do not implement anything to make a test pass.** That happens in `/tdd-implement`.
- **Do not stub out endpoints or pages to "set up" the test environment.** The
  Testcontainers DB and dev server are the only infrastructure that should be running.
  Empty `/login` pages, placeholder routes, or scaffolded handlers contaminate the RED
  signal.
- **Do not skip or fixme tests** to make the RED phase "clean" — every test must run
  and fail substantively.

## Workflow

1. Read the use case specification from `docs/use_cases/$ARGUMENTS.md`.
2. Read the frontend design from `docs/designs/$ARGUMENTS-design.html`.
3. Read `docs/delivery/$ARGUMENTS-iterations.md` if it exists — do not repeat fixes that
   already failed.
4. Plan the journeys — same rules as `/playwright-test`: 1 test per MSS, 1 per AF,
   business rules inline. Typical 3-8 tests per use case.
5. Ensure shared infrastructure exists exactly as `/playwright-test` requires:
   `e2e/global-setup.ts`, `e2e/global-teardown.ts`, `playwright.config.ts` (Chromium only),
   `e2e/helpers/test-user.ts`, `e2e/helpers/traced.ts`, `app/api/e2e/users/route.ts`,
   `app/api/e2e/users/[id]/route.ts`. Create from `/playwright-test` templates if missing.
   **Do not create anything else** — no placeholder pages, no stub routes for the UC.
6. Write the test files using the traceability convention from `/playwright-test/SKILL.md`
   (raw `test.describe(...)`, `uc(...)`, `meta(...)` / `bug(...)`).
7. Run `npx playwright test` once. Capture the full output.
8. **RED Gate check** — for every test:
   - It ran (Playwright launched, navigated, executed steps until failure).
   - It failed on a substantive assertion or expected element (see "RED Gate" above).
   - It did not pass.
   - It did not fail on compile / import / Testcontainers / webServer / traceability errors.
9. If any test is invalid RED, fix the test (not the implementation) and re-run from step 7.
10. Once every test is valid RED, run `/code-quality` to lint/format the test files.
11. Report back (see "What to Return").

## What to Return

A structured report with:

1. Test files created (paths).
2. Test count.
3. For each test: one-line **why it failed** — the assertion or element that surfaced the
   absent feature. This is the proof that the RED is substantive.
4. Full `npx playwright test` output, abbreviated to the per-test failure summary.
5. Confirmation that no invalid-RED failures remain (no compile / import / setup errors).

Do **not** report "tests pass" — passing tests in RED phase indicate weak assertions and
must be strengthened before returning.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Tracking

Read and follow the **Before Implementation** steps in
`${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/tracking/TRACKING.md`. In TDD mode,
authoring the RED tests counts as "Before Implementation" — the tests exist before the
code does.
