# Nexa Agentic Engineering Marketplace

A collection of Claude Code plugins that implement a structured software development lifecycle (SDLC) methodology. Provides slash commands in Claude Code that guide you through every phase of building software — from gathering requirements to deploying to AWS.

## Plugins

### nexa-claude-core — Stack-Agnostic Methodology

Covers the universal phases of software development. 12 skills (slash commands):

| Phase | Commands | Description |
|---|---|---|
| **Inception** | `/requirements` | Generate requirements from a vision doc |
| **Elaboration** | `/entity-model` | Create entity model with Mermaid ER diagrams |
| **Elaboration** | `/use-case-diagram` | Generate PlantUML use case diagrams |
| **Construction** | `/use-case-spec` | Write detailed use case specifications |
| **Construction** | `/technical-task` | Create technical task specifications |
| **Construction** | `/prioritize` | Recommend implementation order |
| **Construction** | `/sprint-prepare` | Select, refine, and validate use cases for sprint delivery |
| **Construction** | `/design-screens` | Create screen design specifications |
| **Elaboration** | `/refine-use-cases` | Generate all specs & designs, then GAP analysis |
| **Verification** | `/code-review` | Independent code review (runs in isolation) |
| **Verification** | `/evaluate` | Evaluate implementation against spec and design (runs in isolation) |
| **Verification** | `/report-bug` | Create structured bug report documents |

Uses the **Context7** MCP server for documentation lookups.

### nexa-claude-nextjs — Next.js Stack Plugin

Adds implementation, testing, and deployment skills specific to Next.js. Requires nexa-claude-core.

| Phase | Commands | Description |
|---|---|---|
| **Setup** | `/setup-env-profiles` | Set up local/dev/prod environment profiles with database URLs |
| **Setup** | `/setup-i18n` | Set up server-side internationalization with next-intl |
| **Construction** | `/prisma-migration` | Create Prisma schema and migrations |
| **Construction** | `/build-web-middleware` | Build auth, RBAC, and security headers middleware |
| **Construction** | `/implement` | Implement use cases or technical tasks using Next.js |
| **Testing** | `/vitest-test` | Create Vitest integration tests with Testcontainers |
| **Testing** | `/playwright-test` | Create Playwright e2e tests |
| **Testing** | `/code-quality` | Run ESLint and Prettier checks |
| **Delivery** | `/deliver-use-case` | Orchestrate full pipeline from spec to evaluation |
| **Delivery** | `/sprint-audit` | Cross-cutting sprint quality checks (i18n, a11y, styles, auth, nav) |
| **Delivery** | `/sprint-kickoff` | Kick off a sprint |
| **Delivery** | `/sprint-deliver` | Deliver a sprint |
| **Transition** | `/aws-dockerize` | Create production-ready Dockerfiles |
| **Transition** | `/aws-setup-ecs` | Generate ECS Express Mode Terraform infrastructure with ECR, Secrets Manager, and CI/CD |

Uses the **Playwright** MCP server for browser-based testing.

## Installation

Add the plugins to your project's Claude Code settings (`.claude/settings.json`):

```json
{
  "plugins": [
    "/path/to/nexa-claude-skills-marketplace/nexa-claude-core",
    "/path/to/nexa-claude-skills-marketplace/nexa-claude-nextjs"
  ]
}
```

## Usage

1. **Start with a vision doc** — Create `docs/vision.md` in your project describing what you want to build.

2. **Follow the workflow** — Run the slash commands in order:
   - `/requirements` to generate requirements from your vision
   - `/entity-model` to design your data model
   - `/use-case-diagram` to map out use cases
   - `/use-case-spec` to detail each use case
   - `/technical-task` to break use cases into tasks
   - `/prioritize` to determine implementation order
   - `/sprint-prepare` to plan your sprint
   - `/design-screens` to design the UI
   - `/implement` (Next.js) to build it
   - `/vitest-test` / `/playwright-test` to test it
   - `/code-review` / `/evaluate` to verify quality
   - `/aws-dockerize` / `/aws-setup-ecs` to deploy

Each skill produces structured output (typically under a `docs/` folder in your project).
