# CLAUDE.md

This is the Nexa skills project for Claude – a collection of professional-level engineering skills for AI coding agents

## Overview

Nexa Agentic Engineering Marketplace is a collection of plugins for Claude Code that implement the Nexa Agentic Engineering methodology.
The repository is structured as a marketplace with a two-layer architecture: a stack-agnostic core and
technology-specific plugins.

## Repository Structure

```
nexa-claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace metadata listing all plugins
├── nexa-claude-core/             # Stack-agnostic core methodology
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # context7
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── requirements/
│       ├── entity-model/
│       ├── use-case-diagram/
│       ├── engineer-requirements/
│       ├── use-case-spec/
│       ├── technical-task/
│       ├── generate-wireframe/
│       ├── design-screens/
│       ├── code-review/
│       ├── dashboard/
│       ├── evaluate/
│       ├── report-bug/
│       ├── conventional-commit/
│       └── setup-project-rules/
├── nexa-claude-nextjs/                  # Next.js technology stack plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # context7, Playwright
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── setup-env-profiles/
│       ├── setup-i18n/
│       ├── setup-arch-unit/
│       ├── onboard-existing-app/
│       ├── prisma-migration/
│       ├── setup-web-middleware/
│       ├── implement/
│       ├── vitest-test/
│       ├── playwright-test/
│       ├── code-quality/
│       ├── mutation-test/
│       ├── deliver-use-case/
│       ├── deliver-cluster/
│       ├── merge-use-case/
│       ├── merge-queue/
│       ├── resolve-bug/
│       ├── setup-playwright-ci/
│       └── setup-quality-ci/
├── nexa-claude-go/                      # Go technology stack plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # Playwright
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── setup-env-profiles/
│       ├── setup-i18n/
│       ├── setup-arch-unit/
│       ├── onboard-existing-app/
│       ├── setup-web-middleware/
│       ├── db-migration/
│       ├── implement/
│       ├── integration-test/
│       ├── playwright-test/
│       ├── code-quality/
│       ├── mutation-test/
│       ├── deliver-use-case/
│       ├── deliver-cluster/
│       ├── merge-use-case/
│       ├── merge-queue/
│       ├── resolve-bug/
│       ├── audit/
│       ├── setup-playwright-ci/
│       └── setup-quality-ci/
├── nexa-claude-audit/                   # Repository audit plugin (any stack)
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── skills/
│       └── software-engineering-report/
└── README.md
```

## Plugin Architecture

### Two-Layer Design

- **nexa-claude-core** — Stack-agnostic methodology: from vision to use case specification. Works with any tech stack.
- **nexa-claude-nextjs** — Stack-specific: implementation, testing, and delivery for the Next.js stack. Requires nexa-claude-core.
- **nexa-claude-go** — Stack-specific: implementation, testing, and delivery for the Go stack (`net/http`, templ + htmx, sqlc + goose, PostgreSQL). Requires nexa-claude-core.
- **nexa-claude-audit** — Stack-agnostic repository audit: a dated software engineering report for any repository. Standalone; does not require nexa-claude-core.

### Marketplace Configuration

- `marketplace.json` defines the marketplace with owner info and an array of plugins
- Each plugin entry has `name`, `source` (path), and `description`

### Plugin Structure

Each plugin contains:

- `.claude-plugin/plugin.json` - Plugin metadata (name, version, author)
- `.mcp.json` - MCP server configurations for external tools
- `skills/` - Skills with SKILL.md definitions; each skill is also a slash command

## Skill Naming Conventions

- **`setup-` prefix** — Skills that establish **foundational infrastructure, configuration, or tooling** for the repository must be prefixed with `setup-` (e.g., `setup-env-profiles`, `setup-i18n`, `setup-web-middleware`, `setup-playwright-ci`). These are typically run once but may be re-run when requirements change (new roles, new locales, new environments). When creating a new skill, check whether it sets up cross-cutting or foundational concerns; if so, name it `setup-<name>` and place it under the Setup phase accordingly.
- All other skills (run repeatedly during development) use plain names without a prefix.

## Nexa Agentic Engineering Workflow

Skills follow the Nexa Agentic Engineering phases: Inception, Elaboration, Construction, Infrastructure.

### Core (stack-agnostic)

| Phase        | Skill (slash command) | Description                            |
|--------------|-----------------------|----------------------------------------|
| Always       | `/conventional-commit`| Write every commit message in Conventional Commits + ASD-STE100 format |
| Setup        | `/setup-project-rules`| Write Nexa workflow enforcement rules into the project's CLAUDE.md |
| Inception    | `/requirements`       | Generate requirements from vision      |
| Elaboration  | `/entity-model`       | Create entity model with Mermaid ER    |
| Elaboration  | `/use-case-diagram`   | Generate PlantUML use case diagrams    |
| Elaboration  | `/generate-wireframe` | Generate low-fidelity wireframe from use cases |
| Elaboration  | `/engineer-requirements` | Clustered elaboration of all use cases with interactive refinement |
| Construction | `/use-case-spec`      | Write detailed use case specifications |
| Construction | `/technical-task`     | Create technical task specifications   |
| Construction | `/design-screens`     | Create screen design specifications    |
| Reporting    | `/dashboard`          | Generate the cluster based project overview |
| Verification | `/code-review`        | Independent code review (runs in isolation) |
| Verification | `/evaluate`           | Evaluate implementation against spec and design (runs in isolation) |
| Verification | `/report-bug`         | Create structured bug report documents                             |
| Verification | `/change-request`     | Create structured change request documents for intentional modifications to implemented use cases |

The `delivery-trail` agent (`nexa-claude-core/agents/delivery-trail.md`) writes `docs/delivery/<ID>-traceability.md`. `/setup-project-rules` installs the pre-commit gate that requires it before a work item reaches Done.

### Next.js (stack-specific)

| Phase        | Skill (slash command)   | Description                                                        |
|--------------|-------------------------|--------------------------------------------------------------------|
| Setup        | `/setup-env-profiles`   | Set up local/dev/prod environment profiles with database URLs      |
| Setup        | `/setup-i18n`           | Set up server-side internationalization with next-intl              |
| Setup        | `/setup-web-middleware` | Build auth, RBAC, and security headers middleware                  |
| Setup        | `/setup-playwright-ci`  | Generate GitHub Actions workflow for Playwright E2E tests          |
| Setup        | `/setup-quality-ci`     | Generate GitHub Actions workflow for code quality and coverage gates |
| Setup        | `/setup-arch-unit`      | Set up arch-unit-ts architecture tests with a Next.js default rule set and a dedicated Husky pre-commit hook |
| Setup        | `/onboard-existing-app` | Reverse-engineer requirements, entity model, and use cases from an existing Next.js codebase |
| Construction | `/prisma-migration`     | Create Prisma schema and migrations                                |
| Construction | `/implement`            | Implement use cases or technical tasks using Next.js               |
| Construction | `/vitest-test`          | Create Vitest integration tests with Testcontainers                |
| Construction | `/playwright-test`      | Create Playwright e2e tests                                        |
| Construction | `/code-quality`         | Run oxlint and oxfmt checks (lint, complexity, formatting)         |
| Construction | `/mutation-test`        | Run StrykerJS mutation testing on delivered business logic         |
| Construction | `/deliver-use-case`     | Orchestrate full pipeline from spec to evaluation for one use case |
| Construction | `/deliver-cluster`      | Deliver a cluster: parallel worktrees, dependency order, serial merge queue |
| Construction | `/merge-use-case`       | Rebase a use case branch onto main, run the regression gate, merge |
| Construction | `/merge-queue`          | Land every ready branch and approved PR from parallel agents, in dependency order |
| Construction | `/resolve-bug`          | Orchestrate the bugfix pipeline: reproduce, analyze, link requirements, fix |
| Verification | `/audit`                | Deep quality audit: DoD, i18n, accessibility, visual fidelity, loading/error states |

### Go (stack-specific)

| Phase        | Skill (slash command)   | Description                                                        |
|--------------|-------------------------|--------------------------------------------------------------------|
| Setup        | `/setup-env-profiles`   | Set up local/dev environment profiles, the config loader, and `cmd/dev` |
| Setup        | `/setup-i18n`           | Set up server-side internationalization with go-i18n and embedded catalogs |
| Setup        | `/setup-web-middleware` | Build auth, RBAC, CSRF, security headers, and panic recovery middleware for `net/http` |
| Setup        | `/setup-playwright-ci`  | Generate GitHub Actions workflow for Playwright E2E tests          |
| Setup        | `/setup-quality-ci`     | Generate GitHub Actions workflow for golangci-lint, generate drift, and coverage gates |
| Setup        | `/setup-arch-unit`      | Set up architecture rules with golangci-lint depguard/forbidigo and a git pre-commit hook |
| Setup        | `/onboard-existing-app` | Reverse-engineer requirements, entity model, and use cases from an existing Go codebase |
| Construction | `/db-migration`         | Create goose migrations and sqlc queries from the entity model     |
| Construction | `/implement`            | Implement use cases or technical tasks with net/http, templ, and htmx |
| Construction | `/integration-test`     | Create Go integration tests with testcontainers-go                 |
| Construction | `/playwright-test`      | Create Playwright for Go e2e tests (`go test -tags=e2e`)           |
| Construction | `/code-quality`         | Run golangci-lint (lint, gocyclo complexity) and gofumpt/goimports formatting |
| Construction | `/mutation-test`        | Run gremlins mutation testing on delivered business logic          |
| Construction | `/deliver-use-case`     | Orchestrate full pipeline from spec to evaluation for one use case |
| Construction | `/deliver-cluster`      | Deliver a cluster: parallel worktrees, dependency order, serial merge queue |
| Construction | `/merge-use-case`       | Rebase a use case branch onto main, run the regression gate, merge |
| Construction | `/merge-queue`          | Land every ready branch and approved PR from parallel agents, in dependency order |
| Construction | `/resolve-bug`          | Orchestrate the bugfix pipeline: reproduce, analyze, link requirements, fix |
| Verification | `/audit`                | Deep quality audit: DoD, i18n, accessibility, visual fidelity, htmx loading/error states |

### Audit (any stack)

| Phase        | Skill (slash command)          | Description                                                        |
|--------------|--------------------------------|--------------------------------------------------------------------|
| Reporting    | `/software-engineering-report` | Add a dated entry to `docs/software-engineering-report.md`: traceability, test pyramid, architecture diagrams, infrastructure, CI/CD. Explicit invocation only |

## Shared gate files (cross-plugin sync)

`nexa-claude-core/shared/` holds the readiness/tracking gate files (`DEFINITION_OF_*`, `WORKTREE_GATE.md`, `NEXA_RULES_GATE.md`, `TRACKING.md`, etc.). Stack plugin skills (Next.js, Go) reference them via `${CLAUDE_PLUGIN_ROOT}/shared/...`, but that variable resolves to the *stack* plugin root — so each referenced file must also physically exist as a byte-identical copy in `nexa-claude-nextjs/shared/` and `nexa-claude-go/shared/`.

- **`nexa-claude-core/shared/` is the single source of truth.** Never edit the copies under a stack plugin's `shared/`.
- To change a synced gate file: edit it in core, then run `scripts/sync-shared.sh` from the repo root, then commit both the core change and the regenerated stack copies.
- Exception: `<stack>/shared/readiness/PROJECT_READINESS.md` is owned by each stack plugin (no core counterpart) and is edited there directly.
- Stack plugins are discovered as every `nexa-claude-*/` directory except core. The set of files to mirror is derived automatically from the `${CLAUDE_PLUGIN_ROOT}/shared/...` references in each stack's skills — no hand-maintained manifest.

## Commands

This is a markdown plugin repo — there is no build, compile, or unit-test step. The one verification command:

- `scripts/sync-shared.sh` — sync core shared files into every stack plugin.
- `scripts/test-hooks.sh` — run every `*.test.sh` under a `hooks/` directory (the plan-saving hook, the delivery-trail pre-commit gate).
- `scripts/sync-shared.sh --check` — verify no drift and no dangling `shared/...` references. Run this before committing changes to any `shared/` file or stack plugin skill; CI (`.github/workflows/sync-shared.yml`) runs it on every PR.

To test a skill, install the repo as a local marketplace (`/plugin marketplace add /path/to/this/repo`), install the plugin, and invoke the slash command. See `CONTRIBUTING.md`.

## Other plugin contents

Beyond `skills/`, each plugin may contain:

- `agents/` — subagent definitions for skills that run in isolation (e.g. `nexa-claude-core/agents/evaluate.md`, `nexa-claude-core/agents/delivery-trail.md`, `nexa-claude-nextjs/agents/playwright-test.md`, `nexa-claude-go/agents/playwright-test.md`).
- `hooks/` — e.g. `nexa-claude-core/hooks/` registers a `SessionStart` hook.
- `.mcp.json` — MCP servers (core: context7; nextjs and go: Playwright).

## When you add, rename, or remove a skill

Keep these in sync (per `CONTRIBUTING.md`):

1. The skill's `name:` frontmatter must match its directory name exactly.
2. Update the tables in `README.md`, this `CLAUDE.md`, and the `nexa-skills` orchestrator index (`nexa-claude-core/skills/nexa-skills/SKILL.md`).

## Git

- This repo does **trunk-based development**: commit straight to `main`. Do not open a branch for
  ordinary work, and do not ask to. Keep each commit small, green, and self-contained, since `main`
  is what `/plugin update` serves to installed users — every commit is a release. Branch only for
  work that must not reach users half-finished, and merge it back fast.
- Do NOT add a `version` field to `**/.claude-plugin/plugin.json` files. The field is intentionally omitted so the git commit SHA drives versioning — every commit counts as a new version, which is what lets `/plugin update` actually pull skill changes. A pinned `version` freezes users on their first-installed commit.
- Skills reference files within their own plugin using `${CLAUDE_PLUGIN_ROOT}` — never hardcode the cache path.

## Boundaries

- Always: Follow the skill anatomy in `CONTRIBUTING.md` ("Anatomy of a skill") for new skills — frontmatter (`name`, `description` with trigger phrases), `When to use`, ordered `Process`, and a `Verification` step.
- Never: Add skills that are vague advice instead of actionable processes
- Never: Duplicate content between skills — reference other skills instead
- Never: Remove an upstream attribution header comment from the derived `nexa-claude-core` files listed in [NOTICE](./NOTICE) — the AI Unified Process files are Apache-2.0 and the agent-skills files are MIT, and both licenses require retaining them.