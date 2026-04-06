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

Select which use cases to tackle. Claude refines requirements, evolves the entity model, and produces a sprint readiness report.

### 6. Write detailed specs → `/use-case-spec`

For each use case in your sprint, Claude writes a full specification: actors, preconditions, main flow, alternative flows, and business rules.

### 7. Design the screens → `/design-screens`

Claude generates standalone HTML screen designs for each use case, faithful to your wireframe or vision.

### 8. Run a GAP analysis → `/refine-use-cases`

Claude cross-references all specs and designs to find missing, incomplete, or conflicting use cases before you write any code.

---

*At this point, your idea is fully specified. Now you build it (Next.js stack):*

---

### 9. Set up environments → `/setup-env-profiles`

Configures local (Testcontainers), dev (Supabase), and test profiles with database connection strings.

### 10. Create database migrations → `/prisma-migration`

Claude generates Prisma schema models and migrations from your entity model.

### 11. Build middleware → `/build-web-middleware`

Sets up authentication, authorization, security headers, and error tracking — the cross-cutting infrastructure your features depend on.

### 12. Implement use cases → `/implement`

Claude builds Next.js pages, components, API routes, and server actions for each use case.

### 13. Write tests

- `/vitest-test` — Integration tests with real databases via Testcontainers
- `/playwright-test` — End-to-end browser tests covering full user journeys

### 14. Check code quality → `/code-quality`

Runs ESLint and Prettier to enforce consistent formatting and catch issues.

### 15. Or just deliver end-to-end → `/deliver-use-case`

This single command orchestrates steps 6 through 14 automatically for a use case, iterating until all quality gates pass. Use this when you want hands-off delivery.

---

### 16. Review and evaluate

- `/code-review` — Independent code review of your changes
- `/evaluate` — Checks implementation against its spec and design
- `/report-bug` — Creates structured bug reports when something's off

### 17. Deploy → `/aws-dockerize` + `/aws-setup-apprunner`

- `/aws-dockerize` — Generates a production-ready Dockerfile
- `/aws-setup-apprunner` — Creates AWS App Runner infrastructure with CI/CD via GitHub Actions

---

## Tips

- **You don't need to memorize this.** Just describe what you want and Claude will suggest the right skill.
- **Each skill builds on the previous artifacts.** Follow the order above for new projects; jump to any step for existing ones.
- **`/deliver-use-case` is the power move.** Once your specs and designs are ready, it handles implementation, testing, and evaluation in one shot.
- **Technical tasks** (config, infra, cleanup) that aren't user-facing? Use `/technical-task` to spec those separately.
