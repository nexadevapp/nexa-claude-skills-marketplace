---
name: mutation-audit
description: >
  Writes a dated mutation audit report for the current repository: a serial unit test run, a
  time-boxed mutation testing run on the core business logic first, and a second unit test run,
  with the mutation score against a fixed threshold. Runs one test process at a time, in a
  temporary git worktree, so the working tree does not change. Works on any repository and any
  tech stack. Writes only docs/audit/mutation-audit/mutation-audit-YYYY-MM-DD-<hash>.md.
  This skill must only be invoked explicitly via /mutation-audit — never inferred from user
  messages.
disable-model-invocation: true
---

# Mutation Audit

## When to use

- The user types `/mutation-audit`, optionally with paths to mutate and `--budget <minutes>`
  (default: 30). Example: `/mutation-audit src/domain src/services --budget 60`.
  The paths are the core logic to mutate first, for example the matching engine and the rate
  computation.
- Never run this skill on your own initiative, and never from another skill.

This skill measures how well the unit tests detect a change in behaviour. A mutation run takes
much time, so it is a separate skill. It does not measure coverage; `/test-efficacy-audit` does
that. It does not triage the surviving mutants and it does not add tests. For that, use
`/mutation-test` of the Next.js or Go plugin.

## Shared rules

Read `${CLAUDE_PLUGIN_ROOT}/skills/test-efficacy-audit/SKILL.md` and apply these sections, with
the changes below:

- [Test efficacy audit: Scope exception](../test-efficacy-audit/SKILL.md#scope-exception). Also
  show the mutation tool before the first install.
- [Test efficacy audit: Test run rules](../test-efficacy-audit/SKILL.md#test-run-rules), except the
  coverage rule: this skill runs the unit tests only. A mutation tool runs the test command once
  for each mutant, and a container start for each mutant makes the run too slow. Also set the
  mutation tool to one worker:

  | Tool | Serial option |
  |------|---------------|
  | StrykerJS / Stryker.NET | `--concurrency 1` |
  | gremlins | `--workers 1` |
  | mutmut | `--max-children 1` |
  | PIT | `-Dthreads=1` |
  | cargo-mutants / Infection | `-j 1` / `--threads=1` |

## Thresholds

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| Mutation score (sampled scope) | ≥ 80 % | ≥ 60 % and < 80 % | < 60 % |

The threshold of 80 % is the same threshold as `/mutation-test` in the Go plugin.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `mutation-audit`.
Title: `Mutation Audit`.

### 2. Create the worktree

Do [Test efficacy audit: Create the worktree](../test-efficacy-audit/SKILL.md#2-create-the-worktree).

### 3. Select the commands

1. **Install:** select the command as in
   [Test efficacy audit: Select the commands](../test-efficacy-audit/SKILL.md#3-select-the-commands).
2. **Unit tests:** start from the manifest test scripts. Exclude the integration tests, the E2E
   tests, and the tests that need a live external service. Add the serial option. Record the
   filter.
3. **Mutation tool:** select the tool from the table in step 5.
4. Show the commands to the user and ask for approval.

### 4. Run the baseline

1. Run the install command, then the unit tests. Record the tests passed, failed, and skipped,
   and the duration.
2. When a test fails, record the failing tests, write `Not measured` for the mutation score, and
   go to step 7. Mutation testing needs a green test run.

### 5. Run the mutation tool

1. **Scope:** use the paths from the arguments. Else use the business logic folders: services,
   domain, use cases, validators, handlers with branches, utilities. Drop test files, generated
   code, UI-only components and pages, `cmd/` entry points, migrations, and configuration.
2. **Core logic first:** find the code that computes the results of the product: engines,
   matchers, calculators, rate and price computation, scoring, rules. Search the names and the
   folders for these words, and read the use cases. Put the core logic first in the scope, so
   that the budget reaches it first. Record the core logic files in the report.
3. **Tool:** install the tool in the worktree, or run it ephemerally. Add the serial option
   (see Shared rules):

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
4. **Time budget:** mutate the core logic files first. Then order the other scope files
   round-robin across the business logic folders, so that each folder is sampled early.
   Mutate in batches of up to 5 files (for Go: one package). Before
   each batch, compare the elapsed mutation time with the budget. Do not start a batch that the
   budget cannot contain. Estimate a batch from the earlier batches. Run a batch in the background
   when it can take longer than the command timeout. Wait for it to finish before the next batch.
5. Record the mutated files and the files that the budget did not reach. When a file in the
   scope has only integration tests, record it as a Gap.
6. Map the tool statuses to four groups:

   | Group | Tool statuses |
   |-------|---------------|
   | Detected | Killed, Timeout (StrykerJS, Stryker.NET, PIT, gremlins `KILLED`/`TIMED OUT`, cargo-mutants `caught`/`timeout`, mutmut `killed`/`timeout`) |
   | Survived | Survived, `LIVED`, `missed`, `survived` |
   | No coverage | NoCoverage, `NOT COVERED`, `NO_COVERAGE` |
   | Excluded | CompileError, RuntimeError, Ignored, `NOT VIABLE`, `unviable`, `skipped` |

7. Mutation score = Detected / (Detected + Survived + No coverage), on the mutated files only.
   Excluded mutants are not in the score.

### 6. Run the unit tests again

1. Discard the mutation changes: `git -C "$WT" checkout -- .` (keep the installed dependencies).
2. Run the same unit test command as step 4. Record the same values.
3. Compare the result with step 4. A test with a different result is a flaky test or a
   mutation that the tool did not restore. Record each one as a Gap.

### 7. Remove the worktree

Do [Test efficacy audit: Remove the worktree](../test-efficacy-audit/SKILL.md#5-remove-the-worktree).
Do this also when an earlier step failed.

### 8. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include a warn or
fail status, a `Not measured` mutation score, a red baseline, a difference between the baseline
and the post test run, the files that the budget did not reach, and the mutation tool license
note.

```markdown
## Environment and tools

| Item | Value |
|------|-------|
| Measured commit | <full hash> (HEAD, uncommitted changes not measured) |
| Install command | |
| Unit test command | <command, with the serial option> |
| Excluded tests | <filter and reason> |
| Mutation tool and version | |
| Mutation test command | |
| Mutation budget | <n> min (used: <n> min) |
| Core logic files | <list> |

## Metrics and thresholds

| Metric | Value | Threshold (pass) | Status |
|--------|-------|------------------|--------|
| Mutation score | <n> % (<detected> / <total>) | ≥ 80 % | |

## Baseline test run

| Passed | Failed | Skipped | Duration |
|--------|--------|---------|----------|

(failing tests, when any: test file#line, test name, error line)

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
- [ ] The status agrees with the threshold table.
- [ ] The report states that uncommitted changes are not measured.
- [ ] Every test command and the mutation tool used the serial option, and no two test
      processes ran at the same time.
- [ ] The mutation run started with the core logic files.
