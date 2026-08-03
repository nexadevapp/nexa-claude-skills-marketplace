---
name: mutation-test
description: >
  Runs StrykerJS mutation testing on the business logic delivered for a use case to measure
  whether the unit tests actually detect broken behaviour, not just execute it. Reports the
  mutation score and every surviving mutant with the assertion that would kill it. Runs
  automatically inside /deliver-use-case right after implementation, before the E2E gate;
  can also be invoked directly.
  Use when the user asks to "run mutation testing", "check test quality", "run Stryker",
  "are my tests actually testing anything", or mentions mutation score or surviving mutants.
---

# Mutation Test

## Instructions

Run mutation testing for $ARGUMENTS (a use case ID like `UC-XXX`, or a technical task `TT-XXX`)
and report which surviving mutants prove a gap in the unit tests.

Line coverage proves a line *ran*. Mutation testing proves a line is *asserted on*: Stryker
mutates the source (flips `>` to `>=`, empties a block, swaps a boolean), re-runs the tests, and
a mutant that *survives* means no test noticed the behaviour changed.

## When to use

- Automatically, as Step 3 of `/deliver-use-case`, once implementation and unit tests pass and
  before the E2E and coverage gates run. Its inputs are complete at that point — E2E and
  integration tests are excluded from the Stryker runner, so later steps cannot change the score.
- Standalone, to re-check a use case after adding tests.

## DO NOT

- Mutate E2E tests, integration tests, generated code, or `prisma/`
- Mutate the whole repository — only the files delivered for $ARGUMENTS (see Scope)
- Run the Testcontainers-backed integration tests under Stryker — each Stryker worker would
  boot its own container. Mutation testing targets unit-testable business logic
- Change production code to kill a mutant. The fix is a missing test assertion, not a code edit,
  unless the mutant reveals genuinely dead code
- Add `// Stryker disable` comments to make the score go up
- Treat an equivalent mutant as a failure — classify it and move on

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Process

### Step 1: Determine Scope

Mutate only the business logic delivered for $ARGUMENTS.

1. Collect candidate files:
   - Changed files since the delivery started: `git diff --name-only <base>` where `<base>` is
     the rollback commit recorded by `/deliver-use-case` (or `git merge-base HEAD main` when
     invoked standalone), plus untracked files from `git status --porcelain`.
   - Cross-check against the implementation files listed in `docs/use_cases/$ARGUMENTS.md` and
     `docs/delivery/$ARGUMENTS-traceability.md` if present.
2. Keep only `.ts` / `.tsx` files holding logic worth mutating: services, domain/business rules,
   validators, server actions, API route handlers, utilities.
3. Drop: test files, `page.tsx` / `layout.tsx` shells with no logic, pure presentational
   components, type-only files, generated Prisma client, config files, `messages/*.json`.

If the filtered set is empty, stop and report `NOT APPLICABLE — no mutable business logic
delivered for $ARGUMENTS`. That is not a failure.

### Step 2: Ensure Stryker Is Installed

If `stryker.config.json` does not exist, bootstrap it (once per project):

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

Create `stryker.config.json` from [templates/stryker.config.json](templates/stryker.config.json).

If `vitest.config.ts` declares a `globalSetup` (Testcontainers), also create
`vitest.mutation.config.ts` from [templates/vitest.mutation.config.ts](templates/vitest.mutation.config.ts)
— it reuses the main config without the container setup and without integration tests, so Stryker
workers run pure unit tests only.

Add to `.gitignore` if absent: `reports/mutation/` and `.stryker-tmp/`.

### Step 3: Run Stryker

Point `--mutate` at the scoped file list from Step 1:

```bash
npx stryker run --mutate "src/services/foo.ts,src/lib/bar.ts"
```

Read the score and the surviving mutants from `reports/mutation/mutation.json`.

If Stryker fails to start (no tests match, config error, missing runner), fix the configuration
and re-run once. If the *unit tests themselves* fail before mutation begins, stop — report
`BLOCKED: unit tests failing`, since mutation results are meaningless against a red suite.

### Step 4: Classify Surviving Mutants

For each survivor, decide:

| Class | Meaning | Action |
|-------|---------|--------|
| **Test gap** | The mutated behaviour is specified in the use case (an MSS step, alternative flow, or business rule) and no test asserts it | Report with the exact assertion that kills it |
| **Equivalent** | The mutant is semantically identical to the original (e.g. a boundary that is unreachable, a default that is always overwritten) | Report as equivalent, no action |
| **Not worth killing** | Logging, telemetry, defensive branch for an impossible state | Report as observation, no action |

For every **Test gap**, name the file, line, mutator, the spec item it maps to
(`FR-XXX` / `BR-XXX` / MSS step), and the concrete assertion that would kill it.

### Step 5: Report

Write `docs/delivery/$ARGUMENTS-mutation.md`:

```markdown
# Mutation Report: $ARGUMENTS

- **Mutation score:** NN.N% (killed M / total T)
- **Threshold:** 80%
- **Verdict:** PASS | PASS WITH OBSERVATIONS | FAIL
- **Scope:** [files mutated]

## Surviving Mutants

| File:Line | Mutator | Original → Mutated | Spec Item | Class | Killing Assertion |
|-----------|---------|--------------------|-----------|-------|-------------------|

## Observations

[equivalent and not-worth-killing mutants, one line each]
```

## Verdict

- **PASS** — mutation score ≥ 80% on the scoped files AND no surviving mutant is classified as
  a Test gap on a business rule or MSS step.
- **PASS WITH OBSERVATIONS** — score ≥ 80%, survivors are only equivalent / not-worth-killing.
- **FAIL** — score < 80%, or any Test gap survivor maps to a business rule or MSS step.

The threshold is on the *scoped* files, not the repository.

## Verification

The run is complete when all of these hold:

1. `reports/mutation/mutation.json` exists and its timestamp is from this run.
2. Every surviving mutant in that file appears in the report, classified.
3. `docs/delivery/$ARGUMENTS-mutation.md` exists with a verdict.

Do not report a score you did not read out of `mutation.json`.
