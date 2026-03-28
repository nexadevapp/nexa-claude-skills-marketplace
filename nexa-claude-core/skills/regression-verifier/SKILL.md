---
name: regression-verifier
description: >
  Interactively walks through user journeys in a real browser via Playwright MCP to verify
  that the implementation works end-to-end. For use cases (UC-XXX), it replays the Main
  Success Scenario steps. For bugs (BUG-XXX), it replays the Steps to Reproduce. Classifies
  failures as implementation gaps, new bugs, or environment issues. Use when the user asks
  to "verify the implementation", "walk through the scenario", "check if it works in the
  browser", or mentions regression verification.
---

# Regression Verifier

## Instructions

Verify that $ARGUMENTS works end-to-end by interactively walking through its user journey
in a real browser using the Playwright MCP browser tools.

- For **UC-XXX**: replay every **Main Success Scenario** from the use case specification.
  Some use cases define multiple MSS variants (e.g., one per actor type or per mode) —
  verify all of them. Stop on the first failure.
- For **BUG-XXX**: replay the **Steps to Reproduce** from the bug report

$ARGUMENTS is a use case ID (`UC-XXX`) or a bug ID (`BUG-XXX`).

This skill requires the Playwright MCP server (provided by the nexa-claude-nextjs plugin
or equivalent).

## Inputs

| Input              | Location                        | Required               |
|--------------------|---------------------------------|------------------------|
| Use case spec      | `docs/use_cases/$ARGUMENTS.md`  | Yes (for UC-XXX)       |
| Bug report         | `docs/bugs/$ARGUMENTS.md`       | Yes (for BUG-XXX)      |
| Frontend design    | `docs/designs/$ARGUMENTS-design.html` | If exists (for UC-XXX) |

## DO NOT

- Skip any step — execute every step and verify its outcome
- Assume a step passed without taking a `browser_snapshot` to confirm the DOM state
- Continue verification after a "Test environment issue" classification — stop immediately
- Attempt to fix discovered bugs inline — report them and stop
- Modify specification, design, or bug report documents during verification

## Workflow

### Phase 1: Extract Steps

**For UC-XXX:**

1. Read `docs/use_cases/$ARGUMENTS.md`
2. Extract every **Main Success Scenario** — some use cases have a single MSS, others have
   multiple variants (e.g., separate MSS per actor type). Collect all of them as separate
   flows to walk through sequentially
3. Extract **Preconditions** — these define the required initial state
4. Read `docs/designs/$ARGUMENTS-design.html` if it exists — use it to identify selectors,
   page structure, and expected UI states for each step

**For BUG-XXX:**

1. Read `docs/bugs/$ARGUMENTS.md`
2. Extract the **Steps to Reproduce** section — these are the steps to execute
3. Extract **Expected Behavior** and **Actual Behavior** — used for failure classification

### Phase 2: Set Up Environment

1. Verify the application is running: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
   - If not running, classify as **Test environment issue** and stop
2. Set up any required preconditions:
   - For UC-XXX: satisfy the **Preconditions** (e.g., create test users, seed data, log in)
   - For BUG-XXX: set up any data the reproduction steps require
3. If the scenario requires authentication, use Playwright MCP to log in first

### Phase 3: Step-by-Step Walkthrough

For **UC-XXX** with multiple MSS flows, walk through each flow sequentially. Reset the
browser state between flows (navigate to root, re-establish preconditions). **Stop
immediately on the first failure** — do not proceed to remaining flows.

For **BUG-XXX**, walk through the single Steps to Reproduce flow.

**For each flow / step N:**

1. Execute the step using Playwright MCP browser tools:
   - `browser_navigate` for URL navigation
   - `browser_click`, `browser_fill_form`, `browser_select_option` for interactions
   - `browser_press_key`, `browser_type` for keyboard input
2. After executing, take a `browser_snapshot` to observe the DOM state
3. Verify the step outcome:
   - For UC-XXX: the system response described in the MSS step is observed in the DOM
   - For BUG-XXX: the step completes as expected (not reproducing the buggy behavior)
4. Record: **Step N — PASS** or **Step N — FAIL** with details
5. If PASS, proceed to Step N+1
6. If FAIL, go to Phase 4 (Classification) — skip all remaining flows

After all steps in all flows pass:

- For UC-XXX: verify the **Success Postconditions** are met (e.g., data created, correct
  final page state)
- For BUG-XXX: verify the **Expected Behavior** is now observed (not the **Actual Behavior**)

If everything passes: return verdict **VERIFIED**.

### Phase 4: Failure Classification

When a step fails, classify the failure:

#### Implementation Gap (UC-XXX) / Regression (BUG-XXX)

**For UC-XXX:** The step fails because the implementation does not match what the use case
specification describes. The feature is incomplete or incorrect.

**For BUG-XXX:** The failure matches or is equivalent to the **Actual Behavior** described
in the bug report. The original bug is not fixed.

**Action:**
- Stop verification
- Report the failing step and observed vs expected behavior
- Return verdict `IMPLEMENTATION GAP` (UC-XXX) or `REGRESSION` (BUG-XXX)

#### New Bug

The step fails, but the failure is DIFFERENT from what the specification/bug report
describes. Something unrelated is broken that blocks the user journey.

For UC-XXX: the step fails in a way that is not an implementation gap for this use case —
it's caused by a missing or broken feature from a different use case or system component
(e.g., missing auth session, broken middleware, missing dependency from another use case).

For BUG-XXX: the step fails, but the failure is different from the original **Actual
Behavior**.

**Action:**

1. Document the new failure: which step, what was expected, what happened instead
2. Invoke `/report-bug` to create a new bug report (e.g., `BUG-YYY`) with:
   - The observed failure as the description
   - The reproduction steps narrowed to the failing scenario
   - A `Related Artifacts` entry linking back to $ARGUMENTS
3. Return verdict `NEW BUG FOUND` — do NOT attempt to fix the new bug

#### Test Environment Issue

The failure is due to infrastructure or setup problems: application not running, database
not seeded, Docker not started, missing test data that cannot be created automatically.

**Action:**
- Stop immediately
- Report the environment issue with specific remediation steps
- Return verdict `ENVIRONMENT ISSUE`

### Phase 5: Cleanup

After verification (regardless of outcome):
- Remove any test data created in Phase 2 (test users, tokens, etc.)
- Close the browser if needed

### Phase 6: Report

Produce a structured verification report:

```
# Regression Verification: $ARGUMENTS

## Verdict

[VERIFIED | IMPLEMENTATION GAP | REGRESSION | NEW BUG FOUND | ENVIRONMENT ISSUE]

## Steps Walked

[Source: Main Success Scenario from docs/use_cases/$ARGUMENTS.md |
 Steps to Reproduce from docs/bugs/$ARGUMENTS.md]

## Step-by-Step Results

| Step | Description                | Result | Notes           |
|------|----------------------------|--------|-----------------|
| 1    | [step text from spec/bug]  | PASS   |                 |
| 2    | [step text]                | PASS   |                 |
| N    | [step text]                | FAIL   | [what happened] |

## Postcondition / Expected Behavior Check

[Confirmed / Not confirmed — details of what was observed]

## Classification (if failed)

[Implementation Gap / Regression / New Bug / Environment Issue — explanation of why
this classification was chosen]

## New Bugs Created (if applicable)

- BUG-YYY: [title] — must be delivered before re-running /deliver-use-case $ARGUMENTS
```
