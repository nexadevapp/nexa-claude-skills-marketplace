---
name: test-efficacy-audit
description: >
  Writes a dated test efficacy audit report for the current repository: a baseline unit test run
  with code coverage, a time-boxed mutation testing run on the business logic, and a second test
  run, with the line coverage and the mutation score against a fixed threshold. Runs everything
  in a temporary git worktree, so the working tree does not change. Works on any repository and
  any tech stack. Writes only docs/audit/test-efficacy-audit/test-efficacy-audit-YYYY-MM-DD-<hash>.md.
  This skill must only be invoked explicitly via /test-efficacy-audit — never inferred from user
  messages.
disable-model-invocation: true
---

# Test Efficacy Audit

## When to use

- The user types `/test-efficacy-audit`, optionally with paths to mutate and `--budget <minutes>`
  (default: 30). Example: `/test-efficacy-audit src/domain src/services --budget 60`.
- Never run this skill on your own initiative, and never from another skill.

This skill measures how well the unit tests detect a change in behaviour. It does not triage the
surviving mutants and it does not add tests. For that, use `/mutation-test` of the Next.js or Go
plugin. Static metrics (complexity, duplication, CBO, DIT) belong to `/code-metrics-audit`.

## Scope exception

This skill runs installs, tests, and mutation tools. The contract rule "do not run tests, builds,
installs" does not apply. These rules replace it:

- Run everything in a temporary git worktree of `HEAD`, outside the repository. Never run a tool
  in the user's working tree.
- Install dependencies and tools only in the worktree or in a temporary tool folder. The worktree
  is removed at the end, so an install there does not change the repository.
- The report is the only file that the skill writes in the repository.
- The measurement is of `HEAD`. Uncommitted changes are not measured. When the contract header
  records `Uncommitted changes: yes`, say so in the Summary.

Before the first install, show the user the install commands, the test command, and the mutation
tool, and ask for approval. An install can run package scripts. When the user declines, stop and
write no report.

## Thresholds

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| Line coverage (unit tests) | ≥ 80 % | ≥ 60 % and < 80 % | < 60 % |
| Mutation score (sampled scope) | ≥ 80 % | ≥ 60 % and < 80 % | < 60 % |

The mutation threshold of 80 % is the same threshold as `/mutation-test` in the Go plugin.
Report branch coverage when the tool gives it. It has no threshold.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `test-efficacy-audit`.
Title: `Test Efficacy Audit`.

### 2. Create the worktree

```bash
TMP="$(mktemp -d)"
WT="$TMP/wt"
git worktree add --detach "$WT" HEAD
```

Record `$TMP` and `$WT`. Put tool output in `$TMP`. Every later command runs in `$WT`. Every path in the report is relative to the
repository root, not to `$WT`.

### 3. Select the commands

1. **Install:** select the command from the lockfile. Examples: `npm ci`,
   `pnpm install --frozen-lockfile`, `yarn install --immutable`, `go mod download`, `uv sync`,
   `python -m venv .venv && .venv/bin/pip install -e .[test]`, `dotnet restore`, `cargo fetch`,
   `bundle install`, `composer install`. Maven and Gradle download during the test run.
2. **Unit tests with coverage:** start from the manifest test script (`test`, `test:unit`,
   `Makefile` target). Add the coverage option of the runner:

   | Runner | Coverage option |
   |--------|-----------------|
   | Vitest / Jest | `--coverage --coverage.reporter=json-summary` (Vitest) / `--coverage --coverageReporters=json-summary` (Jest) |
   | Go | `go test -coverprofile="$TMP/cover.out" ./...`, then `go tool cover -func` |
   | pytest | `--cov --cov-report=json:$TMP/coverage.json` |
   | Maven / Gradle | JaCoCo report goal or task (`jacoco:report`, `jacocoTestReport`) |
   | .NET | `dotnet test --collect:"XPlat Code Coverage"` |
   | Rust | `cargo llvm-cov --json` |

3. Exclude E2E tests and the integration tests that need Docker or a real service
   (Testcontainers, `//go:build integration`, Playwright, Cypress). Use the runner filter, and
   record it. A mutation tool runs the test command once for each mutant, so a slow test in the
   command makes the mutation run slow.
4. Show the commands to the user and ask for approval (see Scope exception).

### 4. Run the baseline

1. Run the install command, then the unit test command with coverage. Record the time.
2. Record the tests passed, failed, and skipped, the duration, the line coverage, and the branch
   coverage. Also record the line coverage for each top-level source folder.
3. When a test fails, record the failing tests and go to step 7. Mutation testing needs a green
   test run. Still report the coverage when the runner wrote it.

### 5. Run the mutation tool

1. **Scope:** use the paths from the arguments. Else use the business logic folders: services,
   domain, use cases, validators, handlers with branches, utilities. Drop test files, generated
   code, UI-only components and pages, `cmd/` entry points, migrations, and configuration.
2. **Tool:** install the tool in the worktree, or run it ephemerally:

   | Language | Tool | Invocation (in `$WT`) | Scope option |
   |----------|------|-----------------------|--------------|
   | TypeScript / JavaScript | StrykerJS | `npm i -D @stryker-mutator/core @stryker-mutator/<runner>-runner`, then `npx stryker run --testRunner <runner> --reporters json,clear-text` | `--mutate <files>` |
   | Go | gremlins | `go run github.com/go-gremlins/gremlins/cmd/gremlins@latest unleash --output "$TMP/gremlins-<n>.json"` | package path argument |
   | Python | mutmut | `.venv/bin/pip install mutmut`, then `.venv/bin/mutmut run` | `paths_to_mutate` in `[tool.mutmut]` |
   | Java / Kotlin | PIT | Maven: `mvn org.pitest:pitest-maven:mutationCoverage -DoutputFormats=XML`; Gradle: add the `info.solidsoft.pitest` plugin in the worktree | `-DtargetClasses=<pattern>` |
   | C# | Stryker.NET | `dotnet tool install dotnet-stryker --tool-path "$TMP/tools"`, then `"$TMP/tools/dotnet-stryker" --reporter json` | `--mutate <glob>` |
   | Rust | cargo-mutants | `cargo install cargo-mutants --root "$TMP/tools"`, then `"$TMP/tools/bin/cargo-mutants" --json` | `--file <path>` |
   | PHP | Infection | `composer require --dev infection/infection`, then `vendor/bin/infection --logger-json="$TMP/infection.json"` | `--filter=<paths>` |
   | Ruby | mutant | `gem install mutant mutant-rspec`. Mutant needs a commercial license for private code: record this as a Gap, and ask the user first | subject expression |

   When the language has no tool in this table, write `Not measured` and the reason.
3. **Time budget:** order the scope files round-robin across the business logic folders, so that
   each folder is sampled early. Mutate in batches of up to 5 files (for Go: one package). Before
   each batch, compare the elapsed mutation time with the budget. Do not start a batch that the
   budget cannot contain. Estimate a batch from the earlier batches. Run a batch in the background
   when it can take longer than the command timeout.
4. Record the mutated files and the files that the budget did not reach.
5. Map the tool statuses to four groups:

   | Group | Tool statuses |
   |-------|---------------|
   | Detected | Killed, Timeout (StrykerJS, Stryker.NET, PIT, gremlins `KILLED`/`TIMED OUT`, cargo-mutants `caught`/`timeout`, mutmut `killed`/`timeout`) |
   | Survived | Survived, `LIVED`, `missed`, `survived` |
   | No coverage | NoCoverage, `NOT COVERED`, `NO_COVERAGE` |
   | Excluded | CompileError, RuntimeError, Ignored, `NOT VIABLE`, `unviable`, `skipped` |

6. Mutation score = Detected / (Detected + Survived + No coverage), on the mutated files only.
   Excluded mutants are not in the score.

### 6. Run the tests again

1. Discard the mutation changes: `git -C "$WT" checkout -- .` (keep the installed dependencies).
2. Run the same unit test command as step 4. Record the same values.
3. Compare the result with the baseline. A test with a different result is a flaky test or a
   mutation that the tool did not restore. Record each one as a Gap.

### 7. Remove the worktree

```bash
git worktree remove --force "$WT"
git worktree prune
rm -rf "$TMP"
```

Do this also when an earlier step failed.

### 8. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include every
metric with a warn or fail status, every `Not measured` metric, a red baseline, a difference
between the baseline and the second run, the files that the budget did not reach, and the
mutation tool license note.

```markdown
## Environment and tools

| Item | Value |
|------|-------|
| Measured commit | <full hash> (HEAD, uncommitted changes not measured) |
| Install command | |
| Unit test command | |
| Excluded tests | <filter and reason> |
| Coverage tool | |
| Mutation tool and version | |
| Mutation budget | <n> min (used: <n> min) |

## Metrics and thresholds

| Metric | Value | Threshold (pass) | Status |
|--------|-------|------------------|--------|
| Line coverage | <n> % | ≥ 80 % | |
| Branch coverage | <n> % | — | — |
| Mutation score | <n> % (<detected> / <total>) | ≥ 80 % | |

## Baseline test run

| Passed | Failed | Skipped | Duration |
|--------|--------|---------|----------|

(failing tests, when any: test file#line, test name, error line)

## Coverage by folder

| Folder | Line coverage | Status |
|--------|---------------|--------|

## Mutation run

| Mutated file | Detected | Survived | No coverage | Excluded | Score |
|--------------|----------|----------|-------------|----------|-------|

Files not reached in the budget: <list or "none">

## Surviving mutants

| File#line | Mutator | Original → mutated |
|-----------|---------|--------------------|

## Post test run

| Passed | Failed | Skipped | Duration | Same result as baseline |
|--------|--------|---------|----------|-------------------------|
```

List at most 50 surviving mutants, ordered by file and line, and give the total count. Include
the no-coverage mutants in the same table, marked `(no coverage)`.

## Verification

Confirm the contract checklist, then:

- [ ] `git worktree list` shows no worktree from this run.
- [ ] Every link uses a repository path, not a worktree path.
- [ ] The mutation score equals Detected / (Detected + Survived + No coverage) from the
      `Mutation run` totals.
- [ ] The used mutation time is not more than the budget plus one batch.
- [ ] Each status agrees with the threshold table.
- [ ] The report states that uncommitted changes are not measured.
