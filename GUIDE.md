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

### 15. Running unattended

Claude Code's built-in `/goal` and `/loop` commands can drive the delivery skills without you
sitting there. `/goal <condition>` keeps a turn going until the condition holds. `/loop <prompt>`
re-runs a prompt as a fresh turn, over and over.

Neither is referenced from any skill — they are an operator overlay you apply from the outside.

**Only use them on skills that are graded by something other than Claude's own prose.**
`/deliver-use-case` qualifies: `npx next build`, `npx vitest run`, and `npx playwright test`
exit codes are external verdicts, and the coverage check runs in an isolated `evaluate` agent.
`/sprint-deliver` qualifies: its progress is a file on disk.

**Never on the elaboration skills** — `/requirements`, `/engineer-requirements`,
`/sprint-prepare`, `/design-screens`, `/use-case-spec`. Their output *is* the artifact the
condition would be judged against, so you would be asking a model to grade text it just wrote.
The cheapest way to satisfy "the requirements catalog is complete" is to write more
requirements, not better ones.

Write conditions as facts you could check yourself. "`npx playwright test` exits 0 with 0
skipped" works; "the feature works well" does not.

#### Deliver a whole sprint unattended

`/sprint-deliver` delivers one use case and stops. Looping it delivers the rest — and because
each firing is a fresh turn, use case 6 gets the same clean context as use case 1. Running a
whole sprint inside one conversation would exhaust the window somewhere around the third.

First clear any pre-delivery actions (e.g. `/prisma-migration`) — the skill blocks on those and
the loop has no way past them. Then:

```
/loop Run /sprint-deliver. Readiness-report warnings are already accepted — proceed
without asking. If it reports SPRINT COMPLETE, stop the loop. If any use case reports
DELIVERY FAILED, stop the loop and do not roll back — leave the working tree for me.
```

That is a prompt, not a bare `/loop /sprint-deliver`, because the pipeline has gates that expect
a human:

| Gate | Handled by |
|------|-----------|
| Readiness-report warnings — "proceed, or address first?" | Pre-answered in the prompt |
| Pre-delivery actions — confirm they are done | Cleared before the loop starts |
| Delivery failure — "roll back all changes? (Y/n)" → `git reset --hard` | **Hard stop.** The prompt forbids rolling back |
| A closed GitHub issue already exists — reopen or create new? | Only on rework; answer it yourself |

The rollback prompt is the one that matters. Left unaddressed, an unattended run can answer it
on your behalf and hard-reset the working tree.

#### Push one use case to green

`/deliver-use-case` gives its fix loops two attempts each. A goal lets it keep going:

```
/goal npx playwright test exits 0 with 0 skipped and the evaluate agent returns PASS for UC-007
/deliver-use-case UC-007
/goal clear
```

Watch this one. The two-attempt caps are there to stop Claude thrashing — every iteration
rewrites code — and the goal removes that ceiling. And `/goal clear` is not optional: the hook
outlives the task and will keep grading everything you do next.

#### Watch CI after `/sprint-complete`

CI runs outside the session, so this is the one place a wall-clock interval earns its keep:

```
/loop 10m Check gh pr checks on the sprint PR. If a check failed, diagnose and push a fix
to the sprint branch. If all checks pass, stop the loop. Do not merge.
```

Keep "do not merge" in there. Merging the sprint PR is a human decision after formal code
review — that is the release.

---

## Tips

- **You don't need to memorize this.** Just describe what you want and Claude will suggest the right skill.
- **Each skill builds on the previous artifacts.** Follow the order above for new projects; jump to any step for existing ones.
- **`/deliver-use-case` is the power move.** Once your specs and designs are ready, it handles implementation, testing, and evaluation in one shot.
- **Technical tasks** (config, infra, cleanup) that aren't user-facing? Use `/technical-task` to spec those separately.
