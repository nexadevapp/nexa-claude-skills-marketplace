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
│       ├── frontend-design/
│       ├── code-review/
│       └── evaluate/
├── nexa-claude-vaadin-jooq/             # Vaadin + jOOQ technology stack plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # Vaadin, KaribuTesting, jOOQ, JavaDocs, Playwright
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── flyway-migration/
│       ├── implement/
│       ├── karibu-test/
│       └── playwright-test/
├── nexa-claude-nestjs-nextjs/           # NestJS + Next.js technology stack plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json                 # context7, Playwright
│   └── skills/                   # All workflow steps as skills (slash commands)
│       ├── prisma-migration/
│       ├── implement/
│       ├── jest-test/
│       └── playwright-test/
└── README.md
```

## Plugin Architecture

### Two-Layer Design

- **nexa-claude-core** — Stack-agnostic methodology: from vision to use case specification. Works with any tech stack.
- **nexa-claude-vaadin-jooq** — Stack-specific: implementation and testing for the Vaadin + jOOQ stack. Requires nexa-claude-core.
- **nexa-claude-nestjs-nextjs** — Stack-specific: implementation and testing for the NestJS + Next.js stack. Requires nexa-claude-core.

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
| Construction | `/frontend-design`    | Create screen design specifications    |
| Verification | `/code-review`        | Independent code review (runs in isolation) |
| Verification | `/evaluate`           | Evaluate implementation against spec and design (runs in isolation) |

### Vaadin/jOOQ (stack-specific)

| Phase        | Skill (slash command) | Description                               |
|--------------|-----------------------|-------------------------------------------|
| Construction | `/flyway-migration`   | Create Flyway migrations                  |
| Construction | `/implement`          | Implement use cases or technical tasks using Vaadin and jOOQ |
| Construction | `/karibu-test`        | Create Karibu unit tests                  |
| Construction | `/playwright-test`    | Create Playwright integration tests       |

### NestJS/Next.js (stack-specific)

| Phase        | Skill (slash command)  | Description                                  |
|--------------|------------------------|----------------------------------------------|
| Construction | `/prisma-migration`    | Create Prisma schema and migrations          |
| Construction | `/implement`           | Implement use cases or technical tasks using NestJS and Next.js |
| Construction | `/jest-test`           | Create Jest unit/integration tests           |
| Construction | `/playwright-test`     | Create Playwright e2e tests                  |
| Transition   | `/aws-dockerize`       | Create production-ready Dockerfiles          |
| Transition   | `/aws-setup-apprunner` | Generate AWS App Runner deployment infrastructure |

## Git

- Do NOT bump the `version` field in `**/.claude-plugin/plugin.json` files. Always keep the version at `1.0.0` because the path is referenced in the instructions, in the skills.