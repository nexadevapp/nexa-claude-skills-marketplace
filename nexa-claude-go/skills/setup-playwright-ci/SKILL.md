---
name: setup-playwright-ci
description: >
  Generates a GitHub Actions workflow that runs the Playwright for Go end-to-end tests of a Go
  application on every pull request. The workflow sets up Go, installs Chromium through the
  pinned `go tool playwright`, runs `go test -tags=e2e` (which provisions PostgreSQL via
  Testcontainers), and uploads trace artifacts on failure. Use when the user asks to "set up
  CI for Playwright", "run e2e tests in CI", "add a GitHub Actions workflow for Playwright",
  or mentions CI/CD for end-to-end tests.
---

# Playwright CI

## Instructions

Generate a GitHub Actions workflow that runs the project's Playwright end-to-end tests: $ARGUMENTS.
$ARGUMENTS may specify the branch, workflow name, or special requirements.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- The project must already have E2E tests in `e2e/*_test.go` behind the `e2e` build tag (use the `/playwright-test` skill first if needed)
- `go.mod` must pin the Playwright CLI as a tool (`tool github.com/mxschmitt/playwright-go/cmd/playwright`)
- `internal/testdb/testdb.go` must build under the `e2e` tag — it starts the PostgreSQL Testcontainer

## Workflow

1. **Read the project context**:
   - Verify `e2e/setup_test.go` exists and starts the server from `testdb.Start()`
   - Verify `go tool -n playwright` succeeds (the CLI is declared in `go.mod`)
   - Verify `go.mod` exists — the workflow reads the Go version from it, so no Go placeholder is needed
   - Check for any existing GitHub Actions workflows in `.github/workflows/`
   - Ask the user for: workflow trigger branch (default: `main`), whether to also trigger on pull requests (default: yes)

2. **Create the GitHub Actions workflow** at `.github/workflows/playwright.yml` using the template.

   Fill in the template placeholders:

   | Placeholder | Description | Default |
   |---|---|---|
   | `{{BRANCH}}` | Branch that triggers the workflow | `main` |

3. **Verify the workflow file**:
   - Validate YAML syntax by reading the file back
   - Ensure no placeholder `{{...}}` markers remain (GitHub expressions `${{ ... }}` are expected)
   - Ensure the workflow file is under 100 lines (keep it focused)

4. **Output a summary** with:
   - What was created and where
   - How the workflow triggers (push, PR, or both)
   - What artifacts are uploaded on failure (traces)
   - Reminder: the first run may take longer due to cold Go module, Playwright driver, and Docker image caches

## Reference Templates

- **GitHub Actions workflow**: [templates/github-actions/playwright.yml](templates/github-actions/playwright.yml)

### Workflow Template Placeholders

| Placeholder | Description | Example |
|---|---|---|
| `{{BRANCH}}` | Branch that triggers the workflow on push | `main` |

## Design Decisions

### Why Testcontainers works on GitHub Actions

GitHub Actions `ubuntu-latest` runners come with Docker pre-installed. Testcontainers detects
the Docker daemon automatically — no Docker-in-Docker or service containers needed. The e2e
package's `TestMain` starts a PostgreSQL container through `testdb.Start`, applies the goose
migrations and `db/seed.sql`, and serves the real handler — exactly the same as a local run.

### Why `go tool playwright` installs the browser

The Playwright driver version must match the `playwright-go` library in `go.mod`. `go tool
playwright` runs the CLI at that pinned version, so CI and local machines download the same
driver and Chromium build without a hand-maintained version placeholder. `--with-deps` installs
the system libraries Chromium needs on the runner.

### Why not use Playwright's Docker image

Testcontainers needs direct Docker access on the runner. Running inside the Playwright Docker
image would require Docker-in-Docker. Installing Chromium on the runner is simpler and faster.

### Go version from `go.mod`

`actions/setup-go` reads the `go` directive with `go-version-file: go.mod` and caches the module
and build caches by default, so the Go version is never duplicated in the workflow.

### No code generation step

Generated code (`internal/db/`, `*_templ.go`) is committed, so the tests build without `templ`
or `sqlc`. Generate drift is caught by the quality workflow (`/setup-quality-ci`), not here.

### No retries

`go test` has no retry setting, and the workflow adds none. A flaky E2E test fails the build
and gets fixed — a retry would hide it.

## Update CLAUDE.md

After creating the workflow, append a `## Playwright CI` section to the target project's
`CLAUDE.md` so that future sessions know CI is configured.

1. If `CLAUDE.md` does not exist, create it
2. If a `## Playwright CI` section already exists (check for `<!-- NEXA_PLAYWRIGHT_CI_CONFIGURED -->`),
   ask the user whether to overwrite or skip
3. Append the following section (fill in the actual values from the setup):

~~~markdown
## Playwright CI

<!-- NEXA_PLAYWRIGHT_CI_CONFIGURED -->

- Workflow: `.github/workflows/playwright.yml`
- Triggers: push to `[branch]`, pull requests to `[branch]`
- Go: version from `go.mod`
- Tests: `go test -tags=e2e -v ./e2e/...` (Playwright for Go)
- Database: PostgreSQL via Testcontainers, started by `testdb.Start` in the e2e `TestMain` (no Docker-in-Docker needed)
- Browser: Chromium only (installed via `go tool playwright install --with-deps chromium`)
- Artifacts: `e2e/test-results/` traces on failure
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## DO NOT

- Use the Playwright Docker image as the job container — Testcontainers needs direct Docker access on the runner
- Add Firefox or WebKit browsers — the project uses Chromium only (enforced by `/playwright-test`)
- Add Node.js, npm, or `npx` steps — the tests are Go and the CLI comes from `go tool playwright`
- Add matrix strategies for multiple Go versions or OS — keep the workflow single-purpose
- Hard-code the Go version — `go-version-file: go.mod` reads it
- Add a Postgres service container or a separate migration step — `testdb.Start` owns the database
- Filter the run with `-run` or `-skip`, or add retries
- Skip uploading traces on failure — they are essential for debugging CI failures
- Add deployment steps or notifications — this workflow is only for running E2E tests
- Overwrite an existing `.github/workflows/playwright.yml` without reading it first and asking the user

## Verification

The skill is complete when:

- `.github/workflows/playwright.yml` exists, parses as YAML, and contains no `{{...}}` placeholder
- The workflow runs `go test -tags=e2e -v ./e2e/...` with no filters
- `CLAUDE.md` contains `<!-- NEXA_PLAYWRIGHT_CI_CONFIGURED -->`
