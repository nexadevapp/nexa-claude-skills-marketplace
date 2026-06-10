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

### 5. Prepare a sprint → `/sprint-prepare`

Select which use cases to tackle. Claude refines requirements, evolves the entity model, generates use case specifications and screen designs, and produces a sprint readiness report.

---

*At this point, your sprint is fully specified. Now you build it (Next.js stack):*

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

### 14. Deliver the sprint

- `/sprint-kickoff` — Create the sprint branch and start delivery
- `/sprint-deliver` — Deliver use cases in priority order from the readiness report
- `/sprint-complete` — Validate, close issues, archive, and open a PR to main

---

## Tips

- **You don't need to memorize this.** Just describe what you want and Claude will suggest the right skill.
- **Each skill builds on the previous artifacts.** Follow the order above for new projects; jump to any step for existing ones.
- **`/deliver-use-case` is the power move.** Once your specs and designs are ready, it handles implementation, testing, and evaluation in one shot.
- **Technical tasks** (config, infra, cleanup) that aren't user-facing? Use `/technical-task` to spec those separately.
