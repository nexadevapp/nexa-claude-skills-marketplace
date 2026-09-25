---
name: test-efficacy-audit
description: >
  Writes a dated test efficacy audit report for the current repository: one serial test run
  (unit tests and Testcontainers integration tests) with code coverage, and the line coverage
  against a fixed threshold. Runs in a temporary git worktree, so the working tree does not
  change. Works on any repository and any tech stack. Does not run mutation testing; use
  /mutation-audit for that. Writes only
  docs/audit/test-efficacy-audit/test-efficacy-audit-YYYY-MM-DD-<hash>.md.
  This skill must only be invoked explicitly via /test-efficacy-audit — never inferred from user
  messages.
disable-model-invocation: true
---

# Test Efficacy Audit

## When to use

- The user types `/test-efficacy-audit`.
- Never run this skill on your own initiative, and never from another skill.

This skill measures which code the tests run. It does not run mutation testing, because a
mutation run takes much time. The mutation score belongs to `/mutation-audit`. Static metrics
(complexity, duplication, CBO, DIT) belong to `/code-metrics-audit`.

## Scope exception

This skill runs installs and tests. The contract rule "do not run tests, builds, installs" does
not apply. These rules replace it:

- Run everything in a temporary git worktree of `HEAD`, outside the repository. Never run a tool
  in the user's working tree.
- Install dependencies and tools only in the worktree or in a temporary tool folder. The worktree
  is removed at the end, so an install there does not change the repository.
- The report is the only file that the skill writes in the repository.
- The measurement is of `HEAD`. Uncommitted changes are not measured. When the contract header
  records `Uncommitted changes: yes`, say so in the Summary.

Before the first install, show the user the install commands and the test commands, and ask for
approval. An install can run package scripts. When the user declines, stop and write no report.

## Test run rules

These rules apply to every step that runs tests.

- **Coverage includes the integration tests.** Run the unit tests and the integration tests that
  use Testcontainers, so that the coverage includes the code that only an integration test runs.
  Exclude only E2E tests (Playwright, Cypress) and tests that need a live external service.
- **Run one test process at a time.** Do not start a test run or an install while another one
  runs. Wait for a background command to finish before you start the next one.
- **Use the serial options.** Set the runner to one worker:

  | Tool | Serial option |
  |------|---------------|
  | Vitest / Jest | `--no-file-parallelism` / `--runInBand` |
  | Go test | `-p 1` |
  | pytest | no `-n` (pytest-xdist) option |
  | Maven / Gradle | `-DforkCount=1` / `--max-workers=1` |

## Thresholds

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| Line coverage (unit and integration tests) | ≥ 80 % | ≥ 60 % and < 80 % | < 60 % |

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
2. **Tests with coverage:** start from the manifest test scripts (`test`, `test:unit`,
   `test:integration`, `Makefile` targets). Add the coverage option and the serial option of
   the runner:

   | Runner | Coverage option |
   |--------|-----------------|
   | Vitest / Jest | `--coverage --coverage.reporter=json-summary` (Vitest) / `--coverage --coverageReporters=json-summary` (Jest) |
   | Go | `go test -coverprofile="$TMP/cover.out" ./...`, then `go tool cover -func` |
   | pytest | `--cov --cov-report=json:$TMP/coverage.json` |
   | Maven / Gradle | JaCoCo report goal or task (`jacoco:report`, `jacocoTestReport`) |
   | .NET | `dotnet test --collect:"XPlat Code Coverage"` |
   | Rust | `cargo llvm-cov --json` |

3. **Integration tests:** include the Testcontainers tests. Enable their build tag, project, or
   marker (`-tags=integration`, a Vitest project, a pytest marker). When they are in a separate
   package, add `-coverpkg=./...` (Go) or the equivalent, so that the coverage counts the code
   that they call. When the unit and integration tests need two commands, run them one after
   the other and merge the coverage reports.
4. **Docker:** run `docker info`. When it fails, ask the user to start Docker. When the user
   declines, run the unit tests only, and record the coverage as partial in Gaps.
5. **Exclusions:** exclude E2E tests and tests that need a live external service. Use the runner
   filter, and record it.
6. Show the commands to the user and ask for approval (see Scope exception).

### 4. Run the tests

1. Run the install command, then the test commands with coverage, one after the other.
   Record the time.
2. Record the tests passed, failed, and skipped, the duration, the line coverage, and the branch
   coverage. Also record the line coverage for each top-level source folder.
3. When a test fails, record the failing tests. Still report the coverage when the runner wrote
   it.

### 5. Remove the worktree

```bash
git worktree remove --force "$WT"
git worktree prune
rm -rf "$TMP"
```

Do this also when an earlier step failed.

### 6. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include every
metric with a warn or fail status, every `Not measured` metric, every failing test, and partial
coverage.

```markdown
## Environment and tools

| Item | Value |
|------|-------|
| Measured commit | <full hash> (HEAD, uncommitted changes not measured) |
| Install command | |
| Test commands | <unit and integration commands, with the serial options> |
| Integration tests | included (Testcontainers) / excluded: <reason> |
| Excluded tests | <filter and reason> |
| Coverage tool | |

## Metrics and thresholds

| Metric | Value | Threshold (pass) | Status |
|--------|-------|------------------|--------|
| Line coverage | <n> % | ≥ 80 % | |
| Branch coverage | <n> % | — | — |

## Test run

| Passed | Failed | Skipped | Duration |
|--------|--------|---------|----------|

(failing tests, when any: test file#line, test name, error line)

## Coverage by folder

| Folder | Line coverage | Status |
|--------|---------------|--------|
```

## Verification

Confirm the contract checklist, then:

- [ ] `git worktree list` shows no worktree from this run.
- [ ] Every link uses a repository path, not a worktree path.
- [ ] Each status agrees with the threshold table.
- [ ] The report states that uncommitted changes are not measured.
- [ ] The coverage includes the Testcontainers integration tests, or a Gap says why not.
- [ ] Every test command used the serial option, and no two test processes ran at the same
      time.
