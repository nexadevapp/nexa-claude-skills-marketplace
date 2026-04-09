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
│       ├── sprint-rework/
│       ├── setup-playwright-ci/
│       ├── aws-dockerize/
│       └── aws-setup-apprunner/
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

### Next.js (stack-specific)

| Phase        | Skill (slash command)   | Description                                                        |
|--------------|-------------------------|--------------------------------------------------------------------|
| Setup        | `/setup-env-profiles`   | Set up local/dev/prod environment profiles with database URLs      |
| Setup        | `/setup-i18n`           | Set up server-side internationalization with next-intl              |
| Setup        | `/setup-web-middleware` | Build auth, RBAC, and security headers middleware                  |
| Setup        | `/setup-playwright-ci`  | Generate GitHub Actions workflow for Playwright E2E tests          |
| Construction | `/prisma-migration`     | Create Prisma schema and migrations                                |
| Construction | `/implement`            | Implement use cases or technical tasks using Next.js               |
| Construction | `/vitest-test`          | Create Vitest integration tests with Testcontainers                |
| Construction | `/playwright-test`      | Create Playwright e2e tests                                        |
| Construction | `/code-quality`         | Run ESLint and Prettier checks                                     |
| Construction | `/deliver-use-case`     | Orchestrate full pipeline from spec to evaluation for a use case   |
| Construction | `/sprint-kickoff`       | Create sprint branch and start delivery                            |
| Construction | `/sprint-deliver`       | Deliver use cases in priority order from readiness report          |
| Completion   | `/sprint-complete`      | Close sprint: validate, close GH issues, dashboard, archive, publish |
| Completion   | `/sprint-rework`        | Reset sprint branch to main and re-deliver after PR review           |
| Infrastructure | `/aws-dockerize`        | Create production-ready Dockerfiles                                |
| Infrastructure | `/aws-setup-apprunner`  | Generate AWS App Runner deployment infrastructure                  |

## Git

- Do NOT bump the `version` field in `**/.claude-plugin/plugin.json` files. Always keep the version at `1.0.0`.
- Skills reference files within their own plugin using `${CLAUDE_PLUGIN_ROOT}` — never hardcode the cache path.

## Boundaries

- Always: Follow the skill-anatomy.md format for new skills
- Never: Add skills that are vague advice instead of actionable processes
- Never: Duplicate content between skills — reference other skills instead