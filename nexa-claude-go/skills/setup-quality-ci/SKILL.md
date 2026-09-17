---
name: setup-quality-ci
description: >
  Generates a GitHub Actions workflow that gates pull requests on Go code quality (golangci-lint,
  gofumpt/goimports and templ formatting, generated-code drift for sqlc and templ) and test
  coverage (go test with integration tests and an 80% threshold). Use when the user asks to
  "set up CI for code quality", "enforce coverage in CI", "add quality gates", "run
  golangci-lint in CI", or mentions CI/CD for linting, formatting, or coverage in a Go project.
---

# Quality CI

## Instructions

Generate a GitHub Actions workflow that enforces code quality and test coverage on every pull request: $ARGUMENTS.
$ARGUMENTS may specify the branch, workflow name, or special requirements.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- The project must have a `.golangci.yml` at the root with `gocyclo` enabled and `run.build-tags` covering `integration` and `e2e` (use `/code-quality` first if needed)
- `templ` must be pinned as a tool in `go.mod` (`go tool templ version` works)
- The project must have `sqlc.yaml` and committed generated code (`internal/db/`, `*_templ.go`)
- Integration tests must use the `//go:build integration` tag (use `/integration-test` first if needed)

## Workflow

1. **Read the project context**:
   - Verify `.golangci.yml` exists in the project root and enables `gocyclo`
   - Verify `go.mod` has a `go` directive and a `tool github.com/a-h/templ/cmd/templ` entry
   - Verify `sqlc.yaml` exists
   - Read the local tool versions: `golangci-lint version` (major.minor, e.g. `v2.5`) and `sqlc version` (e.g. `1.29.0`)
   - Check for any existing GitHub Actions workflows in `.github/workflows/`
   - Ask the user for: workflow trigger branch (default: `main`), whether to also trigger on pull requests (default: yes)

2. **Create the GitHub Actions workflow** at `.github/workflows/quality.yml` using the template.

   Fill in the template placeholders:

   | Placeholder | Description | Default |
   |---|---|---|
   | `{{BRANCH}}` | Branch that triggers the workflow | `main` |
   | `{{GOLANGCI_LINT_VERSION}}` | golangci-lint version used locally | output of `golangci-lint version`, as `v2.X` |
   | `{{SQLC_VERSION}}` | sqlc version used locally | output of `sqlc version`, without the `v` |

   The Go version is not a placeholder — `actions/setup-go` reads it from `go.mod` via
   `go-version-file`, and caches modules and the build cache by default.

   Ensure the following are present in the generated workflow:

   - **Concurrency**: The `concurrency` key must cancel in-progress runs for the same branch/PR to prevent redundant CI billing
   - **Generated-code drift check**: `go tool templ generate && sqlc generate` followed by `git diff --exit-code`
   - **Coverage report upload**: The coverage job must use `actions/upload-artifact` to save the filtered profile and the HTML report

3. **Verify the workflow file**:
   - Validate YAML syntax by reading the file back
   - Ensure no placeholder `{{...}}` markers remain (GitHub expressions `${{ ... }}` are expected)
   - Ensure the workflow file is under 80 lines

4. **Output a summary** with:
   - What was created and where
   - How the workflow triggers (push, PR, or both)
   - What each job checks (lint job: golangci-lint + formatting + generated-code drift, coverage job: `go test -tags=integration` with coverage)
   - Reminder: the coverage job fails if total coverage of `./internal/...`, excluding generated code, drops below 80%

## Reference Templates

- **GitHub Actions workflow**: [templates/github-actions/quality.yml](templates/github-actions/quality.yml)

### Workflow Template Placeholders

| Placeholder | Description | Example |
|---|---|---|
| `{{BRANCH}}` | Branch that triggers the workflow on push | `main` |
| `{{GOLANGCI_LINT_VERSION}}` | golangci-lint version | `v2.5` |
| `{{SQLC_VERSION}}` | sqlc version | `1.29.0` |

## Design Decisions

### Two separate jobs: lint and coverage

The `lint` job runs golangci-lint, the formatters, and the generated-code drift check — these are
fast and have no external dependencies. The `coverage` job runs the integration tests — these need
Docker for Testcontainers and take longer. Splitting them gives faster feedback: a formatting issue
fails in under a minute instead of waiting for the full test suite.

### Why pin the tool versions

golangci-lint releases add linters and change findings; sqlc output changes between versions. An
unpinned version makes CI disagree with the developer's machine — a lint failure nobody can
reproduce, or a drift failure caused by a newer generator rather than a stale commit.

### Why generated code is committed and checked

Committed sqlc and templ output means `go build ./...` works without the generators. The drift
check guarantees the committed output matches the sources, so a forgotten `generate` fails CI
instead of shipping stale queries or views.

### Coverage threshold fails the CI job

`go test` has no native threshold, so the workflow reads the `total:` line from
`go tool cover -func` and exits non-zero below 80%. Generated code (`internal/db/`, `*_templ.go`)
and the test helper `internal/testdb/` are filtered out of the profile first — it would otherwise inflate or deflate the number without
reflecting test quality. Testcontainers works on `ubuntu-latest` because Docker is preinstalled.

## Update CLAUDE.md

After creating the workflow, append a `## Quality CI` section to the target project's
`CLAUDE.md` so that future sessions know CI is configured.

1. If `CLAUDE.md` does not exist, create it
2. If a `## Quality CI` section already exists (check for `<!-- NEXA_QUALITY_CI_CONFIGURED -->`),
   ask the user whether to overwrite or skip
3. Append the following section (fill in the actual values from the setup):

~~~markdown
## Quality CI

<!-- NEXA_QUALITY_CI_CONFIGURED -->

- Workflow: `.github/workflows/quality.yml`
- Triggers: push to `[branch]`, pull requests to `[branch]`
- Lint job: `golangci-lint` [version] (gocyclo max 10, formatters reported as issues) + `templ fmt -fail` + generated-code drift (sqlc [version], templ)
- Coverage job: `go test -tags=integration` with `-coverpkg=./internal/...`, generated code excluded, 80% total threshold
- Artifacts: coverage profile and HTML report uploaded on every run
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## DO NOT

- Combine lint and coverage into a single job — they have different performance profiles and dependencies
- Hard-code the Go version — `actions/setup-go` reads it from `go.mod`
- Use `latest` for golangci-lint or sqlc — pin the versions the project uses locally
- Omit the `concurrency` key — we must prevent redundant CI billing on rapid pushes
- Disable the `actions/setup-go` cache — speed is a priority for the Nexa ecosystem
- Add matrix strategies for multiple Go versions or OS — keep the workflow single-purpose
- Add deployment steps or notifications — this workflow is only for quality gates
- Overwrite an existing `.github/workflows/quality.yml` without reading it first and asking the user
- Add separate `go vet`, `staticcheck`, `gofmt`, or `golangci-lint fmt --diff` steps — `golangci-lint run` already runs the linters and reports the enabled formatters
