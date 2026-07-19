---
name: qa-use-case
description: >
  Black-box manual QA of a delivered use case. Drives the running application in a real
  browser and plays the Main Success Scenario and alternative flows as a first-time user,
  then reports whether the acceptance criteria actually hold. Reads no source code and no
  E2E tests — it catches what the test suite structurally cannot: dead navigation, silent
  failures, blank empty states, flows that cannot be completed from the screen alone.
  Use when the user asks to "QA a use case", "manually test", "click through the app",
  "validate the flow like a user", or after /deliver-use-case as an alternative to /audit.
context: fork
---

# Manual QA of a Use Case

## Instructions

Play use case $ARGUMENTS (a use case ID like `UC-XXX`) through the running application
as a real user would, and report what actually happens.

This skill is the black-box counterpart to `/audit`. `/audit` reads the code, the
translations, and the design and checks them against the spec. This one reads none of
that. Where `/audit` asks "was it built correctly?", this asks "can a person use it?".

Run both if you want full coverage. Neither replaces the other.

## Inputs

| Input | Location |
|-------|----------|
| Use case specification | `docs/use_cases/$ARGUMENTS.md` — behavioral sections only |
| Test accounts | `docs/qa/test-accounts.md` (created on first run, see Step 2) |
| Base URL | `http://localhost:3000` unless the project says otherwise |

## DO NOT

- Read or grep source code, E2E specs, the design HTML, translation files, or config.
  Not to "understand the flow", not to "find the route", not to "check the selector".
- Modify anything. This is read-only against a running app.
- Repeat findings that are purely cosmetic deviations from the design — that is
  `/audit` Lens 5.
- Report a step as passing because an E2E test covers it. You have not read the tests
  and must not reason about them.
- Treat findings as gates. Output is advisory; a human triages.

## Process

### Step 1: Confirm the app is running

Check the base URL responds. If it does not, ask the user to start the dev server
(`npm run dev`) rather than starting it yourself — a server you started has a cold
cache and a possibly-empty database, which produces false findings.

### Step 2: Assemble the tester's context

Read **only** these sections of `docs/use_cases/$ARGUMENTS.md`: Actors, Preconditions,
Main Success Scenario, Alternative Flows, Postconditions, Business Rules, Acceptance
Criteria.

From the Actors and Preconditions, determine what the tester needs to start:

1. **Which actor role** performs the scenario.
2. **Credentials** for that role. Look in `docs/qa/test-accounts.md`. If it does not
   exist or lacks that role, ask the user for a test account and write it to that file
   so subsequent runs are unattended. Never put real production credentials there.
3. **Precondition data state** — if the preconditions assume existing data ("the user
   has at least one saved order"), ask the user how to reach that state, or confirm
   the account already satisfies it. An unmet precondition produces a false Critical
   on step 1 and invalidates the whole run.

Do not proceed until all three are resolved. A guessed login is a wasted run.

### Step 3: Spawn the walkthrough agent

Invoke the Agent tool with `subagent_type: "mss-walkthrough"`. It runs in a cold
context and has browser tools plus `Read` only — that tool restriction is what
enforces the black-box property, not the prompt.

Prompt:

> Black-box QA of $ARGUMENTS.
>
> The application is running at <base URL>. Read only the behavioral sections of
> `docs/use_cases/$ARGUMENTS.md`.
>
> Sign in as <role> with <credentials>. <Precondition setup notes, if any.>
>
> Play the Main Success Scenario one step at a time. For each step: perform the single
> action the step describes, snapshot, and record what you observed. Then play every
> alternative flow you can reach the same way.
>
> Check `browser_console_messages` and `browser_network_requests` at the end of each
> flow and report errors and 4xx/5xx responses.
>
> Reach every screen by clicking what is visible. Do not type a URL you were not given.
> If a screen cannot be reached through the UI, that is a Critical finding — record it
> and move on.
>
> Report using the Output Format in your operating manual.

### Step 4: Report

Fold the agent's report into the output below. Do not re-verify its findings by reading
code — that would defeat the point of the isolation. If a finding looks implausible,
say so and let the human check.

If a run was invalidated by an unmet precondition, say that plainly and stop. A report
from a broken starting state is worse than no report.

## Output Format

```
QA Walkthrough: $ARGUMENTS

Main Success Scenario
| # | Step (from spec) | Action taken | Observed | Verdict |
|---|------------------|--------------|----------|---------|

Alternative Flows
(one table per flow reached; list flows that could not be reached and why)

Acceptance Criteria
| Criterion | Verdict | Evidence |

Runtime Errors
(console errors, failed requests — empty section if none)

Discoverability
(anything only completable by guessing; where a first-time user would be stuck)

Findings
- Severity / Screen / What happened / Why it matters
```

**Severity guide:**

- **Critical** — an MSS step cannot be completed, a screen is unreachable through the
  UI, the app crashes, or a postcondition did not hold.
- **Major** — an alternative flow is broken, a failure is silent (no error surfaced),
  an empty state renders blank, or a step is completable only by guessing.
- **Minor** — confusing wording, awkward focus handling, avoidable extra step.

End with: **Verdict — USABLE** (0 Critical, 0 Major) | **USABLE WITH FRICTION** (Minor
only) | **NOT USABLE** (any Critical or Major).

## Verification

The run is valid only if all of the following hold. State each explicitly in the report:

1. The agent reached the MSS starting state (preconditions met, correct actor signed in).
2. Every MSS step has an observation recorded — not "assumed to work".
3. Every acceptance criterion has a verdict backed by an observation.
4. Console and network output was collected at least once.

If any is missing, the walkthrough is incomplete — re-run it rather than reporting.

## Known limitation

This skill is a finding *generator*, not a gate. The step-to-action mapping and the
pass/fail judgment are both inferred, and the app's data state is not fixed, so runs
vary. That variance is the price of an observer that is not anchored to what the
implementer already anticipated. Do not wire it into `/sprint-complete` as a blocker.
