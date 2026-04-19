---
name: setup-quality-ci
description: >
  Generates a GitHub Actions workflow that gates pull requests on code quality
  (oxlint, oxfmt) and test coverage (Vitest with v8 coverage thresholds).
  Use when the user asks to "set up CI for code quality", "enforce coverage in CI",
  "add quality gates", or mentions CI/CD for linting, formatting, or coverage.
---

# Quality CI

## Instructions

Generate a GitHub Actions workflow that enforces code quality and test coverage on every pull request: $ARGUMENTS.
$ARGUMENTS may specify the branch, workflow name, or special requirements.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- The project must have `oxlint` and `oxfmt` in `devDependencies` (use `/code-quality` first if needed)
- The project must have `vitest` with coverage configured in `vitest.config.ts` (use `/vitest-test` first if needed)
- The project must have an `oxlintrc.json` at the root with the `eslint/complexity` rule

## Workflow

1. **Read the project context**:
   - Verify `oxlintrc.json` exists in the project root
   - Verify `vitest.config.ts` exists and has `coverage` configured with thresholds
   - Read `package.json` to determine the Node.js version and check that `oxlint`, `oxfmt`, and `@vitest/coverage-v8` are in `devDependencies`
   - Check for any existing GitHub Actions workflows in `.github/workflows/`
   - Ask the user for: workflow trigger branch (default: `main`), whether to also trigger on pull requests (default: yes)

2. **Create the GitHub Actions workflow** at `.github/workflows/quality.yml` using the template.

   Fill in the template placeholders:

   | Placeholder | Description | Default |
   |---|---|---|
   | `{{NODE_VERSION}}` | Node.js version from `package.json` `engines` field or `.nvmrc` | `22` |
   | `{{BRANCH}}` | Branch that triggers the workflow | `main` |

   Ensure the following are present in the generated workflow:

   - **Concurrency**: The `concurrency` key must cancel in-progress runs for the same branch/PR to prevent redundant CI billing
   - **Package manager detection**: Detect the package manager from the lockfile (`package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn) and pass it to `actions/setup-node`'s `cache` parameter
   - **Coverage report upload**: The coverage job must use `actions/upload-artifact` to save the Vitest HTML report from `coverage/`

3. **Verify the workflow file**:
   - Validate YAML syntax by reading the file back
   - Ensure no placeholder `{{...}}` markers remain
   - Ensure the workflow file is under 80 lines

4. **Output a summary** with:
   - What was created and where
   - How the workflow triggers (push, PR, or both)
   - What each job checks (lint job: oxlint + oxfmt, coverage job: vitest --coverage)
   - Reminder: the coverage job will fail if any metric drops below the thresholds in `vitest.config.ts`

## Reference Templates

- **GitHub Actions workflow**: [templates/github-actions/quality.yml](templates/github-actions/quality.yml)

### Workflow Template Placeholders

| Placeholder | Description | Example |
|---|---|---|
| `{{NODE_VERSION}}` | Node.js major version | `22` |
| `{{BRANCH}}` | Branch that triggers the workflow on push | `main` |

## Design Decisions

### Two separate jobs: lint and coverage

The `lint` job runs oxlint and oxfmt — these are fast (seconds) and have no external dependencies.
The `coverage` job runs Vitest with coverage — this needs Docker for Testcontainers and takes longer.
Splitting them gives faster feedback: a formatting issue fails in ~30 seconds instead of waiting for
the full test suite.

### Why v8 coverage, not istanbul

The v8 provider uses V8's built-in code coverage, which is faster and requires no code instrumentation.
It is Vitest's recommended provider for Node.js environments.

### Coverage thresholds fail the CI job

The `vitest.config.ts` defines thresholds (statements, branches, functions, lines at 80%).
When `npx vitest run --coverage` detects coverage below these thresholds, it exits with a
non-zero code, which fails the GitHub Actions job. No additional threshold checking is needed
in the workflow — Vitest handles it natively.

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
- Lint job: `oxlint` (with complexity rule) + `oxfmt --check`
- Coverage job: `vitest run --coverage` (v8 provider, 80% thresholds)
- Artifacts: coverage report uploaded on every run
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## DO NOT

- Combine lint and coverage into a single job — they have different performance profiles and dependencies
- Hard-code the Node.js version — read it from the project's `package.json` or `.nvmrc`
- Hard-code the package manager (npm/pnpm/yarn) — detect it from the lockfile present in the project root
- Omit the `concurrency` key — we must prevent redundant CI billing on rapid pushes
- Skip `actions/setup-node` caching — speed is a priority for the Nexa ecosystem
- Add matrix strategies for multiple Node versions or OS — keep the workflow single-purpose
- Add deployment steps or notifications — this workflow is only for quality gates
- Overwrite an existing `.github/workflows/quality.yml` without reading it first and asking the user
- Add ESLint or Prettier steps — the project uses Oxc (oxlint + oxfmt) exclusively
