# Nexa Agentic Engineering Marketplace

A collection of [Claude Code](https://claude.com/claude-code) plugins that implement a structured software development lifecycle (SDLC) methodology. Each plugin adds slash commands that guide you — and the agent — through every phase of building software, from gathering requirements to delivering tested, reviewed use cases.

The marketplace has a **two-layer architecture**:

- **`nexa-claude-core`** — stack-agnostic methodology, from a vision document to detailed use case specifications and designs. Works with any tech stack.
- **`nexa-claude-nextjs`** — the Next.js stack: implementation, testing, quality gates, and sprint delivery. Requires `nexa-claude-core`.
- **`nexa-claude-react-spa-dotnet`** — the React SPA + ASP.NET Core (.NET) stack: implementation, testing, and per-use-case delivery. Requires `nexa-claude-core`. *(Foundational slice — the delivery pipeline; `setup-*`, `sprint-*`, and `audit` skills are planned.)*

---

## Installation

Install directly from inside Claude Code:

```text
/plugin marketplace add nexadevapp/nexa-claude-skills-marketplace
/plugin install nexa-claude-core
/plugin install nexa-claude-nextjs                 # optional — only if you build on Next.js
/plugin install nexa-claude-react-spa-dotnet       # optional — only if you build on React SPA + .NET
```

Once installed, the skills are available as slash commands and the agent will suggest the right one for each task. You don't need to memorize them — describe what you want, and Claude routes you to the correct skill.

---

## `nexa-claude-core` — Stack-Agnostic Methodology

| Phase | Command | Description |
|---|---|---|
| **Setup** | `/setup-project-rules` | Write Nexa workflow enforcement rules into the project's CLAUDE.md |
| **Inception** | `/requirements` | Generate a requirements catalog from a vision document |
| **Elaboration** | `/entity-model` | Create an entity model with a Mermaid ER diagram |
| **Elaboration** | `/use-case-diagram` | Generate PlantUML use case diagrams |
| **Elaboration** | `/generate-wireframe` | Generate a low-fidelity wireframe from the use cases |
| **Elaboration** | `/engineer-requirements` | Cluster-based elaboration of all use cases with interactive refinement |
| **Construction** | `/use-case-spec` | Write detailed use case specifications |
| **Construction** | `/technical-task` | Create technical task specifications (non-user-facing work) |
| **Construction** | `/sprint-prepare` | Select, refine, and validate use cases for sprint delivery |
| **Construction** | `/design-screens` | Create screen design specifications from the wireframe |
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
| **Construction** | `/prisma-migration` | Create Prisma schema models and migrations from the entity model |
| **Construction** | `/implement` | Implement use cases — pages, components, API routes, server actions |
| **Construction** | `/vitest-test` | Create Vitest integration tests with Testcontainers |
| **Construction** | `/playwright-test` | Create Playwright end-to-end tests |
| **Construction** | `/code-quality` | Run oxlint and oxfmt (lint, cyclomatic complexity, formatting) |
| **Construction** | `/deliver-use-case` | Orchestrate the full per-use-case pipeline: implement → test → evaluate |
| **Verification** | `/audit` | Deep quality audit: DoD, i18n, accessibility, visual fidelity, loading/error states |
| **Delivery** | `/sprint-kickoff` | Create the sprint branch and start delivery |
| **Delivery** | `/sprint-deliver` | Deliver use cases in priority order from the readiness report |
| **Delivery** | `/sprint-complete` | Close the sprint: validate, close issues, archive, open a PR |

Uses the **Context7** and **Playwright** MCP servers.

---

## `nexa-claude-react-spa-dotnet` — React SPA + ASP.NET Core Stack

Adds implementation, testing, and delivery skills for a split **React single-page app + ASP.NET Core (.NET) API** stack (EF Core, PostgreSQL, xUnit). Requires `nexa-claude-core`.

| Phase | Command | Description |
|---|---|---|
| **Construction** | `/ef-migration` | Create EF Core entity classes and migrations from the entity model |
| **Construction** | `/implement` | Implement use cases — ASP.NET Core controllers/services + React SPA (React Query, react-hook-form/yup) |
| **Construction** | `/xunit-test` | Create xUnit integration tests against a real database (Testcontainers + WebApplicationFactory) |
| **Construction** | `/playwright-test` | Create Playwright end-to-end tests driving the React SPA against the API |
| **Construction** | `/code-quality` | Run `dotnet format` (backend) and ESLint + Prettier (frontend) |
| **Construction** | `/deliver-use-case` | Orchestrate the full per-use-case pipeline: implement → test → evaluate |

Uses the **Context7** and **Playwright** MCP servers.

> **Foundational slice.** This plugin currently ships the core delivery pipeline. Setup skills (`setup-env-profiles`, `setup-web-middleware`, `setup-i18n`, `setup-arch-unit`, CI), the `sprint-*` orchestration trio, and `audit` are planned but not yet available for this stack.

---

## Workflow at a Glance

1. **Start with a vision** — a short `docs/vision.md` describing what you want to build.
2. **Elaborate** — `/requirements` → `/entity-model` → `/use-case-diagram` → `/engineer-requirements`.
3. **Specify** — `/use-case-spec` and `/design-screens` (or `/sprint-prepare` to do a whole sprint's worth at once).
4. **Build (Next.js)** — `/setup-*` infrastructure once, then `/implement`, `/vitest-test`, `/playwright-test`, `/code-quality`.
5. **Deliver** — `/deliver-use-case` runs implement → test → evaluate and iterates until the quality gates pass. `/sprint-kickoff` → `/sprint-deliver` → `/sprint-complete` runs a whole sprint.
6. **Verify** — `/code-review`, `/evaluate`, `/audit`, `/report-bug`.

See [GUIDE.md](./GUIDE.md) for a step-by-step walkthrough.

Each skill produces structured output (typically under a `docs/` folder in *your* project).

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how skills are structured and how to add or extend one.

## License

Licensed under the [Apache License 2.0](./LICENSE).
