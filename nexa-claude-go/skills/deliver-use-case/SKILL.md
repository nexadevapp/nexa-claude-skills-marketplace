---
name: deliver-use-case
description: >
  Orchestrates the full per-use-case delivery pipeline: writes the specification and the
  design if they are missing, implements the use case, writes E2E tests, and evaluates
  coverage against the spec. Iterates automatically until quality gates pass. The use case
  must be elaborated by /engineer-requirements first, and delivery runs in its own git
  worktree on a uc/UC-XXX branch. This skill must only be invoked explicitly via
  /deliver-use-case or by /deliver-cluster — never inferred from user messages.
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
- Create or modify entities in `docs/entity_model.md` or add migrations to `db/migrations/` during the pipeline — all entities must exist before this skill is invoked
- Sleep or wait between test retries — diagnose and fix immediately, then re-run

## Commands

Every step below uses these exact commands:

| Name | Command |
|------|---------|
| **Build** | `go tool templ generate && sqlc generate && go build ./... && go vet ./...` |
| **Unit tests** | `go test ./...` |
| **E2E tests** | `go test -tags=e2e ./e2e/...` |

Docker must be running for the E2E tests (Testcontainers).

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Worktree Setup

Delivery runs in its own git worktree so that several use cases can be delivered at the same
time without sharing a working tree.

**If `/deliver-cluster` invoked this skill,** the worktree already exists and this skill is
already running inside it. Skip to the Worktree Gate.

**If the user invoked this skill directly,** create the worktree first:

```bash
git -C <primary checkout> fetch origin main
git -C <primary checkout> worktree add ../$(basename "$PWD")-$ARGUMENTS -b uc/$ARGUMENTS origin/main
```

Then run the rest of this pipeline inside that directory. When the pipeline completes, hand the
branch to `/merge-use-case $ARGUMENTS`, which runs the merge gate and removes the worktree.

If a worktree for this use case already exists, reuse it — do not create a second one.

## Worktree Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/WORKTREE_GATE.md`.

## Delivery Log

Maintain `docs/delivery/$ARGUMENTS-iterations.md` throughout the pipeline. Create it before
Step 3; append a new section after every verification (mutation run, E2E test run, coverage
evaluation):

```markdown
# $ARGUMENTS Delivery Log

## Iteration N — [timestamp]

- **Phase:** E2E Tests | Coverage Evaluation | Mutation Testing
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
2. Each entity has a `CREATE TABLE` in a goose migration under `db/migrations/`

If any entity is missing from either file, stop immediately:

```
PIPELINE STOPPED: Missing entities for $ARGUMENTS

Missing from docs/entity_model.md: [entity names]
Missing from db/migrations/: [entity names]

Run /entity-model to update the entity model, then /db-migration to create the
database migration before re-running /deliver-use-case $ARGUMENTS.
```

## Rollback Checkpoint

Before the pipeline begins, record the current commit:

```
git rev-parse HEAD
```

Store as the rollback point for Failure Recovery.

## Commit Discipline

After every pipeline step whose verification passed, commit. Never before.

The message format is owned by the `conventional-commit` skill (nexa-claude-core). This
section owns only **when** a commit happens and which type each step uses.

Rules:
- **Green gate only.** A step commits only when its own verification passed: the build compiles
  and the tests that step touched are green. A failing gate is never committed — that is what
  Failure Recovery is for.
- **Skip empty.** If `git status --porcelain` is empty, the step changed nothing — skip the commit
  silently, do not create an empty one.
- **Stage everything the step produced**, including the delivery log: `git add -A`.
- **Never `--no-verify`.** If a pre-commit hook fails (lint),
  that is a real finding. Fix the violation, re-run the step's verification, then commit.
- **Subagents never commit.** `mutation-tester`, `playwright-test`, and `evaluate` run read-only
  against git. The main context is the only committer.
- Rollback is unaffected: `git reset --hard <rollback commit hash>` in Failure Recovery discards
  every commit these steps created.

| Step | Gate that must be green first | Commit message |
|------|-------------------------------|----------------|
| 1. Specification and Design | Definition of Ready and the fidelity checks pass | `docs($ARGUMENTS): add the specification and the design` |
| 2. Implementation | Build + `go test ./...`, no Critical DoD items | `feat($ARGUMENTS): <one-line summary>` |
| 3. Mutation Testing | `go test ./...` (only if assertions were added in Phase 2) | `test($ARGUMENTS): kill surviving mutants (NN.N%)` |
| 4. E2E Tests | `go test -tags=e2e ./e2e/...` verified in main context — `ok`, no `FAIL`, no `SKIP` | `test($ARGUMENTS): e2e coverage` |
| 5. Coverage Evaluation | gap-fix tests pass the same Step 4 Phase 2 verification | `test($ARGUMENTS): close coverage gaps` |
| Completion | spec status, traceability report, mutation report written | `docs($ARGUMENTS): mark Done + traceability` |

Step 4 and 5 fix loops may patch implementation code — when they do, re-run Build and
`go test ./...` before committing (Step 4's fix loop already requires this).

## Pipeline

---

### Step 1: Ensure Specification and Design

This step produces the artifacts the pipeline needs. It does not merely check for them.

`docs/requirements.md` is a living document — `/engineer-requirements` refines it per cluster.
All skills read that same canonical source.

**1a. Specification.** If `docs/use_cases/$ARGUMENTS.md` does not exist, run
`/use-case-spec $ARGUMENTS` (nexa-claude-core). Tell it to work from the refined requirements
for this use case's cluster (`docs/engineering/cluster-N-analysis.md`) rather than the broad
catalog, so the spec reflects the decisions already taken.

If the cluster analysis does not exist, stop:

```
PIPELINE STOPPED: $ARGUMENTS has no specification and no cluster analysis

Run /engineer-requirements first so the use case is elaborated, then re-run
/deliver-use-case $ARGUMENTS.
```

**1b. Read the Overview table.** The **Depends On** and **User Interface** rows drive the rest
of this step. If either row is missing, stop and tell the user to run `/engineer-requirements`
for this cluster — a use case without them cannot be scheduled.

**1c. Dependency check.** Every use case named in **Depends On** must have `Status: Done`. If
any does not, stop:

```
PIPELINE STOPPED: $ARGUMENTS has unmet dependencies

Blocked by: UC-XXX (Status: <status>), UC-YYY (Status: <status>)

Deliver those use cases first, or run /deliver-cluster <cluster> which schedules
dependencies automatically.
```

**1d. Design.** If **User Interface** is `No`, skip this step and record the reason in the
delivery log. Otherwise, if `docs/designs/$ARGUMENTS-design.html` does not exist, launch an
**isolated agent** (Agent tool) to produce it from a clean context. The agent must not see
implementation details or conversation history — it works only from the specification,
wireframe, entity model, and design examples.

Agent prompt:

> You are an independent frontend designer. Read and follow the complete instructions in the
> `design-screens` skill of the nexa-claude-core plugin, then create a screen design artifact
> for $ARGUMENTS.
>
> **Your inputs (read these and nothing else):**
> - Use case specification: `docs/use_cases/$ARGUMENTS.md`
> - Entity model: `docs/entity_model.md` (if it exists)
> - Wireframe: `docs/wireframes/index.html`
> - Design rules: `docs/designs/DESIGN_RULES.md` (if it exists)
> - Existing theme files in `docs/designs/` (if they exist)
> - Example files in the skill's `examples/` directory
>
> **Your output:** `docs/designs/$ARGUMENTS-design.html`
>
> Do NOT read implementation code or any file outside the inputs listed above. Your design
> must be based solely on the use case specification and the wireframe.

**Verify:** the file exists and contains at least one screen definition (check for the
`design-screen` class in the HTML).

**1e. Readiness gate.** Read `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_READY.md`
and check every item. Then check these fidelity items, which catch a spec and a design that
drifted apart before any code is written:

| Check | What fails it |
|-------|---------------|
| Requirements to specification fidelity | A functional requirement mapped to this use case has no corresponding scenario step or business rule |
| Specification to design fidelity | A Main Success Scenario step or Alternative Flow has no corresponding screen state in the design |
| Entity to specification field coverage | The design or the scenario uses a field that the entity model does not define |
| Alternative flow coverage | An Alternative Flow has no error state in the design |
| Decision provenance | A decision in the spec is tagged neither EXPLICIT nor INFERRED |

Report all failures and stop, unless the user waives them.

**Commit:** see Commit Discipline — `docs($ARGUMENTS): add the specification and the design`.

---

### Step 2: Implementation

Read and follow: `${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md`

**Verify:**
1. Build succeeds
2. `go test ./...` passes

**Definition of Done check** — after build and unit tests pass, read
`${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_DONE.md` and verify every checklist
item against the code. Fix any Critical failures (DoD items that are entirely missing) before
proceeding. Log remaining Minor items to the delivery log.

Do not proceed until both build and unit tests pass and no Critical DoD items are outstanding.

**Commit:** see Commit Discipline — `feat($ARGUMENTS): <one-line summary>`.

---

### Step 3: Mutation Testing

Before the expensive E2E and coverage gates, verify the unit tests actually *detect* broken
behaviour rather than merely executing it. Up to 1 fix iteration.

Mutation testing runs unit tests only — E2E and integration tests are excluded from the gremlins
run (integration tests sit behind the `integration` build tag, which gremlins does not set) — so its inputs are complete once Step 2 passes. It is the cheapest gate in the pipeline
and it protects the most expensive one: a surviving mutant that exposes a real logic bug is far
cheaper to fix now than after an agent has written a Playwright suite against it.

#### Phase 1: Mutation Analysis (Isolated Agent)

Spawn a **typed `mutation-tester` subagent** (not general-purpose). The agent's system prompt
is its operating manual — the `mutation-test` SKILL is loaded as identity, not as a referenced
doc.

Invoke via the Agent tool with `subagent_type: "nexa-claude-go:mutation-tester"`. Prompt:

> Run mutation testing for $ARGUMENTS.
>
> Inputs:
> - `docs/use_cases/$ARGUMENTS.md`
> - Base commit for scoping changed files: `<rollback commit hash>`
> - `docs/delivery/$ARGUMENTS-iterations.md` (prior fix attempts)
>
> Follow your operating manual (`mutation-test/SKILL.md`) to the letter. Return the verdict,
> the mutation score read from the gremlins JSON report, the files mutated, and the
> surviving-mutant table with a killing assertion for every Test gap.

#### Phase 2: Kill Surviving Mutants (Main Context)

Log the verdict and score to the delivery log under `## Mutation Testing`.

- **PASS / PASS WITH OBSERVATIONS / NOT APPLICABLE** — continue to Step 4.
- **BLOCKED** — the unit suite is red. Fix it, re-run `go test ./...`, and return to Phase 1.
- **FAIL** — add the missing unit test assertions the agent named, in the main context.
  Only Test-gap survivors mapping to a business rule or MSS step must be killed; equivalent
  and not-worth-killing survivors are left alone. Re-run `go test ./...` to confirm green,
  then return to Phase 1 once.

After 1 fix iteration with the verdict still FAIL, do **not** roll back the delivery. Record
the final score in the delivery log and the terminal summary as an advisory failure, and
continue to Step 4. Mutation score is a test-quality signal, not a correctness gate — the spec
conformance gates (Steps 4 and 5) are the ones that decide whether the use case is Done.

**Commit:** only if Phase 2 added assertions and `go test ./...` is green — see Commit
Discipline, `test($ARGUMENTS): kill surviving mutants (NN.N%)`.

---

### Step 4: E2E Tests

Two phases: an isolated agent writes and self-fixes the tests; the main context independently
verifies them. The main agent is the only authority that can declare tests as passing.

#### Phase 1: Write Tests (Isolated Agent)

Spawn a **typed `playwright-test` subagent** (not general-purpose). The agent's system
prompt is its operating manual — the `playwright-test` SKILL is loaded as identity, not
as a referenced doc. The agent runs in a cold context: it has not seen the implementation
reasoning from earlier steps, so tests validate what was *designed*, not what was *built*.

Invoke via the Agent tool with `subagent_type: "nexa-claude-go:playwright-test"`. Prompt:

> Write Playwright end-to-end tests for $ARGUMENTS.
>
> Inputs:
> - `docs/use_cases/$ARGUMENTS.md`
> - `docs/designs/$ARGUMENTS-design.html`
> - `docs/delivery/$ARGUMENTS-iterations.md` (prior fix attempts — do NOT repeat fixes
>   that already failed)
>
> Follow your operating manual (`playwright-test/SKILL.md`) to the letter. Return each
> test file created, test count, and whether your final `go test -tags=e2e ./e2e/...` run showed
> pass or fail (with full error output if failing).

#### Phase 2: Independent Verification (Main Context)

**Do NOT trust the agent's reported results.** Run the tests yourself:

1. `go test -tags=e2e -v ./e2e/...` (no `-run`, no `-skip`)
2. Confirm: no `--- FAIL`, no `--- SKIP`, exit code 0
3. Confirm the subtest count (`--- PASS` lines) matches what the agent reported

Once Phase 2 passes — **Commit:** see Commit Discipline, `test($ARGUMENTS): e2e coverage`.

#### Fix Loop (up to 2 iterations)

If Phase 2 fails, classify each failure:

- **Test bug** — bad selector, missing wait, wrong assertion, syntax error. Indicators:
  `locator.click: Target closed`, a failed `ToHaveText` / `ToBeVisible` assertion, element not found errors.
- **Implementation bug** — wrong behavior, missing route, server error, data mismatch.
  Indicators: wrong HTTP status, missing route, UI renders wrong content.

Log the iteration to the delivery log (see Delivery Log), then act:

1. **Test bugs:** Re-launch the `playwright-test` subagent with the error context and
   iteration history. Return to Phase 2.
2. **Implementation bugs:** Fix in main context. Re-run Build and
   `go test ./...` to confirm the fix doesn't break anything. Return to Phase 2.
3. **Mixed:** Fix implementation bugs first, then re-launch the `playwright-test`
   subagent for test bugs.

After 2 iterations with tests still failing, stop and follow **Failure Recovery**.

---

### Step 5: Coverage Evaluation

After E2E tests pass, evaluate coverage against the spec. Up to 2 iterations.

#### Phase 1: QA Evaluation (Isolated Agent)

Spawn a **typed `evaluate` subagent** (not general-purpose). The agent's system prompt
is its operating manual — the `evaluate` SKILL is loaded as identity, not as a referenced
doc. The agent runs in a cold context: it has not seen the implementation reasoning.

Invoke via the Agent tool with `subagent_type: "nexa-claude-core:evaluate"`. Prompt:

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
(same as Step 4 Phase 2).

Then return to Phase 1 for re-evaluation.

Once Phase 1 re-evaluation passes — **Commit:** see Commit Discipline,
`test($ARGUMENTS): close coverage gaps`.

After 2 iterations with Missing items remaining, stop and follow **Failure Recovery**.

---

## Completion

### 0. Re-run Mutation Testing If Code Changed

The Step 3 score was measured before the E2E and coverage gates ran. Those gates' fix loops
can patch implementation code in the main context, which would make the score stale.

Check whether Steps 4 or 5 modified any file in the mutated scope recorded in
`docs/delivery/$ARGUMENTS-mutation.md`. If none did — the common case, where E2E only turned
up test bugs — skip this step. If any did, re-run Phase 1 of Step 3 once; it is scoped to a
handful of files, so it is fast. Record the updated score and continue regardless of verdict.

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
| FR-XXX      | MSS Step N| `e2e/ucXXX_test.go:24` | VERIFIED |
| BR-XXX      | AF-YYY    | `e2e/ucXXX_test.go:45` | VERIFIED |
```

To find line numbers, grep the test file for BR/FR annotations introduced in the tests.

**Commit:** see Commit Discipline — `docs($ARGUMENTS): mark Done + traceability`. This is the last
commit of the delivery; the terminal summary and GitHub comment below change no files.

### 3. Terminal Summary

```
## Pipeline Complete: $ARGUMENTS

| Step                    | Status |
|-------------------------|--------|
| Specification and Design| ...    |
| Entity Gate             | ...    |
| Implementation          | ...    |
| Mutation Testing        | NN.N%  |
| E2E Tests               | ...    |
| Coverage Evaluation     | N / 2  |
```

Include a **What was built** section listing key artifacts (handlers, templ views, sqlc queries, services, tests)
and links to `docs/delivery/$ARGUMENTS-iterations.md`, `docs/delivery/$ARGUMENTS-traceability.md`,
and `docs/delivery/$ARGUMENTS-mutation.md`.

The branch `uc/$ARGUMENTS` is green but not yet on `main`.

- **If `/deliver-cluster` invoked this skill:** return control. The orchestrator sends the
  branch to the merge queue.
- **If the user invoked this skill directly:** run `/merge-use-case $ARGUMENTS` to rebase the
  branch onto `main`, run the full regression gate, merge, and remove the worktree.

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
  This discards the per-step commits this delivery created — list them first so the
  user sees what is being dropped.
Alternative: Keep code and tests, remove only the delivery log.
  Warning: Step 2 will encounter existing code on the next attempt — review before re-running.
```

Show the commits at stake before asking:

```
git log --oneline <saved-commit-hash>..HEAD
```

### Roll back (default)

```
git reset --hard <saved-commit-hash>
```

Confirm all delivery changes have been reverted, including the per-step commits.

### Keep code

The per-step commits stay. Drop only the log (it was committed by Step 2, so `git rm`):

```
git rm docs/delivery/$ARGUMENTS-iterations.md
```
