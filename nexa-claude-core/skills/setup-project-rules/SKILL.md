---
name: setup-project-rules
description: >
  Writes Nexa workflow enforcement rules into the target project's CLAUDE.md to prevent
  the AI agent from bypassing the methodology. Ensures the agent never skips the
  requirements-to-spec pipeline, never proposes jumping straight to implementation,
  always checks for duplicate use cases, and always uses the next available use case
  number. Run once at project inception; re-run if rules need updating.
  Use when the user asks to "set up project rules", "enforce workflow rules",
  "configure CLAUDE.md rules", "add Nexa rules to the project", or mentions
  project rules, workflow enforcement, or CLAUDE.md setup.
---

# Setup Project Rules

## Instructions

Write Nexa workflow enforcement rules into the target project's `CLAUDE.md` file. These
rules ensure that the AI agent follows the Nexa Agentic Engineering methodology and never
bypasses the structured workflow.

If `CLAUDE.md` does not exist, create it with the rules section. If it already exists,
append the rules section — but first check whether a `## Nexa Workflow Rules` section
already exists. If it does, ask the user whether to overwrite or skip.

## DO NOT

- Overwrite an existing `## Nexa Workflow Rules` section without user confirmation
- Remove or modify any other content already in the project's `CLAUDE.md`
- Write rules that contradict the Nexa methodology

## Rules to Write

Append the following section to the project's `CLAUDE.md`:

~~~markdown
## Nexa Workflow Rules

<!-- NEXA_RULES_CONFIGURED -->

These rules are enforced by the Nexa Agentic Engineering methodology. Do not remove or
weaken them.

### Rule 1: Never bypass the workflow

Never work on a new use case without following the official Nexa workflow:
requirements → entity model → use case diagram → wireframe → engineer requirements →
sprint prepare → use case spec → design screens → implement → test → evaluate.
Every use case must pass through this pipeline. There are no shortcuts.

### Rule 2: Never jump straight to implementation

Never propose going straight to implementation, even for seemingly simple pages or features.
Every feature, no matter how small, must have a use case specification and design artifact
before implementation begins. If a user asks to "just build it", redirect them to
`/use-case-spec` and `/design-screens` first.

### Rule 3: Always check for duplicate use cases

Before creating a new use case, always check `docs/use_cases.puml` and `docs/use_cases/`
for existing use cases that may already cover the requested functionality. Report any
potential duplicates to the user before proceeding.

### Rule 4: Never ask for a preferred use case number

Never ask the user which use case number to assign. Use case numbers are not a choice —
they are sequential.

### Rule 5: Always use the next available number

When creating a new use case, always read `docs/use_cases.puml` to find the highest
existing UC-XXX number and use the next sequential number. The same applies to TT-XXX
(technical tasks) and BUG-XXX (bug reports). Never reuse a number, never skip numbers,
never ask the user to choose.

### Rule 6: Never write code on main/master

Never run code-writing skills (`/implement`, `/deliver-use-case`, `/sprint-deliver`,
`/prisma-migration`, `/vitest-test`, `/playwright-test`) on the `main` or `master` branch.
All code changes must happen on a sprint branch (`sprint-*`) created by `/sprint-kickoff`.
If the current branch is `main` or `master` and the user asks to implement something,
redirect them to `/sprint-kickoff` first.

### Rule 7: E2E tests must be tagged via the traceability helper

Every Playwright `test(...)` call in `e2e/**/*.spec.ts` must pass a `meta(...)`
or `bug(...)` call (from `e2e/helpers/traced.ts`) as its second argument:

- Tests grouped under a use case live inside `useCase('UC-NNN', '...', () => { ... })`
  and use `meta({ scenario, verifies?, fixes? })` as their second arg.
- Pure bug regression tests (no UC home) live at module scope and use
  `bug('BUG-NNN')` as their second arg.
- `test.describe(...)` is not used directly — `useCase()` is the canonical
  group wrapper.

`test` and `expect` are imported normally from `@playwright/test`. The reason
`useCase()` takes a no-arg callback (not `(test) => {...}`) is to keep `test`
resolving to the imported symbol so IDE plugins (WebStorm/IntelliJ, VSCode
Playwright) can statically discover each test and run it from the gutter.

The helper validates at registration time that referenced UC/CR/BUG docs exist
under `docs/use_cases/`, `docs/change_requests/`, and `docs/bugs/` — a typo'd
`CR-002` fails before any browser starts.

Legacy specs predating helper adoption may be listed in `e2e/.tracedignore`
(gitignore-style, one path per line) to opt out of enforcement; new specs must
not be added to that list.
~~~

## Marker

The HTML comment `<!-- NEXA_RULES_CONFIGURED -->` inside the `## Nexa Workflow Rules`
section serves as the machine-readable marker that the Nexa Rules Gate checks for.

## Workflow

1. Check if the target project has a `CLAUDE.md` file at its root
2. If it exists, read it and check for `## Nexa Workflow Rules`
   - If the section already exists, show the user the existing rules and ask whether to
     overwrite or skip
3. If `CLAUDE.md` does not exist, create it
4. Append the rules section (above) to `CLAUDE.md`
5. Verify the marker `<!-- NEXA_RULES_CONFIGURED -->` is present in the written file
6. Inform the user:
   ```
   ## Nexa Workflow Rules — Configured

   The following rules have been written to CLAUDE.md:

   1. Never bypass the workflow (requirements → spec → design → implement)
   2. Never jump straight to implementation, even for simple features
   3. Always check for duplicate use cases before creating new ones
   4. Never ask for a preferred use case number
   5. Always use the next available sequential number
   6. Never write code on main/master — use a sprint branch
   7. E2E tests must be tagged via the traceability helper (meta({...}) / bug() inside useCase())

   These rules are enforced by the Nexa Rules Gate on every skill invocation.
   ```
