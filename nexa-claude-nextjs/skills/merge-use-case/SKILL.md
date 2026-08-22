---
name: merge-use-case
description: >
  Merges a finished work item branch into main through a serial merge gate. Rebases the
  worktree branch onto main, resolves any conflict, runs the full unfiltered regression suite,
  fast-forwards main, closes the GitHub issue, and removes the worktree. Works for a use case,
  a technical task, a bug, or a change request. Use when the user asks to "merge the use case",
  "land the branch", "run the merge gate", "merge UC-XXX", or mentions the merge queue.
  Invoked by /deliver-cluster after every pipeline that finishes green.
---

# Merge Use Case

## Instructions

Land the branch for $ARGUMENTS on `main`, or stop and report why it cannot land.

The branch prefix follows the work item type: `uc/` for `UC-XXX`, `tt/` for `TT-XXX`, `bug/`
for `BUG-XXX`, `cr/` for `CR-XXX`. Every step below writes `uc/$ARGUMENTS` for readability;
use the prefix that matches the ID.

**Flags**

| Flag | Effect |
|------|--------|
| *(none)* | Rebase, run the gate, and merge with `--ff-only`. No pull request |
| `--review` | Rebase, run the gate, push, open a pull request, and stop. Nothing is merged |
| `--after-review` | Run after a `--review` pull request has landed: skip to Step 4b for the bookkeeping the merge path would have done |

Use cases are implemented in parallel and merged in series. This skill is the serial part:
exactly one invocation may run at a time. It rebases rather than merges, so `main` keeps the
linear history that `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md` requires.

## When to use

- After `/deliver-use-case` finishes green and the branch must land on `main`.
- When a branch that failed the merge gate has been fixed and needs the gate run again.

`/deliver-cluster` calls this skill itself after every pipeline it starts, so invoke it
directly only for a use case delivered on its own.

## Prerequisites

- The branch for $ARGUMENTS exists and its worktree holds a green pipeline run
- For a use case, `docs/delivery/$ARGUMENTS-iterations.md` exists — the pipeline ran

If a use case pipeline has not run, stop and tell the user to run
`/deliver-use-case $ARGUMENTS` first.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## No Worktree Gate

This skill runs in the **primary checkout**. It reaches into the use case worktree to rebase
it, then merges from the primary checkout. It is listed in the Exceptions section of
`${CLAUDE_PLUGIN_ROOT}/shared/readiness/WORKTREE_GATE.md`.

## DO NOT

- Run while another `/merge-use-case` is in progress
- Merge when the gate is red — there is no "merge anyway" option
- Create a merge commit — `main` keeps a linear history
- Filter the regression suite with `--grep`, `--grep-invert`, or a `--project` subset
- Force-push `main`
- Sleep or wait between test retries — diagnose and fix immediately, then re-run

## Process

### Step 1: Rebase onto main

```bash
git fetch origin main
git -C <the UC worktree> rebase origin/main
```

If the rebase is clean, go to Step 3.

### Step 2: Resolve the conflict

Read the work item's specification first, so the resolution follows it rather than a guess
about the code:

| ID | Specification |
|----|---------------|
| `UC-XXX` | `docs/use_cases/UC-XXX.md` |
| `TT-XXX` | `docs/technical_tasks/TT-XXX.md` |
| `BUG-XXX` | `docs/bugs/BUG-XXX.md` |
| `CR-XXX` | `docs/change_requests/CR-XXX.md` |

For each conflicting file:

| Conflict | How to resolve |
|----------|----------------|
| `messages/*.json` and other key-value files | Keep both sides. Two use cases adding different keys is an addition, not a disagreement |
| A shared component both sides changed | Keep both changes when they touch different parts. When they touch the same behaviour, the specification of the *later* use case wins, because it was written against the merged system |
| A route table or registry | Keep both entries and keep the file's existing order |
| The same business rule implemented twice | Keep one. Report it — duplicated logic in two use cases usually means a missing shared module |

**A clean textual merge is not a correct merge.** Two use cases can each add a valid block to
the same file and produce a broken result. Step 3 is what proves the resolution, so never skip
it after resolving a conflict.

If a conflict cannot be resolved from the specification, stop and report it with both sides
quoted. Do not guess.

```bash
git -C <the UC worktree> add <resolved files>
git -C <the UC worktree> rebase --continue
```

> `ponytail:` conflicts are resolved in this context, with no separate merger agent. Promote
> this step to an isolated agent only if inline resolution proves unreliable in practice.

### Step 3: Run the merge gate

The gate runs in the use case worktree, against the rebased tree. This is the check that a
sprint used to run once per batch; it now runs once per merge, which is what makes a batch
unnecessary.

1. `npx next build` — must succeed.
2. `npx vitest run` — must pass.
3. Check whether E2E tests exist (`e2e/**/*.spec.ts`). If none exist, note "No E2E tests found
   — regression gate skipped" and go to Step 4.
4. Verify Docker is running, which Testcontainers needs:
   ```bash
   docker info > /dev/null 2>&1
   ```
   If it is not, ask the user to start Docker or Colima, then re-check.
5. Run the full suite:
   ```bash
   npx playwright test
   ```
   **No filters.** Must show `0 failed`, `0 skipped`, and exit code 0.

**On failure**, classify each failing test:

- **Regression** — this use case broke an existing test
- **Flaky** — the test passes on a re-run with no code change
- **Pre-existing** — the test already failed on `main` before this branch

Report:

```
MERGE GATE — FAILED for $ARGUMENTS

| Test | Classification | Details |
|------|---------------|---------|

The branch stays in its worktree at <path>. Nothing was merged.

Fix the failures there, then run /merge-use-case $ARGUMENTS again.
```

Allow up to 3 re-runs for tests classified as flaky. A regression is never waived — fix it
and re-run the gate. If the failure is pre-existing on `main`, report it as a separate bug
with `/report-bug` and stop; a broken `main` is not this use case's problem to hide.

### Step 4: Land the branch

**Default — merge without review:**

```bash
git checkout main
git merge --ff-only uc/$ARGUMENTS
git push origin main
```

The rebase in Step 1 guarantees the fast-forward. If `--ff-only` is rejected, `main` moved
while the gate ran — return to Step 1 and repeat.

**With `--review` — stop at the pull request:**

```bash
git push -u origin uc/$ARGUMENTS
gh pr create --base main --head uc/$ARGUMENTS \
  --title "$ARGUMENTS: <use case name>" \
  --body "<the delivery summary, plus a link to docs/use_cases/$ARGUMENTS.md>"
```

Then stop. Do not merge, and do not remove the worktree — the reviewer may ask for changes.

**Say what is now blocked.** The pull request path does not set the specification to `Done` on
`main`, so every use case that depends on this one stays blocked until the pull request lands.
Report:

```
$ARGUMENTS is awaiting review: <pull request URL>

Nothing was merged. Worktree kept at <path>.
Blocked until this lands: <dependent work item IDs, or "none">

When the pull request is merged, run:
  /merge-use-case $ARGUMENTS --after-review
```

### Step 4b: After the review lands (`--after-review`)

Run this once the pull request has been merged on GitHub. It performs only the bookkeeping the
merge path would have done:

```bash
git checkout main && git pull --ff-only origin main
```

Confirm the branch's commits are on `main` (`git branch --merged main` lists it). Then continue
at Step 5 — close the issue, remove the worktree, delete the branch, and report. Without this
step the worktree and the branch leak and every dependent use case stays blocked forever.

### Step 5: Close the tracking issue

Follow the **After Implementation** steps in
`${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`. That file owns the whole issue lifecycle;
do not repeat its steps here.

### Step 6: Remove the worktree

```bash
git worktree remove ../$(basename "$PWD")-$ARGUMENTS
git branch -d uc/$ARGUMENTS
```

`git branch -d` refuses to delete an unmerged branch. That is the safety check — if it refuses,
the merge did not happen and something above went wrong. Never force it with `-D`.

`git worktree remove` refuses when the directory holds modified or untracked files. The gate
just ran a build and three test suites in there, so `playwright-report/`, `test-results/`, and
`reports/mutation/` are the usual cause. Confirm the branch is merged (`git branch --merged main`
lists it), then repeat with `--force`, and add those paths to the project's `.gitignore` so it
does not recur. Do not skip this step — a leaked worktree keeps its branch alive and makes
Verification 2 and 3 fail on a merge that actually succeeded.

### Step 7: Report

```
## Merged: $ARGUMENTS — <use case name>

| Gate                | Result |
|---------------------|--------|
| Rebase onto main    | clean / N conflicts resolved |
| Build               | pass   |
| Unit tests          | pass   |
| E2E regression      | N passed, 0 failed, 0 skipped |

Merged to main as <short SHA>. Worktree removed.
```

## Verification

1. `git log --graph --oneline main | head` shows no merge commit.
2. `git worktree list` no longer lists the use case worktree.
3. `git branch --list "*/$ARGUMENTS"` returns nothing.
4. The GitHub issue for $ARGUMENTS is closed.
5. The work item's specification has the status its type ends at — `Done` for a use case, a
   technical task, and a change request; `Fixed` for a bug. See
   `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`, which owns the status transitions.
