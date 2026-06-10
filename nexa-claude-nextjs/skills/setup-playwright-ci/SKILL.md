---
name: setup-playwright-ci
description: >
  Generates a GitHub Actions workflow that runs Playwright end-to-end tests
  on every pull request. The workflow provisions a PostgreSQL database via
  Testcontainers, installs Chromium, runs the full E2E suite, and uploads
  trace artifacts on failure. Use when the user asks to "set up CI for
  Playwright", "run e2e tests in CI", "add a GitHub Actions workflow for
  Playwright", or mentions CI/CD for end-to-end tests.
---

# Playwright CI

## Instructions

Generate a GitHub Actions workflow that runs the project's Playwright end-to-end tests: $ARGUMENTS.
$ARGUMENTS may specify the branch, workflow name, or special requirements.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- The project must already have Playwright tests (use the `/playwright-test` skill first if needed)
- The project must have `e2e/global-setup.ts` with Testcontainers (created by `/playwright-test`)
- The project must have a `playwright.config.ts` in the project root

## Workflow

1. **Read the project context**:
   - Verify `playwright.config.ts` exists in the project root
   - Verify `e2e/global-setup.ts` exists (Testcontainers setup)
   - Read `package.json` to determine the Node.js version and check that `@playwright/test` and `@testcontainers/postgresql` are in `devDependencies`
   - Check for any existing GitHub Actions workflows in `.github/workflows/`
   - Ask the user for: workflow trigger branch (default: `main`), whether to also trigger on pull requests (default: yes)

2. **Create the GitHub Actions workflow** at `.github/workflows/playwright.yml` using the template.

   Fill in the template placeholders:

   | Placeholder | Description | Default |
   |---|---|---|
   | `{{NODE_VERSION}}` | Node.js version from `package.json` `engines` field or `.nvmrc` | `22` |
   | `{{BRANCH}}` | Branch that triggers the workflow | `main` |

3. **Verify the workflow file**:
   - Validate YAML syntax by reading the file back
   - Ensure no placeholder `{{...}}` markers remain
   - Ensure the workflow file is under 100 lines (keep it focused)

4. **Output a summary** with:
   - What was created and where
   - How the workflow triggers (push, PR, or both)
   - What artifacts are uploaded on failure (traces, reports)
   - Reminder: the first run may take longer due to dependency caching being cold

## Reference Templates

- **GitHub Actions workflow**: [templates/github-actions/playwright.yml](templates/github-actions/playwright.yml)

### Workflow Template Placeholders

| Placeholder | Description | Example |
|---|---|---|
| `{{NODE_VERSION}}` | Node.js major version | `22` |
| `{{BRANCH}}` | Branch that triggers the workflow on push | `main` |

## Design Decisions

### Why Testcontainers works on GitHub Actions

GitHub Actions `ubuntu-latest` runners come with Docker pre-installed. Testcontainers detects
the Docker daemon automatically — no Docker-in-Docker or service containers needed. The
`e2e/global-setup.ts` starts a PostgreSQL container, runs Prisma migrations, seeds the database,
and starts the Next.js dev server — exactly the same as local development.

### Why not use Playwright's Docker image

The project's global setup starts its own Next.js dev server and PostgreSQL Testcontainer.
Running inside the Playwright Docker image would require Docker-in-Docker for Testcontainers.
Instead, the workflow installs Chromium directly on the runner via `npx playwright install --with-deps chromium`,
which is simpler and faster.

### Parallel test files, sequential tests within files

The `playwright.config.ts` uses `fullyParallel: false` so tests within each file run sequentially
(a use case journey may have ordered steps). However, separate test files (separate use cases) run
in parallel via the `workers` setting. The CI workflow respects this — no sharding needed.

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
- Database: PostgreSQL via Testcontainers (no Docker-in-Docker needed)
- Browser: Chromium only (installed via `npx playwright install --with-deps chromium`)
- Artifacts: traces and reports uploaded on failure
- Global setup: `e2e/global-setup.ts` (starts Testcontainers + dev server)
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## DO NOT

- Use the Playwright Docker image as the job container — Testcontainers needs direct Docker access on the runner
- Add Firefox or WebKit browsers — the project uses Chromium only (enforced by `/playwright-test`)
- Add matrix strategies for multiple Node versions or OS — keep the workflow single-purpose
- Hard-code the Node.js version — read it from the project's `package.json` or `.nvmrc`
- Skip uploading artifacts on failure — traces and reports are essential for debugging CI failures
- Add deployment steps or notifications — this workflow is only for running E2E tests
- Overwrite an existing `.github/workflows/playwright.yml` without reading it first and asking the user
