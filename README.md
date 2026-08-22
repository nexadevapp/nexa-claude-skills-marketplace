# Nexa Agentic Engineering Marketplace

A collection of [Claude Code](https://claude.com/claude-code) plugins that implement a structured software development lifecycle (SDLC) methodology. Each plugin adds slash commands that guide you — and the agent — through every phase of building software, from gathering requirements to delivering tested, reviewed use cases.

The marketplace has a **two-layer architecture**:

- **`nexa-claude-core`** — stack-agnostic methodology, from a vision document to detailed use case specifications and designs. Works with any tech stack.
- **`nexa-claude-nextjs`** — the Next.js stack: implementation, testing, quality gates, and parallel delivery. Requires `nexa-claude-core`.

---

## Installation

Install directly from inside Claude Code:

```text
/plugin marketplace add nexadevapp/nexa-claude-skills-marketplace
/plugin install nexa-claude-core
/plugin install nexa-claude-nextjs        # optional — only if you build on Next.js
```

Once installed, the skills are available as slash commands and the agent will suggest the right one for each task. You don't need to memorize them — describe what you want, and Claude routes you to the correct skill.

### Updating

New commits to this repo are picked up as new versions automatically (the git commit SHA is the version). To pull the latest skills, run from inside Claude Code:

```text
/plugin marketplace update nexa-claude-marketplace
/plugin update nexa-claude-core
/plugin update nexa-claude-nextjs
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
| **Construction** | `/resolve-bug` | Orchestrate the bugfix pipeline: reproduce → analyze + link requirements → fix |
| **Verification** | `/audit` | Deep quality audit: DoD, i18n, accessibility, visual fidelity, loading/error states |

Uses the **Context7** and **Playwright** MCP servers.

---

## Workflow at a Glance

1. **Start with a vision** — a short `docs/vision.md` describing what you want to build.
2. **Elaborate** — `/requirements` → `/entity-model` → `/use-case-diagram` → `/engineer-requirements`.
3. **Specify** — `/use-case-spec` and `/design-screens`, or let `/deliver-use-case` write whichever is missing.
4. **Build (Next.js)** — `/setup-*` infrastructure once, then `/implement`, `/vitest-test`, `/playwright-test`, `/code-quality`.
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
