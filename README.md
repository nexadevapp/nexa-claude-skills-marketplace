# Nexa Agentic Engineering Marketplace

A collection of [Claude Code](https://claude.com/claude-code) plugins that implement a structured software development lifecycle (SDLC) methodology. Each plugin adds slash commands that guide you — and the agent — through every phase of building software, from gathering requirements to delivering tested, reviewed use cases.

The marketplace has a **two-layer architecture**:

- **`nexa-claude-core`** — stack-agnostic methodology, from a vision document to detailed use case specifications and designs. Works with any tech stack.
- **`nexa-claude-nextjs`** — the Next.js stack: implementation, testing, quality gates, and parallel delivery. Requires `nexa-claude-core`.
- **`nexa-claude-go`** — the Go stack (`net/http`, templ + htmx, sqlc + goose, PostgreSQL): the same pipeline for Go. Requires `nexa-claude-core`.
- **`nexa-claude-audit`** — seven audits (QA, requirements traceability, architecture, infrastructure, CI/CD, code metrics, test efficacy) for any repository, Nexa or not. Each writes a dated report. Standalone.

---

## Installation

Install directly from inside Claude Code:

```text
/plugin marketplace add nexadevapp/nexa-claude-skills-marketplace
/plugin install nexa-claude-core
/plugin install nexa-claude-nextjs        # optional — only if you build on Next.js
/plugin install nexa-claude-go            # optional — only if you build on Go
/plugin install nexa-claude-audit         # optional — audit reports for any repository
```

Once installed, the skills are available as slash commands and the agent will suggest the right one for each task. You don't need to memorize them — describe what you want, and Claude routes you to the correct skill.

### Updating

New commits to this repo are picked up as new versions automatically (the git commit SHA is the version). To pull the latest skills, run from inside Claude Code:

```text
/plugin marketplace update nexa-claude-marketplace
/plugin update nexa-claude-core
/plugin update nexa-claude-nextjs
/plugin update nexa-claude-go
/plugin update nexa-claude-audit
```

If a skill still looks stale after updating (a known, still-open Claude Code plugin-cache bug — see [#14061](https://github.com/anthropics/claude-code/issues/14061) and [#17361](https://github.com/anthropics/claude-code/issues/17361)), remove the cache and reinstall: `rm -rf ~/.claude/plugins/cache`, then restart Claude Code and re-run the install commands above.

---

## `nexa-claude-core` — Stack-Agnostic Methodology

| Phase | Command | Description |
|---|---|---|
| **Always** | `/conventional-commit` | Write every commit message in Conventional Commits format with ASD-STE100 Simplified Technical English |
| **Setup** | `/setup-project-rules` | Write Nexa workflow enforcement rules into the project's CLAUDE.md |
| **Inception** | `/requirements` | Generate a requirements catalog from a vision document |
| **Elaboration** | `/entity-model` | Create an entity model with a Mermaid ER diagram |
| **Elaboration** | `/use-case-diagram` | Generate PlantUML use case diagrams |
| **Elaboration** | `/generate-wireframe` | Generate a low-fidelity wireframe from the use cases |
| **Elaboration** | `/engineer-requirements` | Cluster-based elaboration of all use cases with interactive refinement |
| **Construction** | `/use-case-spec` | Write detailed use case specifications |
| **Construction** | `/technical-task` | Create technical task specifications (non-user-facing work) |
| **Construction** | `/design-screens` | Create screen design specifications from the wireframe |
| **Reporting** | `/dashboard` | Generate the cluster-based project overview |
| **Verification** | `/code-review` | Independent code review (runs in isolation) |
| **Verification** | `/evaluate` | Evaluate an implementation against its spec and design (runs in isolation) |
| **Verification** | `/report-bug` | Create structured bug report documents |
| **Verification** | `/change-request` | Document an intentional change to an already-implemented use case |

Uses the **Context7** MCP server for up-to-date documentation lookups.

---

## `nexa-claude-nextjs` — Next.js Stack

Adds implementation, testing, and delivery skills specific to Next.js. Requires `nexa-claude-core`.

| Phase | Command | Description |
|---|---|---|
| **Setup** | `/setup-env-profiles` | Set up local/dev/test environment profiles with database URLs |
| **Setup** | `/setup-i18n` | Set up server-side internationalization with next-intl |
| **Setup** | `/setup-web-middleware` | Build auth, RBAC, and security-headers middleware |
| **Setup** | `/setup-arch-unit` | Set up arch-unit-ts architecture tests with a Husky pre-commit hook |
| **Setup** | `/setup-playwright-ci` | Generate a GitHub Actions workflow for Playwright E2E tests |
| **Setup** | `/setup-quality-ci` | Generate a GitHub Actions workflow for quality and coverage gates |
| **Setup** | `/onboard-existing-app` | Reverse-engineer requirements, entity model, and use cases from an existing Next.js codebase |
| **Construction** | `/prisma-migration` | Create Prisma schema models and migrations from the entity model |
| **Construction** | `/implement` | Implement use cases — pages, components, API routes, server actions |
| **Construction** | `/vitest-test` | Create Vitest integration tests with Testcontainers |
| **Construction** | `/playwright-test` | Create Playwright end-to-end tests |
| **Construction** | `/code-quality` | Run oxlint and oxfmt (lint, cyclomatic complexity, formatting) |
| **Construction** | `/mutation-test` | Run StrykerJS mutation testing on delivered business logic to verify the tests detect broken behaviour |
| **Construction** | `/deliver-use-case` | Orchestrate the full per-use-case pipeline: spec → design → implement → mutation-test → test → evaluate |
| **Delivery** | `/deliver-cluster` | Deliver a whole cluster: parallel worktrees in dependency order, then a serial merge queue |
| **Delivery** | `/merge-use-case` | Rebase a use case branch onto main, run the full regression gate, and merge |
| **Delivery** | `/merge-queue` | Land every ready branch and approved pull request from parallel agents, in dependency order, one at a time |
| **Construction** | `/resolve-bug` | Orchestrate the bugfix pipeline: reproduce → analyze + link requirements → fix |
| **Verification** | `/audit` | Deep quality audit: DoD, i18n, accessibility, visual fidelity, loading/error states |

Uses the **Context7** and **Playwright** MCP servers.

---

## `nexa-claude-go` — Go Stack

The same implementation, testing, and delivery pipeline for Go: `net/http` (stdlib router), templ + htmx for server-rendered UI, sqlc + goose on PostgreSQL, Testcontainers for local and test databases. Requires `nexa-claude-core`.

| Phase | Command | Description |
|---|---|---|
| **Setup** | `/setup-env-profiles` | Set up local/dev environment profiles, the config loader, and `cmd/dev` |
| **Setup** | `/setup-i18n` | Set up server-side internationalization with go-i18n and embedded catalogs |
| **Setup** | `/setup-web-middleware` | Build auth, RBAC, CSRF, security-headers, and panic-recovery middleware for `net/http` |
| **Setup** | `/setup-playwright-ci` | Generate a GitHub Actions workflow for Playwright E2E tests |
| **Setup** | `/setup-quality-ci` | Generate a GitHub Actions workflow for golangci-lint, generated-code drift, and coverage gates |
| **Setup** | `/setup-arch-unit` | Set up architecture rules with golangci-lint depguard/forbidigo and a git pre-commit hook |
| **Setup** | `/onboard-existing-app` | Reverse-engineer requirements, entity model, and use cases from an existing Go codebase |
| **Construction** | `/db-migration` | Create goose migrations and sqlc queries from the entity model |
| **Construction** | `/implement` | Implement use cases — handlers, templ views, services, sqlc queries |
| **Construction** | `/integration-test` | Create Go integration tests with testcontainers-go |
| **Construction** | `/playwright-test` | Create Playwright for Go end-to-end tests, run with `go test -tags=e2e` |
| **Construction** | `/code-quality` | Run golangci-lint (lint, gocyclo complexity) and gofumpt/goimports formatting |
| **Construction** | `/mutation-test` | Run gremlins mutation testing on delivered business logic |
| **Construction** | `/deliver-use-case` | Orchestrate the full per-use-case pipeline: spec → design → implement → mutation-test → test → evaluate |
| **Delivery** | `/deliver-cluster` | Deliver a whole cluster: parallel worktrees in dependency order, then a serial merge queue |
| **Delivery** | `/merge-use-case` | Rebase a use case branch onto main, run the full regression gate, and merge |
| **Delivery** | `/merge-queue` | Land every ready branch and approved pull request from parallel agents, in dependency order, one at a time |
| **Construction** | `/resolve-bug` | Orchestrate the bugfix pipeline: reproduce → analyze + link requirements → fix |
| **Verification** | `/audit` | Deep quality audit: DoD, i18n, accessibility, visual fidelity, htmx loading/error states |

Uses the **Context7** and **Playwright** MCP servers.

---

## `nexa-claude-audit` — Repository Audit

Audits any repository, whatever its stack, and whether or not it follows the Nexa methodology. Does not require `nexa-claude-core`.

| Phase | Command | Description |
|---|---|---|
| **Reporting** | `/qa-audit` | Inventory every test and put it in one category (unit, integration, E2E, misc); smoke tags; skipped tests |
| **Reporting** | `/requirements-traceability-audit` | Use case catalog, use case → test matrix by explicit ID, gaps, external references |
| **Reporting** | `/architecture-audit` | Existing docs and ADRs; dependencies from the implementation; C4, sequence, and ER diagrams from the code; 4+1 coverage; NFR trace |
| **Reporting** | `/infra-audit` | Infrastructure definitions, environments, secret references (names only), local dev infrastructure |
| **Reporting** | `/cicd-audit` | CI/CD system, pipelines, main pipeline flowchart, quality gates, gaps |
| **Reporting** | `/code-metrics-audit` | Cyclomatic complexity, duplicated code %, CBO, and DIT against fixed thresholds; static analysis only |
| **Reporting** | `/test-efficacy-audit` | Serial baseline test run (unit and Testcontainers integration) with coverage, time-boxed mutation run on the core logic first, second test run; line coverage and mutation score against fixed thresholds |

Each skill runs only when you invoke it and writes one new report to `docs/audit/<skill>/<skill>-YYYY-MM-DD-<short-hash>.md`. The skills read the repository only. Two exceptions: `/code-metrics-audit` runs static analysers, and `/test-efficacy-audit` runs the tests and the mutation tool in a temporary git worktree. Neither changes the working tree. The shared rules are in [`nexa-claude-audit/shared/AUDIT_CONTRACT.md`](nexa-claude-audit/shared/AUDIT_CONTRACT.md). Each report links to the glossary of its skill in [`nexa-claude-audit/glossary/`](nexa-claude-audit/glossary/), which explains the terms of that report.

---

## Workflow at a Glance

1. **Start with a vision** — a short `docs/vision.md` describing what you want to build.
2. **Elaborate** — `/requirements` → `/entity-model` → `/use-case-diagram` → `/engineer-requirements`.
3. **Specify** — `/use-case-spec` and `/design-screens`, or let `/deliver-use-case` write whichever is missing.
4. **Build** — `/setup-*` infrastructure once, then `/implement`, `/playwright-test`, `/code-quality`, plus `/vitest-test` (Next.js) or `/integration-test` (Go).
5. **Deliver** — `/deliver-cluster` delivers a whole cluster: it reads each use case's `Depends On` row, runs every unblocked use case at the same time in its own git worktree, and merges the green branches into `main` one at a time. `/deliver-use-case` does one use case; `/merge-use-case` runs the merge gate.
6. **Verify** — `/code-review`, `/evaluate`, `/audit`, `/report-bug`.
7. **Report** — `/dashboard` regenerates `docs/overview/`, which shows each cluster, what is delivered, and links to every specification, design, and acceptance test.

### Migrating from the sprint workflow

Sprints were removed. Before updating, finish or abandon any in-flight sprint branch — the new
flow delivers each use case on its own `uc/UC-XXX` worktree branch and merges it with
`--ff-only`. An existing `docs/sprints/` folder becomes an inert archive; nothing reads it, and
`/dashboard` writes to `docs/overview/` instead. Run `/setup-project-rules` again so the
project's CLAUDE.md carries the worktree rule instead of the sprint-branch rule. To stay on the
old workflow, pin to the [`nexa-alpha-sprints-harness`](https://github.com/nexadevapp/nexa-claude-skills-marketplace/releases/tag/nexa-alpha-sprints-harness) release.

See [GUIDE.md](./GUIDE.md) for a step-by-step walkthrough.

Each skill produces structured output (typically under a `docs/` folder in *your* project).

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how skills are structured and how to add or extend one.

## License

Licensed under the [Apache License 2.0](./LICENSE).

## Attribution

The `nexa-claude-core` plugin derives from two upstream projects. Every derived
file carries the original copyright notice in a header comment.

**[AI Unified Process Marketplace](https://github.com/AI-Unified-Process/marketplace)**
(`aiup-core`) by [Simon Martinelli](https://unifiedprocess.ai), used under the
Apache License 2.0. The `requirements`, `entity-model`, `use-case-diagram`, and
`use-case-spec` skills began as `aiup-core` skills and have been modified here.

**[agent-skills](https://github.com/addyosmani/agent-skills)** by
[Addy Osmani](https://addyosmani.com), used under the MIT License
([full text](./LICENSE-MIT-agent-skills)). The `nexa-skills` orchestrator skill
and the core plugin's `session-start.sh` hook derive from `using-agent-skills`
and its session-start hook, and have been modified here.

Nexa is an independent derivative work. It is not an official AI Unified Process
distribution and is not endorsed by Simon Martinelli or Martinelli LLC, nor is it
affiliated with or endorsed by Addy Osmani or the agent-skills project.
See [NOTICE](./NOTICE) for the full attribution.
