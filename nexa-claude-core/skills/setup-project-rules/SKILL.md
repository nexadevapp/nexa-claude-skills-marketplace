---
name: setup-project-rules
description: >
  Writes Nexa workflow enforcement rules into the target project's CLAUDE.md to prevent
  the AI agent from bypassing the methodology. Ensures the agent never skips the
  requirements-to-spec pipeline, never proposes jumping straight to implementation,
  always checks for duplicate use cases, and always uses the next available use case
  number. Also installs the delivery-trail pre-commit gate, which rejects a commit that
  marks a work item Done without its delivery trail.
  Run once at project inception; re-run if rules need updating.
  Use when the user asks to "set up project rules", "enforce workflow rules",
  "configure CLAUDE.md rules", "add Nexa rules to the project", or mentions
  project rules, workflow enforcement, or CLAUDE.md setup.
---

# Setup Project Rules

## Instructions

Write Nexa workflow enforcement rules into the target project's `CLAUDE.md` file, and
install the delivery-trail pre-commit gate. The rules tell the agent what the methodology
requires; the gate makes one of those requirements impossible to skip.

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

<!-- NEXA_RULES_CONFIGURED v3 -->

These rules are enforced by the Nexa Agentic Engineering methodology. Do not remove or
weaken them.

### Rule 1: Never bypass the workflow

Never work on a new use case without following the official Nexa workflow:
requirements → entity model → use case diagram → wireframe → engineer requirements →
use case spec → design screens → implement → test → evaluate → merge.
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

Never run code-writing skills (`/implement`, `/deliver-use-case`, `/prisma-migration` or
`/db-migration`, `/vitest-test` or `/go-test`, `/playwright-test`) on the `main` or `master` branch, and never in the primary
checkout. Every work item gets its own git worktree on its own branch: `uc/UC-XXX` for a use
case, `tt/TT-XXX` for a technical task, `bug/BUG-XXX` for a bug, `cr/CR-XXX` for a change
request. The worktree is what lets several use cases be delivered at the same time.

If the current branch is `main` or `master` and the user asks to implement something, redirect
them to `/deliver-cluster <cluster>` for a set of use cases, or `/deliver-use-case UC-XXX` for
one. Both create the worktree. Never create the worktree by hand to work around this rule.

### Rule 7: E2E tests must be tagged via the traceability helper

Every Playwright spec under `e2e/**/*.spec.ts` must use the helpers from
`e2e/helpers/traced.ts`:

- UC groups are declared with raw `test.describe('UC-NNN: <title>', uc('UC-NNN'), () => { ... })`.
- Each `test(...)` inside the describe passes `meta('UC-NNN', { scenario, verifies?, fixes? })`
  as its second arg.
- Pure bug regression tests (no UC home) live at module scope as
  `test('<title>', bug('BUG-NNN'), async (...) => ...)`.

`test` and `expect` are imported normally from `@playwright/test`. The reason
the helper exposes `uc()` / `meta()` / `bug()` rather than wrapping
`test.describe(...)` in a custom function is that IDE plugins
(WebStorm/IntelliJ, VSCode Playwright) only walk `test()` and `test.describe()`
calls in the source — they do not enter callbacks of arbitrary helpers.
Keeping `test.describe(...)` literally in source is what makes gutter
run/debug icons appear for each test.

The helper validates at registration time that referenced UC/CR/BUG docs exist
under `docs/use_cases/`, `docs/change_requests/`, and `docs/bugs/` — a typo'd
`CR-002` fails before any browser starts.

Legacy specs predating helper adoption may be listed in `e2e/.tracedignore`
(gitignore-style, one path per line) to opt out of enforcement; new specs must
not be added to that list.

### Rule 8: A work item reaches Done only with its delivery trail

No use case, technical task, bug, or change request reaches its terminal status
(`Done`, or `Fixed` for a bug) without `docs/delivery/<ID>-traceability.md` — the
delivery trail. The trail ties every requirement to the code and the test that proves
it, and records the decisions taken during delivery that the specification does not
state.

The `pre-commit` hook enforces this. When it rejects a commit with:

```
The delivery documents for the task [UC-XXX] are not present
```

spawn the `delivery-trail` agent with that ID, let it write the trail, stage the file,
and commit again. Never use `git commit --no-verify` to get past this gate, and never
write the trail by hand in the main context — the agent reads the diff and the delivery
log that the main context has already compacted away.
~~~

## Marker

The HTML comment `<!-- NEXA_RULES_CONFIGURED v3 -->` inside the `## Nexa Workflow Rules`
section serves as the machine-readable marker that the Nexa Rules Gate checks for.

## The Delivery Trail Gate

The script `${CLAUDE_PLUGIN_ROOT}/skills/setup-project-rules/hooks/delivery-trail.sh` is the
pre-commit gate for Rule 8. It reads the **staged** content of every spec file in the commit,
and rejects the commit when a spec carries a terminal status and its
`docs/delivery/<ID>-traceability.md` is not in the index.

Install it into the target project:

1. Copy the script to `.nexa/hooks/delivery-trail.sh` and `chmod +x` it. Overwrite an
   existing copy — the plugin owns this file.
2. Find the project's hook manager, in this order: `lefthook.yml` / `lefthook.yaml`,
   `.pre-commit-config.yaml`, `git config core.hooksPath`, `.husky/`. None found → plain
   git hooks in `.githooks/`, and set `git config core.hooksPath .githooks`.
3. Wire one line into that manager's `pre-commit` stage, inside a block marked
   `# nexa: delivery-trail` so a re-run replaces it and nothing else:
   ```sh
   bash .nexa/hooks/delivery-trail.sh
   ```
   For lefthook, add a `nexa-delivery-trail` command under `pre-commit.commands`. For
   `pre-commit`, add a `repo: local` hook with `language: system` and
   `entry: bash .nexa/hooks/delivery-trail.sh`, `pass_filenames: false`.
4. Create the hook file executable (`chmod +x`) when you create it, and never touch any
   other hook manager's configuration beyond the marked block.

The gate is committed to the project, so every clone and every parallel worktree runs it.
A fresh clone of a `.githooks/` project still needs `git config core.hooksPath .githooks` —
say so in the summary.

## Workflow

1. Check if the target project has a `CLAUDE.md` file at its root
2. If it exists, read it and check for `## Nexa Workflow Rules`
   - If the section already exists, show the user the existing rules and ask whether to
     replace or skip
3. If `CLAUDE.md` does not exist, create it
4. Write the rules section (above) into `CLAUDE.md`:
   - **If a `## Nexa Workflow Rules` section already exists, replace it in place** — delete
     everything from that heading down to the next heading of the same level (or the end of the
     file) and put the new section there. Never append a second one.
   - If no such section exists, append the new section to the end of the file.
5. Install the delivery trail gate — see "The Delivery Trail Gate" above
6. Verify:
   - The marker `<!-- NEXA_RULES_CONFIGURED v3 -->` is present
   - `## Nexa Workflow Rules` appears **exactly once**
   - The words `sprint branch` and `/sprint-` appear nowhere in the file. A project that
     previously ran an older version of this skill carries the sprint-branch rule; leaving it
     behind means the agent reads a rule that points at deleted skills
   - The gate runs and passes on a clean tree: `bash .nexa/hooks/delivery-trail.sh`
   - The gate actually fires: stage a spec edited to `| **Status** | Done |` whose trail does
     not exist, run the hook, confirm it prints
     `The delivery documents for the task [<ID>] are not present`, then restore the spec.
     A gate nobody has seen fail is a gate nobody knows is wired
7. Inform the user:
   ```
   ## Nexa Workflow Rules — Configured

   The following rules have been written to CLAUDE.md:

   1. Never bypass the workflow (requirements → spec → design → implement)
   2. Never jump straight to implementation, even for simple features
   3. Always check for duplicate use cases before creating new ones
   4. Never ask for a preferred use case number
   5. Always use the next available sequential number
   6. Never write code on main/master — use a work item worktree
   7. E2E tests must be tagged via the traceability helper (uc() on test.describe, meta() on test, bug() for pure regressions)
   8. A work item reaches Done only with its delivery trail

   Rules 1-7 are enforced by the Nexa Rules Gate on every skill invocation.
   Rule 8 is enforced by the pre-commit hook [hook location], which runs
   .nexa/hooks/delivery-trail.sh. When it rejects a commit, run the delivery-trail
   agent for the named ID.
   ```
