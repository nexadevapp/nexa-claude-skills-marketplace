# Nexa Agentic Engineering — Quick Start Guide

This is a set of Claude Code skills that take you from an idea to a deployed web application. You work by talking to Claude and invoking slash commands at each stage.

---

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- Node.js 18+
- A new or existing project directory

---

## Step-by-Step Workflow

### 1. Start with your idea

Write a short vision document (a paragraph or a page) describing what you want to build. This is your input — plain text is fine.

### 2. Generate requirements → `/requirements`

Tell Claude your vision. It produces a structured requirements catalog: user stories, non-functional requirements, and constraints.

### 3. Create the entity model → `/entity-model`

Claude designs your data model with a Mermaid ER diagram — entities, relationships, attributes, and validation rules.

### 4. Draw the use case diagram → `/use-case-diagram`

Claude generates a PlantUML diagram mapping actors to use cases, giving you a birds-eye view of system behavior.

### 5. Elaborate the use cases → `/engineer-requirements`

Claude groups the use cases into thematic clusters and works through them one at a time: it refines the requirements, evolves the entity model, audits external dependencies into technical tasks, and records for every use case which other use cases it depends on and whether it has a screen.

That dependency data is what makes the next part parallel.

---

*At this point, your use cases are elaborated. Now you build them (Next.js stack):*

---

### 6. Set up environments → `/setup-env-profiles`

Configures local (Testcontainers), dev (Supabase), and test profiles with database connection strings.

### 7. Create database migrations → `/prisma-migration`

Claude generates Prisma schema models and migrations from your entity model.

### 8. Build middleware → `/setup-web-middleware`

Sets up authentication, authorization, security headers, and error tracking — the cross-cutting infrastructure your features depend on.

### 9. Implement use cases → `/implement`

Claude builds Next.js pages, components, API routes, and server actions for each use case.

### 10. Write tests

- `/vitest-test` — Integration tests with real databases via Testcontainers
- `/playwright-test` — End-to-end browser tests covering full user journeys

### 11. Check code quality → `/code-quality`

Runs oxlint (lint + cyclomatic complexity) and oxfmt (formatting) via the Oxc toolchain.

### 12. Or just deliver end-to-end → `/deliver-use-case`

This single command orchestrates the full pipeline automatically for a use case — implementation, testing, and evaluation — iterating until all quality gates pass. Use this when you want hands-off delivery.

---

### 13. Review and evaluate

- `/code-review` — Independent code review of your changes
- `/evaluate` — Checks implementation against its spec and design
- `/audit` — Deep quality audit (DoD, i18n, accessibility, visual fidelity)
- `/report-bug` — Creates structured bug reports when something's off

### 14. Deliver a whole cluster → `/deliver-cluster`

`/deliver-cluster <name>` reads the dependency graph and delivers everything that is not blocked **at the same time**, one git worktree per use case. As each pipeline goes green, the branch enters a serial merge queue: `/merge-use-case` rebases it onto `main`, runs the full unfiltered regression suite, and fast-forwards. After each merge the ready set is recomputed, so finishing one use case can unblock the next.

Human review is optional. Add `--review` to stop at a pull request instead of merging.

When several agents have been working at once — two clusters, a bug fix on the side, pull requests that are now approved — `/merge-queue` lands everything that is ready, in dependency order, one at a time. A machine-wide merge lock keeps two merges from ever running together.

### 15. See where the project stands → `/dashboard`

Regenerates `docs/overview/` — every cluster with its delivered count, each use case linked to its specification, its design, and its acceptance tests, and the technical tasks split between the cluster they support and the Umbrella section for cross-cutting ones.

---

## Tips

- **You don't need to memorize this.** Just describe what you want and Claude will suggest the right skill.
- **Each skill builds on the previous artifacts.** Follow the order above for new projects; jump to any step for existing ones.
- **`/deliver-cluster` is the power move.** It delivers several use cases at once and merges them for you. Use `/deliver-use-case` when you want exactly one.
- **Technical tasks** (config, infra, cleanup) that aren't user-facing? Use `/technical-task` to spec those separately.
