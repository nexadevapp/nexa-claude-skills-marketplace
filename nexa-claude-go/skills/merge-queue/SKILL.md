---
name: merge-queue
description: >
  Lands every branch that is ready, one at a time, when several agents have been working in
  parallel worktrees. Discovers the finished worktrees and the open pull requests, orders them
  so a dependency lands before what depends on it, and sends each through /merge-use-case under
  the merge lock. Use when the user asks to "merge the queue", "land everything that is ready",
  "merge the open PRs", "drain the merge queue", or when several use cases or clusters were
  delivered by different agents at the same time.
---

# Merge Queue

## Instructions

Land every branch that is ready — the whole queue if $ARGUMENTS is empty, otherwise only the
work item IDs it names.

`/deliver-cluster` owns the merge queue for the cluster it is delivering. This skill is for
everything that skill cannot see: several agents delivering different use cases or different
clusters at the same time, a branch left behind by a run that stopped, or a set of pull
requests opened by `--review` runs that now have to land.

The queue is a discovery-and-ordering skill. It never merges into `main` itself and it does not
own a gate — every item goes through `/merge-use-case`, which rebases, runs the full unfiltered
regression suite, merges, closes the issue, and removes the worktree. The only merge the queue
performs is landing an already-gated pull request on GitHub, which `/merge-use-case --after-review`
then books.

## When to use

- Several agents delivered work in parallel worktrees and their branches are all waiting.
- A `--review` run opened pull requests and they are approved and ready to land.
- A previous merge run stopped part-way and left branches behind.

Use `/merge-use-case <ID>` instead when exactly one branch is waiting.

## Prerequisites

- `gh` is authenticated — the queue reads pull requests and closes issues through it
- At least one worktree or open pull request exists for a work item branch

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## No Worktree Gate

This skill runs in the **primary checkout on `main`**. It reads worktrees and merges from the
primary checkout; it never runs inside one. It is listed in the Exceptions section of
`${CLAUDE_PLUGIN_ROOT}/shared/readiness/WORKTREE_GATE.md`.

## DO NOT

- Merge into `main` yourself — every item's gate runs through `/merge-use-case`
- Run two `/merge-use-case` invocations at the same time, even for unrelated items
- Hold the merge lock across the whole queue — each item takes and releases its own, so an
  agent that finishes mid-run can still land its branch between two items
- Land an item before an item it depends on
- Retry an item whose gate went red — it leaves the queue for this run
- Remove a worktree whose branch did not merge

## Process

### Step 1: Discover the candidates

Two sources, because a branch can be waiting in either:

```bash
git fetch origin main
git worktree list --porcelain
gh pr list --base main --state open --json number,headRefName,title,reviewDecision
```

Take every worktree on a `uc/UC-*`, `tt/TT-*`, `bug/BUG-*`, or `cr/CR-*` branch, plus every
open pull request whose head branch matches one of those prefixes. The same item can appear in
both — that is one candidate, not two.

If $ARGUMENTS names IDs, keep only those and report any it names that no source produced.

### Step 2: Classify each candidate

| State | How it is recognised | What happens |
|-------|---------------------|--------------|
| **Ready** | No pull request, and its work item has evidence its pipeline ran: `docs/delivery/UC-XXX-iterations.md` in the worktree for a use case, a commit on the branch for the other types | Queue it for `/merge-use-case <ID>` |
| **Ready (reviewed)** | A pull request whose `reviewDecision` is `APPROVED` | Land the pull request itself with `gh pr merge <number> --rebase --delete-branch=false`, then queue it for `/merge-use-case <ID> --after-review` |
| **Awaiting review** | A pull request that is open and not approved | Skip. Report the URL. A human has to look at it |
| **Unproven** | A worktree on a work item branch with no delivery evidence and no commits ahead of `main` | Skip. Report it — the pipeline never ran, or it ran and produced nothing |
| **Blocked** | Its **Depends On** row names an item that is neither `Status: Done` on `main` nor ahead of it in this same queue | Keep it queued behind that item. If the dependency is not in the queue at all, skip and report what it waits on |

Read **Depends On** from `docs/use_cases/UC-XXX.md`, falling back to
`docs/engineering/cluster-N-analysis.md`, exactly as `/deliver-cluster` Step 3 does. A work
item type other than a use case has no dependency row — treat it as unblocked.

### Step 3: Order the queue

Sort so a dependency always lands before what depends on it. Among items with no dependency
between them, order by the age of the branch head — the oldest merges first, because it has
been diverging from `main` the longest and its rebase is the one most likely to conflict.

Detect cycles. A cycle in the queue cannot be landed in any order:

```
MERGE QUEUE BLOCKED — the dependency graph has a cycle

UC-004 -> UC-007 -> UC-004

Nothing was merged. Run /engineer-requirements to split or merge the use cases.
```

Print the plan before merging anything:

```
Merge queue — <N> ready, <M> skipped

Order:
  1. UC-001  worktree ../app-UC-001        (no dependencies)
  2. UC-003  worktree ../app-UC-003        (after UC-001)
  3. TT-010  PR #42, approved            (gh pr merge, then --after-review)

Skipped:
  UC-007  awaiting review — <pull request URL>
  UC-009  unproven — worktree exists, pipeline never ran
```

### Step 4: Merge, one at a time

For each item in order, invoke `/merge-use-case <ID>` — the plain form for a worktree item.

An approved pull request takes the other route. Merge the pull request on GitHub first, then run
the bookkeeping form:

```bash
gh pr merge <number> --rebase --delete-branch=false
```

then `/merge-use-case <ID> --after-review`. Do not send an approved pull request through the
plain form: it rebases the branch locally and fast-forwards `main` without pushing the branch,
so the commits GitHub sees on the pull request are never the commits that land. The pull request
stays open, its issue stays open, and its worktree leaks.

**Wait for it to finish before starting the next.** Each invocation takes the merge lock, so a
second concurrent one would stop on the lock rather than corrupt anything — but it would also
report a failure that is not real. Serial invocation keeps the report honest.

Between items, re-read the state of what is left. A merge sets its work item to `Status: Done`
on `main`, which can unblock a later item that Step 2 classified as **Blocked**; bring it into
the queue when it becomes ready.

Three outcomes per item:

| Outcome | What the queue does |
|---------|--------------------|
| Merged | Continue to the next item |
| Gate red | Leave the worktree in place, drop the item from this run, continue with the rest |
| Merge lock held by another agent | Not a failure. Leave the item in the queue, continue with the next one, and try it again after the current pass. Report any item still locked out when the run ends |

A red gate on one item never stops the others. An item that depends on the red one stays
blocked and is reported as such.

### Step 5: Report

```
## Merge Queue — <n> of <total> landed

| Item   | Route             | Result   |
|--------|-------------------|----------|
| UC-001 | worktree          | merged   |
| UC-003 | worktree          | gate red |
| TT-010 | PR #42 (approved) | merged   |

Landed:    <IDs, in merge order>
Gate red:  <ID — which gate failed, and the worktree that still holds the work>
Locked out: <ID — another agent held the merge lock for the whole run>
Skipped:   <ID — awaiting review / unproven / blocked on X>

No red branch was retried. Fix them in their worktrees, then run /merge-queue again — it also
picks up whatever was locked out.
```

Name the worktree path for every item that did not land, so the work can be picked up. Never
remove a worktree whose branch did not merge — it holds the only copy of that work.

If any item merged, regenerate the project overview with `/dashboard` and commit it, the same
way `/deliver-cluster` Step 8 does.

## Verification

1. At no point were two `/merge-use-case` runs in flight.
2. `<git-common-dir>/nexa-merge.lock` does not exist when the run ends.
3. `git log --graph --oneline main | head -30` shows no merge commit.
4. Every landed item's worktree is gone from `git worktree list`; every red item's worktree is
   still there.
5. No item landed before an item it depends on — `git log --oneline main` has them in
   dependency order.
6. Every open pull request that was not approved is still open and untouched.
7. Every approved pull request that landed shows as merged on GitHub, with its issue closed and
   its worktree removed — the `--after-review` bookkeeping ran.
