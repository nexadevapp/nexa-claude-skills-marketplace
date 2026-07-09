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
│       ├── sprint-prepare/
│       ├── generate-wireframe/
│       ├── design-screens/
│       ├── code-review/
│       ├── evaluate/
│       ├── report-bug/
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
│       ├── deliver-use-case/
│       ├── sprint-kickoff/
│       ├── sprint-deliver/
│       ├── sprint-complete/
│       ├── setup-playwright-ci/
│       └── setup-quality-ci/
└── README.md
```

## Plugin Architecture

### Two-Layer Design

- **nexa-claude-core** — Stack-agnostic methodology: from vision to use case specification. Works with any tech stack.
- **nexa-claude-nextjs** — Stack-specific: implementation, testing, and delivery for the Next.js stack. Requires nexa-claude-core.

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
| Setup        | `/setup-project-rules`| Write Nexa workflow enforcement rules into the project's CLAUDE.md |
| Inception    | `/requirements`       | Generate requirements from vision      |
| Elaboration  | `/entity-model`       | Create entity model with Mermaid ER    |
| Elaboration  | `/use-case-diagram`   | Generate PlantUML use case diagrams    |
| Elaboration  | `/generate-wireframe` | Generate low-fidelity wireframe from use cases |
| Elaboration  | `/engineer-requirements` | Clustered elaboration of all use cases with interactive refinement |
| Construction | `/use-case-spec`      | Write detailed use case specifications |
| Construction | `/technical-task`     | Create technical task specifications   |
| Construction | `/sprint-prepare`     | Select, refine, and validate use cases for sprint delivery |
| Construction | `/design-screens`     | Create screen design specifications    |
| Verification | `/code-review`        | Independent code review (runs in isolation) |
| Verification | `/evaluate`           | Evaluate implementation against spec and design (runs in isolation) |
| Verification | `/report-bug`         | Create structured bug report documents                             |
| Verification | `/change-request`     | Create structured change request documents for intentional modifications to implemented use cases |

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
| Construction | `/deliver-use-case`     | Orchestrate full pipeline from spec to evaluation for a use case   |
| Verification | `/audit`                | Deep quality audit: DoD, i18n, accessibility, visual fidelity, loading/error states |
| Construction | `/sprint-kickoff`       | Create sprint branch and start delivery                            |
| Construction | `/sprint-deliver`       | Deliver use cases in priority order from readiness report          |
| Completion   | `/sprint-complete`      | Close sprint: validate, close GH issues, dashboard, archive, publish |

## Shared gate files (cross-plugin sync)

`nexa-claude-core/shared/` holds the readiness/tracking gate files (`DEFINITION_OF_*`, `SPRINT_BRANCH_GATE.md`, `NEXA_RULES_GATE.md`, `TRACKING.md`, etc.). Next.js skills reference them via `${CLAUDE_PLUGIN_ROOT}/shared/...`, but that variable resolves to the *nextjs* plugin root — so each referenced file must also physically exist as a byte-identical copy in `nexa-claude-nextjs/shared/`.

- **`nexa-claude-core/shared/` is the single source of truth.** Never edit the copies under `nexa-claude-nextjs/shared/`.
- To change a synced gate file: edit it in core, then run `scripts/sync-shared.sh` from the repo root, then commit both the core change and the regenerated nextjs copy.
- Exception: `nexa-claude-nextjs/shared/readiness/PROJECT_READINESS.md` is owned by the nextjs plugin (no core counterpart) and is edited there directly.
- The set of files to mirror is derived automatically from the `${CLAUDE_PLUGIN_ROOT}/shared/...` references in nextjs skills — no hand-maintained manifest.

## Commands

This is a markdown plugin repo — there is no build, compile, or unit-test step. The one verification command:

- `scripts/sync-shared.sh` — sync core shared files into nextjs.
- `scripts/sync-shared.sh --check` — verify no drift and no dangling `shared/...` references. Run this before committing changes to any `shared/` file or nextjs skill; CI (`.github/workflows/sync-shared.yml`) runs it on every PR.

To test a skill, install the repo as a local marketplace (`/plugin marketplace add /path/to/this/repo`), install the plugin, and invoke the slash command. See `CONTRIBUTING.md`.

## Other plugin contents

Beyond `skills/`, each plugin may contain:

- `agents/` — subagent definitions for skills that run in isolation (e.g. `nexa-claude-core/agents/evaluate.md`, `nexa-claude-nextjs/agents/playwright-test.md`).
- `hooks/` — e.g. `nexa-claude-core/hooks/` registers a `SessionStart` hook.
- `.mcp.json` — MCP servers (core: context7; nextjs: Playwright).

## When you add, rename, or remove a skill

Keep these in sync (per `CONTRIBUTING.md`):

1. The skill's `name:` frontmatter must match its directory name exactly.
2. Update the tables in `README.md`, this `CLAUDE.md`, and the `nexa-skills` orchestrator index (`nexa-claude-core/skills/nexa-skills/SKILL.md`).

## Git

- Do NOT add a `version` field to `**/.claude-plugin/plugin.json` files. The field is intentionally omitted so the git commit SHA drives versioning — every commit counts as a new version, which is what lets `/plugin update` actually pull skill changes. A pinned `version` freezes users on their first-installed commit.
- Skills reference files within their own plugin using `${CLAUDE_PLUGIN_ROOT}` — never hardcode the cache path.

## Boundaries

- Always: Follow the skill anatomy in `CONTRIBUTING.md` ("Anatomy of a skill") for new skills — frontmatter (`name`, `description` with trigger phrases), `When to use`, ordered `Process`, and a `Verification` step.
- Never: Add skills that are vague advice instead of actionable processes
- Never: Duplicate content between skills — reference other skills instead