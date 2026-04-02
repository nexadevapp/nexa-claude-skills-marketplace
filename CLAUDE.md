# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Nexa Agentic Engineering Marketplace is a collection of plugins for Claude Code that implement the Nexa Agentic Engineering methodology.
The repository is structured as a marketplace with a two-layer architecture: a stack-agnostic core and
technology-specific plugins.

## Repository Structure

```
nexa-claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace metadata listing all plugins
├── nexa-claude-core/                    # Stack-agnostic core methodology
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # context7
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── requirements/
│       ├── entity-model/
│       ├── use-case-diagram/
│       ├── use-case-spec/
│       ├── technical-task/
│       ├── prioritize/
│       ├── prepare-sprint/
│       ├── design-screens/
│       ├── refine-use-cases/
│       ├── code-review/
│       ├── evaluate/
│       └── report-bug/
├── nexa-claude-nextjs/                  # Next.js technology stack plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # context7, Playwright
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── setup-env-profiles/
│       ├── setup-i18n/
│       ├── prisma-migration/
│       ├── build-web-middleware/
│       ├── implement/
│       ├── vitest-test/
│       ├── playwright-test/
│       ├── code-quality/
│       ├── deliver-use-case/
│       ├── sprint-audit/
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

## Nexa Agentic Engineering Workflow

Skills follow the Nexa Agentic Engineering phases: Inception, Elaboration, Construction, Transition.

### Core (stack-agnostic)

| Phase        | Skill (slash command) | Description                            |
|--------------|-----------------------|----------------------------------------|
| Inception    | `/requirements`       | Generate requirements from vision      |
| Elaboration  | `/entity-model`       | Create entity model with Mermaid ER    |
| Elaboration  | `/use-case-diagram`   | Generate PlantUML use case diagrams    |
| Construction | `/use-case-spec`      | Write detailed use case specifications |
| Construction | `/technical-task`     | Create technical task specifications   |
| Construction | `/prioritize`         | Recommend implementation order         |
| Construction | `/prepare-sprint`     | Select, refine, and validate use cases for sprint delivery |
| Construction | `/design-screens`     | Create screen design specifications    |
| Elaboration  | `/refine-use-cases`   | Generate all specs & designs, then GAP analysis |
| Verification | `/code-review`        | Independent code review (runs in isolation) |
| Verification | `/evaluate`           | Evaluate implementation against spec and design (runs in isolation) |
| Verification | `/report-bug`         | Create structured bug report documents                             |

### Next.js (stack-specific)

| Phase        | Skill (slash command)   | Description                                                        |
|--------------|-------------------------|--------------------------------------------------------------------|
| Setup        | `/setup-env-profiles`   | Set up local/dev/prod environment profiles with database URLs      |
| Setup        | `/setup-i18n`           | Set up server-side internationalization with next-intl              |
| Construction | `/prisma-migration`     | Create Prisma schema and migrations                                |
| Construction | `/build-web-middleware` | Build auth, RBAC, and security headers middleware                  |
| Construction | `/implement`            | Implement use cases or technical tasks using Next.js               |
| Construction | `/vitest-test`          | Create Vitest integration tests with Testcontainers                |
| Construction | `/playwright-test`      | Create Playwright e2e tests                                        |
| Construction | `/code-quality`         | Run ESLint and Prettier checks                                     |
| Construction | `/deliver-use-case`     | Orchestrate full pipeline from spec to evaluation for a use case   |
| Verification | `/sprint-audit`         | Cross-cutting sprint quality checks (i18n, a11y, styles, auth, nav)|
| Transition   | `/aws-dockerize`        | Create production-ready Dockerfiles                                |
| Transition   | `/aws-setup-apprunner`  | Generate AWS App Runner deployment infrastructure                  |

## Git

- Do NOT bump the `version` field in `**/.claude-plugin/plugin.json` files. Always keep the version at `1.0.0` because the path is referenced in the instructions, in the skills.