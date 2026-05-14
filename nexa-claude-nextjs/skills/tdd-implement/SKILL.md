---
name: tdd-implement
description: >
  TDD-mode counterpart to /implement. Drives implementation from failing tests instead of
  freeform building. Reads RED Playwright tests authored by /tdd-playwright-test, discovers
  components needed, then runs an inner Vitest unit-TDD loop (RED → GREEN → REFACTOR) per
  component until the outer E2E suite goes GREEN. Inner loop of double-loop TDD.
---

# TDD Implement (Inner Loop, RED → GREEN → REFACTOR)

## Instructions

Implement $ARGUMENTS by **letting failing tests drive what to write next**, not by building
the feature freeform and adding tests after.

Two assumptions must hold before this skill is invoked:
1. The outer E2E suite for $ARGUMENTS exists and is in **valid RED** (authored by
   `/tdd-playwright-test`).
2. The entity model and Prisma schema already cover every entity the use case references
   (the Entity Gate from `/tdd-deliver-use-case` enforces this upstream).

This skill is the **GREEN driver**. The RED authoring happens in `/tdd-playwright-test`.
The post-GREEN coverage sanity check happens in `/tdd-deliver-use-case`.

## Relationship to `/implement`

All Next.js authoring rules — App Router, server components, Prisma, zod, i18n detection,
DESIGN_RULES.md compliance, DECISIONS.md provenance — come from `/implement`. Read and
follow:

  `${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md`

Treat the **DO NOT** section, the **DoR Check**, the **Project Readiness Gate**, the
**i18n Detection**, and all of the *how to write the code* parts of step-9-style guidance
as binding. **Override only the workflow section**: in TDD mode, implementation is
test-driven instead of spec-driven-then-tested.

## Double-Loop Mental Model

```
┌──────────────────────────────────────────────────────────┐
│  Outer loop: Playwright E2E (RED authored upstream)      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Inner loop: Vitest unit TDD per component         │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │  RED → minimal impl → GREEN → refactor    │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │  Repeat per component until outer E2E goes GREEN   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

The failing outer test names the **next thing missing** — a page, a form, an API route, a
server action. Build it via an inner Vitest TDD cycle. Re-run the outer test. If it
progresses further (fails on a *later* assertion), repeat for the next missing piece. If
it still fails on the same assertion, the inner work was insufficient — diagnose and
continue.

## DO NOT

All "DO NOT" items from `/implement/SKILL.md` apply. In addition:

- **Do not write production code without a failing test first.** Either an outer E2E
  assertion or an inner Vitest unit test must be RED and naming the gap before you write
  the corresponding line of code.
- **Do not write the implementation in one go and then write tests around it.** That is
  `/implement`, not `/tdd-implement`.
- **Do not modify the outer E2E tests** to make them pass. If an E2E test is wrong, stop
  and report — `/tdd-deliver-use-case` will re-spawn the `tdd-playwright-test` subagent.
- **Do not write inner unit tests that mock everything**. Inner tests still hit real
  behaviour where reasonable: Prisma may be mocked at the unit layer (integration tests
  use `/vitest-test`), but component logic, validation, and rendering are exercised
  directly.
- **Do not refactor before GREEN.** RED → GREEN with the minimum code that works, *then*
  refactor with the unit test as a safety net.
- **Do not skip the REFACTOR step silently.** Even a one-line cleanup (rename, extract
  constant, dedupe) counts — but the loop must visit the refactor phase explicitly.

## Inner Loop Discipline (per component)

For every component, hook, action, or route discovered from a failing E2E:

1. **RED** — write the smallest Vitest test that names the next behaviour the E2E needs.
   Run `npx vitest run <path>`. Confirm it fails for the right reason (not a missing
   import — make the file exist as an empty export if needed; fail on the assertion).
2. **GREEN** — write the minimum implementation that makes the unit test pass. Resist
   adding anything the test does not demand.
3. **REFACTOR** — improve clarity, naming, structure. Re-run the unit test. Must stay
   green. If a refactor breaks the test, revert.
4. Move to the next behaviour. Re-run the outer E2E periodically (every 2-3 inner cycles,
   or whenever you suspect the next E2E assertion is reachable).

## Component Discovery from a Failing E2E

The outer test's failure message tells you the next component. Examples:

| Failure | Next component to TDD-build |
|---------|------------------------------|
| `getByLabel('Email')` not found at `/login` | The `/login` page, with a `LoginForm` containing labelled inputs |
| Login submits but dashboard heading never appears | The auth server action + `/dashboard` page |
| `getByRole('button', {name: 'Save'})` clicked but no success message | The save server action + success-state rendering |

Each row is one inner-TDD pass. Build *only* what the failure demands.

## Workflow

1. Read the specification (UC, TT, or BUG) — same as `/implement` step 1.
2. Read the entity model and design — same as `/implement` steps 2-4.
3. Read existing code conventions — same as `/implement` step 5.
4. Run **i18n Detection** — same as `/implement` step 6. All TDD code obeys the project's
   i18n pattern from the first line written.
5. Read the outer E2E tests for $ARGUMENTS under `e2e/` and run them once with
   `npx playwright test` to confirm they are still in valid RED. If they pass, stop —
   either the feature is already implemented (run `/deliver-use-case`, not this skill) or
   the RED phase is broken (re-spawn `/tdd-playwright-test`).
6. From the **first failing E2E assertion**, identify the smallest missing component. Add
   it to a working list of "components to TDD-build."
7. For that component, run the **Inner Loop Discipline** above (RED → GREEN → REFACTOR).
8. Re-run the outer E2E. One of three outcomes:
   - **Same assertion still fails** — inner work was incomplete or wrong. Diagnose and
     continue at step 7 for the same component.
   - **Different assertion fails** — progress. Go back to step 6 with the new failure.
   - **All outer tests pass** — the outer loop is GREEN. Continue to step 9.
9. Run `npx vitest run` (full unit suite) — must pass. Run `npx next build` — must
   succeed.
10. Run `/code-quality`.
11. Record DECISIONS.md entries — same as `/implement` step 13. INFERRED decisions get
    flagged for review.
12. Report back (see "What to Return").

## Iteration Limits

- Up to **3 inner-loop cycles per component** before stopping to reassess (a component
  needing more usually means it was sliced too large — split it).
- Up to **2 attempts** to make a single E2E assertion go green before reporting failure
  to the orchestrator. Repeated failure usually means the spec or the design is
  ambiguous — surface it, do not patch around it.

## What to Return

A structured report with:

1. Ordered list of components TDD-built, with one-line purpose each.
2. Test files created or extended (paths) — both inner unit tests and any integration
   tests if the use case demanded them.
3. Production files created or modified (paths).
4. Final `npx playwright test` output (must show all outer tests passing).
5. Final `npx vitest run` output (must show all unit tests passing).
6. `npx next build` exit status.
7. DECISIONS.md additions, with EXPLICIT vs INFERRED provenance.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Project Readiness Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/PROJECT_READINESS.md`.

## DoR Check

Same as `/implement`:
- For **UC-XXX**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY.md`
- For **TT-XXX**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY_TT.md`
- For **BUG-XXX**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY_BUG.md`

## Tracking

Read and follow `${CLAUDE_PLUGIN_ROOT}/../nexa-claude-core/shared/tracking/TRACKING.md`.

## Resources

- Use the context7 MCP server for Next.js documentation.
