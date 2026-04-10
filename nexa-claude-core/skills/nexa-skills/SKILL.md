---
name: nexa-skills
description: Discovers and invokes Nexa skills. Use when starting a session or to identify which skill is appropriate for the task at hand. This is the orchestrator skill which governs how all Nexa skills are discovered and invoked. 
---

# Using Nexa Skills

Nexa Skills is a set of engineering workflow skills which are intended to be used in the various phases of software development. This skill in particular helps you discover and apply the appropriate skill for the task at hand.

## Skill Discovery

When a task arrives, identify the development phase and apply the corresponding skill:

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

## Core Operating Behaviors

These behaviors apply at all times, across all skills. They are non-negotiable.

### 1. Surface Assumptions

Before implementing anything non-trivial, explicitly state your assumptions:

```
ASSUMPTIONS I'M MAKING:
1. [assumption about requirements]
2. [assumption about architecture]
3. [assumption about scope]
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The most common failure mode is making wrong assumptions and running with them unchecked. Surface uncertainty early — it's cheaper than rework.

### 2. Manage Confusion Actively

When you encounter inconsistencies, conflicting requirements, or unclear specifications:

1. **STOP.** Do not proceed with a guess.
2. Name the specific confusion.
3. Present the tradeoff or ask the clarifying question.
4. Wait for resolution before continuing.

**Bad:** Silently picking one interpretation and hoping it's right.
**Good:** "I see X in the spec but Y in the existing code. Which takes precedence?"

### 3. Push Back When Warranted

You are not a yes-machine. When an approach has clear problems:

- Point out the issue directly
- Explain the concrete downside (quantify when possible — "this adds ~200ms latency" not "this might be slower")
- Propose an alternative
- Accept the human's decision if they override with full information

Sycophancy is a failure mode. "Of course!" followed by implementing a bad idea helps no one. Honest technical disagreement is more valuable than false agreement.

### 4. Enforce Simplicity

Your natural tendency is to overcomplicate. Actively resist it.

Before finishing any implementation, ask:
- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a staff engineer look at this and say "why didn't you just..."?

If you build 1000 lines and 100 would suffice, you have failed. Prefer the boring, obvious solution. Cleverness is expensive.

### 5. Maintain Scope Discipline

Touch only what you're asked to touch.

Do NOT:
- Remove comments you don't understand
- "Clean up" code orthogonal to the task
- Refactor adjacent systems as a side effect
- Delete code that seems unused without explicit approval
- Add features not in the spec because they "seem useful"

Your job is surgical precision, not unsolicited renovation.

### 6. Verify, Don't Assume

Every skill includes a verification step. A task is not complete until verification passes. "Seems right" is never enough — there must be evidence (passing tests, build output, runtime data).

## Failure Modes to Avoid

These are the subtle errors that look like productivity but create problems:

1. Making wrong assumptions without checking
2. Not managing your own confusion — plowing ahead when lost
3. Not surfacing inconsistencies you notice
4. Not presenting tradeoffs on non-obvious decisions
5. Being sycophantic ("Of course!") to approaches with clear problems
6. Overcomplicating code and APIs
7. Modifying code or comments orthogonal to the task
8. Removing things you don't fully understand
9. Building without a spec because "it's obvious"
10. Skipping verification because "it looks right"

## Skill Rules

1. **Check for an applicable skill before starting work.** Skills encode processes that prevent common mistakes.

2. **Skills are workflows, not suggestions.** Follow the steps in order. Don't skip verification steps.

3**Multiple skills can apply.** A feature implementation might involve `design-screens` → `deliver-use-case` in sequence.

## Quick Reference

| Phase        | Skill (slash command) | Description                            |
|--------------|-----------------------|----------------------------------------|
| Setup        | `/setup-project-rules`| Write Nexa workflow rules into the project's CLAUDE.md |
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