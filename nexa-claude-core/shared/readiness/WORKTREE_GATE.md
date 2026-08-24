# Worktree Gate

## Instructions

Before executing this skill, verify that the current checkout is a work item worktree.
Code-writing skills (implementation, migration, testing) must never run on `main` or `master`,
and never in the primary checkout.

Every work item gets its own git worktree on its own branch. Isolation is what lets several
use cases run at the same time: each pipeline owns its working tree, so `git add -A` and
`git reset --hard` stay safe.

## How to Check

1. Get the current branch name:
   ```bash
   git branch --show-current
   ```
   The name must match one of `uc/UC-*`, `tt/TT-*`, `bug/BUG-*`, or `cr/CR-*`.

2. Verify this is a linked worktree, not the primary checkout:
   ```bash
   test "$(git rev-parse --git-dir)" != "$(git rev-parse --git-common-dir)"
   ```
   The command exits 0 in a linked worktree and 1 in the primary checkout.

Both checks must pass.

## On Pass

The current checkout is a work item worktree. Proceed with the skill.

## On Failure

**Stop immediately** and report:

```
WORKTREE GATE — FAILED

Current branch: <branch-name>
Current checkout: <primary | linked worktree>
Expected: a linked worktree on uc/UC-*, tt/TT-*, bug/BUG-*, or cr/CR-*

Code-writing skills must run in a work item worktree, not in the primary checkout.

Use case:      /deliver-cluster <cluster>  or  /deliver-use-case UC-XXX
Bug:           /resolve-bug BUG-XXX
Technical task
or change request:
               git worktree add ../<repo>-TT-XXX -b tt/TT-XXX origin/main
               then run the skill inside that directory
```

Do not proceed with the skill. For a use case or a bug, do not offer to create the worktree
manually — the user must go through the delivery skill, which performs the readiness checks
and creates the worktree from the correct base. A technical task and a change request have no
orchestrating skill, so the command above is the supported route for them.

## Exceptions

This gate does **not** apply to:
- **Setup skills** (`/setup-*`) — these establish infrastructure and run on `main`
- **Elaboration skills** (`/requirements`, `/entity-model`, `/use-case-diagram`, `/engineer-requirements`, `/generate-wireframe`) — these produce documentation, not code
- **Construction planning skills** (`/use-case-spec`, `/design-screens`, `/technical-task`) — these produce specifications and designs, not code
- **Verification skills** (`/code-review`, `/evaluate`, `/report-bug`) — these are read-only reviews
- **Orchestration skills** (`/deliver-cluster`, `/merge-use-case`, `/merge-queue`,
  `/dashboard`) — these create, merge, and report on worktrees, so they run in the primary
  checkout
- **`/onboard-existing-app`** — reverse-engineers documentation and audits infrastructure for
  an existing codebase; it doesn't modify application code, so it runs on `main` like the
  other documentation-producing skills above
