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

   These rules are enforced by the Nexa Rules Gate on every skill invocation.
   ```
