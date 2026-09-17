---
name: mutation-test
description: >
  Runs gremlins mutation testing on the Go business logic delivered for a use case to measure
  whether the unit tests actually detect broken behaviour, not just execute it. Reports the
  test efficacy and every surviving mutant with the assertion that would kill it. Runs
  automatically inside /deliver-use-case right after implementation, before the E2E gate;
  can also be invoked directly.
  Use when the user asks to "run mutation testing", "check test quality", "run gremlins",
  "are my tests actually testing anything", or mentions mutation score, test efficacy, or
  surviving mutants.
---

# Mutation Test

## Instructions

Run mutation testing for $ARGUMENTS (a use case ID like `UC-XXX`, or a technical task `TT-XXX`)
and report which surviving mutants prove a gap in the unit tests.

Line coverage proves a line *ran*. Mutation testing proves a line is *asserted on*: gremlins
mutates the source (flips `>` to `>=`, negates a conditional, swaps `+` for `-`), re-runs the
tests, and a mutant that *lives* means no test noticed the behaviour changed.

## When to use

- Automatically, as Step 3 of `/deliver-use-case`, once implementation and unit tests pass and
  before the E2E and coverage gates run. Its inputs are complete at that point — gremlins runs
  without the `integration` build tag and never touches E2E, so later steps cannot change the score.
- Standalone, to re-check a use case after adding tests.

## DO NOT

- Mutate test files, generated code (`internal/db/`, `*_templ.go`), `cmd/`, `internal/testdb/`, or
  `db/migrations/`
- Mutate the whole repository — only the code delivered for $ARGUMENTS (see Scope)
- Run with `--tags integration` or `--integration` — every mutant would boot Testcontainers.
  Mutation testing targets unit-testable business logic
- Change production code to kill a mutant. The fix is a missing test assertion, not a code edit,
  unless the mutant reveals genuinely dead code
- Add `--exclude-files` (`-E`) patterns beyond the fixed set in Step 3, or disable mutator types, to make the score go up
- Treat an equivalent mutant as a failure — classify it and move on

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Process

### Step 1: Determine Scope

Mutate only the business logic delivered for $ARGUMENTS.

1. Pick the base: the rollback commit recorded by `/deliver-use-case`, or
   `git merge-base HEAD main` when invoked standalone.
2. Collect candidate files: `git diff --name-only <base>` plus untracked files from
   `git status --porcelain`. Cross-check against the implementation files listed in
   `docs/use_cases/$ARGUMENTS.md` and `docs/delivery/$ARGUMENTS-traceability.md` if present.
3. Keep only `.go` files holding logic worth mutating: services, form `Validate()` methods,
   handlers with branching, domain rules, auth helpers.
4. Drop: `*_test.go`, `internal/db/` (sqlc), `*_templ.go` (templ), `cmd/`, `internal/testdb/`,
   route registration with no logic, type-only files.

If the filtered set is empty, stop and report `NOT APPLICABLE — no mutable business logic
delivered for $ARGUMENTS`. That is not a failure.

### Step 2: Ensure gremlins Is Installed

```bash
go tool -n gremlins
```

If that fails (the tool is not declared in `go.mod`), pin it in `go.mod` once per project:

```bash
go get -tool github.com/go-gremlins/gremlins/cmd/gremlins@latest
```

Add `reports/mutation/` to `.gitignore` if absent.

### Step 3: Run gremlins

Run from the module root. `--diff` limits mutants to code changed since the base, which is the
Step 1 scope; `--exclude-files` drops the generated and wiring code that the diff may still touch:

```bash
mkdir -p reports/mutation
go tool gremlins unleash \
  --diff "<base>" \
  -E '_test\.go$' -E '_templ\.go$' -E '^internal/db/' -E '^internal/testdb/' -E '^cmd/' \
  --output reports/mutation/gremlins.json
```

Do not pass `--threshold-efficacy`: the verdict below is computed from the report, and a
non-zero exit would hide it. Flags drift between versions — if one is rejected, check
`go tool gremlins unleash --help` and use the equivalent.

Read the result from `reports/mutation/gremlins.json`:

| Field | Meaning |
|-------|---------|
| `test_efficacy` | killed / (killed + lived), percent — **the mutation score** |
| `mutations_coverage` | percent of mutants reached by any test |
| `mutants_total`, `mutants_killed`, `mutants_lived`, `mutants_not_covered`, `mutants_not_viable` | counts |
| `files[].file_name`, `files[].mutations[]` | `line`, `column`, `type`, `status` (`KILLED`, `LIVED`, `NOT COVERED`, `TIMED OUT`, `NOT VIABLE`) |

`TIMED OUT` counts as detected. `NOT VIABLE` mutants did not compile — ignore them.

To see the mutated code for a survivor, re-run with `--output-diff-statuses lc`.

If gremlins fails to start (build error, bad flag), fix the invocation and re-run once. If the
*unit tests themselves* fail before mutation begins (`go test ./...` is red), stop — report
`BLOCKED: unit tests failing`, since mutation results are meaningless against a red suite.

### Step 4: Classify Surviving Mutants

Every `LIVED` mutant, and every `NOT COVERED` mutant, is a survivor. For each, decide:

| Class | Meaning | Action |
|-------|---------|--------|
| **Test gap** | The mutated behaviour is specified in the use case (an MSS step, alternative flow, or business rule) and no test asserts it — or no test reaches it at all (`NOT COVERED`) | Report with the exact assertion that kills it |
| **Equivalent** | The mutant is semantically identical to the original (e.g. a boundary that is unreachable, a default that is always overwritten) | Report as equivalent, no action |
| **Not worth killing** | Logging, `slog` attributes, defensive branch for an impossible state | Report as observation, no action |

For every **Test gap**, name the file, line, mutator type, the spec item it maps to
(`FR-XXX` / `BR-XXX` / MSS step), and the concrete assertion that would kill it (the table-test
case to add and what it must check).

### Step 5: Report

Write `docs/delivery/$ARGUMENTS-mutation.md`:

```markdown
# Mutation Report: $ARGUMENTS

- **Test efficacy:** NN.N% (killed M / killed + lived T)
- **Mutant coverage:** NN.N% (not covered: C)
- **Threshold:** 80% efficacy
- **Verdict:** PASS | PASS WITH OBSERVATIONS | FAIL
- **Scope:** [files mutated]

## Surviving Mutants

| File:Line | Mutator | Status | Original → Mutated | Spec Item | Class | Killing Assertion |
|-----------|---------|--------|--------------------|-----------|-------|-------------------|

## Observations

[equivalent and not-worth-killing mutants, one line each]
```

## Verdict

- **PASS** — test efficacy ≥ 80% on the scoped code AND no survivor is classified as a Test gap
  on a business rule or MSS step.
- **PASS WITH OBSERVATIONS** — efficacy ≥ 80%, survivors are only equivalent / not-worth-killing.
- **FAIL** — efficacy < 80%, or any Test gap survivor (`LIVED` or `NOT COVERED`) maps to a
  business rule or MSS step.

The threshold is on the *scoped* code, not the repository.

## Verification

The run is complete when all of these hold:

1. `reports/mutation/gremlins.json` exists and its timestamp is from this run.
2. Every `LIVED` and `NOT COVERED` mutation in that file appears in the report, classified.
3. `docs/delivery/$ARGUMENTS-mutation.md` exists with a verdict.

Do not report a score you did not read out of `gremlins.json`.
