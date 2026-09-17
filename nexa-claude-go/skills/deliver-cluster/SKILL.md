---
name: deliver-cluster
description: >
  Delivers a cluster of use cases in parallel. Reads the dependency graph, works out which
  use cases can run at the same time, creates one git worktree per use case, runs
  /deliver-use-case in each, and feeds every finished branch to /merge-use-case one at a time.
  Repeats until the cluster is delivered. Use when the user asks to "deliver a cluster",
  "deliver the use cases", "start delivery", "build the next cluster", or mentions parallel
  delivery, the delivery queue, or delivering several use cases at once.
---

# Deliver Cluster

## Instructions

Deliver every use case in $ARGUMENTS, running as many in parallel as the dependency graph
allows, and merging them into `main` one at a time.

This skill replaces the sprint. A sprint batched work by time; this batches by dependency,
which is the only constraint that is real.

## When to use

- After `/engineer-requirements` has elaborated a cluster and every use case in it has a
  **Depends On** row.
- When you want several use cases delivered without a fixed batch boundary.

Use `/deliver-use-case UC-XXX` instead when you want exactly one use case.

## Prerequisites

- `docs/engineering/progress.md` — the cluster manifest from `/engineer-requirements`
- `docs/requirements.md`, `docs/entity_model.md`, `docs/use_cases.puml`

If any is missing, stop and tell the user to run `/engineer-requirements` first.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## No Worktree Gate

This skill runs in the **primary checkout on `main`**. It creates worktrees; it does not run
in one. It is listed in the Exceptions section of
`${CLAUDE_PLUGIN_ROOT}/shared/readiness/WORKTREE_GATE.md`.

## DO NOT

- Run two `/merge-use-case` invocations at the same time — the merge queue is strictly serial
- Start a use case whose **Depends On** entries are not all `Status: Done`
- Merge a branch whose gate is red
- Create a worktree inside the repository directory — worktrees live as siblings of it
- Ask the user for input between merges — run autonomously until the cluster is delivered or
  a gate stops the run

## Process

### Step 1: Resolve the scope

If $ARGUMENTS names a cluster, read the cluster table in `docs/engineering/progress.md` and
take its `Use Cases` cell. If $ARGUMENTS is a list of UC IDs, take them literally.

Report the scope and the cluster's technical tasks.

### Step 2: Check the technical tasks

Read every technical task in the cluster's `Technical Tasks` cell, plus every task with
`Scope: Umbrella`. Each must have `Status: Done`.

If any is not done, stop:

```
DELIVERY BLOCKED — technical tasks are not complete

| Task   | Name                       | Scope     | Status  |
|--------|----------------------------|-----------|---------|
| TT-010 | Provision the OAuth app    | Cluster   | Draft   |

A technical task provisions something outside the codebase, and the cluster's use
cases may all depend on it. Complete it first.

A technical task has no orchestrating skill. Give it its own worktree, do the work
there, then send it through the same merge gate:

  git fetch origin main
  git worktree add ../<repo>-TT-010 -b tt/TT-010 origin/main
  # do the work in that directory, then:
  /merge-use-case TT-010

Then run /deliver-cluster again.
```

### Step 3: Build the dependency graph

For each use case in scope, take its **Depends On** value from the first source that has it:

1. `docs/use_cases/UC-XXX.md` — the **Depends On** row, when the specification exists
2. `docs/engineering/cluster-N-analysis.md` — the technique 10 result for this use case

A use case with no specification is **not** blocked: `/deliver-use-case` writes the spec in its
Step 1a. What blocks it is having no elaboration in either source, because then its dependencies
are unknown and delivering it could race a use case it silently needs:

```
DELIVERY BLOCKED — <UC-XXX> is not elaborated

Neither docs/use_cases/UC-XXX.md nor the cluster analysis declares Depends On.

Run /engineer-requirements for this cluster. It records, for every use case, which
other use cases it depends on and whether it has a screen.
```

Detect cycles. A cycle cannot be delivered in any order:

```
DELIVERY BLOCKED — the dependency graph has a cycle

UC-004 -> UC-007 -> UC-004

A cycle always means the use case boundaries are wrong. Run /engineer-requirements
to split or merge the use cases, then run /deliver-cluster again.
```

### Step 4: Compute the ready set

A use case is **ready** when:

1. It is not delivered — `docs/delivery/UC-XXX-iterations.md` does not exist.
2. Every ID in its **Depends On** row has `Status: Done` in its specification.
3. It is not in the **running**, **queued**, or **failed** set (Step 7 defines these).

Print the plan:

```
Cluster: <name> — <N> use cases

Ready now (parallel):   UC-001, UC-002, UC-005
Blocked:                UC-003 (needs UC-001), UC-004 (needs UC-001, UC-003)
Already delivered:      UC-000
```

If the ready set is empty and both **running** and **queued** are empty, the run is over — go
to Step 8. Use cases may remain undelivered because they failed or depend on one that did;
Step 8 reports them.

### Step 5: Check for collisions

Two use cases delivered at the same time must not both change a file that git cannot merge
safely.

| File | Rule |
|------|------|
| `db/migrations/` | No new migration during delivery — the Entity Gate in `/deliver-use-case` already forbids it. The concrete risk is goose version numbers: two parallel branches that each add a migration can pick the same or out-of-order version, and goose then refuses to apply or silently skips one. If a use case in the ready set needs a schema change, stop. The migration must land on `main` before the cluster starts, and it runs in its own worktree because `/db-migration` is gated too: `git worktree add ../<repo>-schema -b tt/TT-XXX origin/main`, run `/db-migration` there, then `/merge-use-case TT-XXX` |
| `internal/web/routes.go` | Warn when two ready use cases both register routes. The merge gate resolves it by keeping both registrations |

A warning does not stop the run. A new migration in `db/migrations/` does.

### Step 6: Fan out

For each use case in the ready set, create a worktree from current `main` and start the
pipeline in it:

```bash
git fetch origin main
git worktree add ../$(basename "$PWD")-UC-XXX -b uc/UC-XXX origin/main
```

Then invoke `/deliver-use-case UC-XXX` in that worktree. Start every ready use case in the
same message so the pipelines run concurrently.

Cap the fan-out at 4 concurrent worktrees. Each pipeline runs a build and a test suite, so
more than that competes for the machine rather than saving time.

> `ponytail:` fixed cap of 4. Make it a parameter only if a real project shows the cap is
> the bottleneck.

### Step 7: Merge, one at a time

As each pipeline finishes, invoke `/merge-use-case UC-XXX`. When this skill was invoked with
`--review`, pass it through — `/merge-use-case UC-XXX --review` — so the branch stops at a pull
request instead of merging.

**Never run two merges at once.** Queue the finished branches and merge them in the order they
finished. A merge rebases onto `main` and runs the full regression suite, so a second
concurrent merge would test a tree that is about to change under it.

`/merge-use-case` takes a machine-wide merge lock, so a merge started by *another* agent —
another cluster, a bug fix, a use case delivered on its own — stops this one rather than
racing it. If a merge reports the lock is held, leave that branch in the queue and try it
again after the current item; do not treat it as a failure. To land branches left behind by
several agents at once, run `/merge-queue`.

If a merge stops with a red gate, leave that worktree in place, move the use case to the
**failed** set, report it, and continue with the rest of the queue. A failed branch does not
block the others, and it is never retried automatically within this run.

After each successful merge, **return to Step 4**. A merge sets a use case to `Done`, which
can make a blocked use case ready.

**Track three sets so the loop's exit is arithmetic, not judgement:**

- **running** — a pipeline is executing right now
- **queued** — finished green, waiting its turn in the merge queue
- **failed** — its gate went red; its worktree stays on disk

The run ends when **running and queued are both empty**. A failed use case is in neither, so it
does not hold the loop open, and Step 4 never selects it again. Anything that depends on a
failed use case stays blocked, and Step 8 reports it.

### Step 8: Report

Regenerate the project overview with `/dashboard` (nexa-claude-core), then commit it — an
uncommitted `docs/overview/` on `main` is lost on the next reset and leaves a dirty tree for the
next merge:

```bash
git add docs/overview docs/index.html
git diff --cached --quiet || git commit -m "docs(overview): update the cluster overview"
git push origin main
```

Then print:

```
## Cluster Delivered: <name>

| UC     | Name              | Result   | Merged |
|--------|-------------------|----------|--------|
| UC-001 | Register          | Done     | yes    |
| UC-003 | Reset the password| Gate red | no     |

Delivered: <n> of <total>
Failed:    <list — gate that went red, and the worktree that still holds the work>
Blocked:   <list — which failed or undelivered use case each one waits on>

Overview: docs/overview/index.html
```

For every use case that did not merge, name the gate that failed and the worktree path, so the
work can be picked up. Never remove a failed worktree — it holds the only copy of that work.

In `--review` mode, nothing merged. Report every green branch and its pull request, and say
plainly that dependent use cases stay blocked until those pull requests land and their
specifications reach `Status: Done` on `main`.

## Human review

Review is **optional**. By default a green branch merges without a pull request.

Run `/deliver-cluster <cluster> --review` to stop at the pull request instead: each green
branch is pushed and a pull request is opened against `main`, and nothing is merged. Use this
when a human must read the code before it lands.

`--review` ends the run early by design. A use case only reaches `Status: Done` on `main` when
its branch merges, so nothing downstream becomes ready while the pull requests are open. After
a pull request lands, run `/merge-use-case <ID> --after-review` to close its issue and remove
its worktree, then run `/deliver-cluster` again to pick up whatever that unblocked.

## Verification

1. The number of worktrees created never exceeds 4 at a time, and each is on a `uc/UC-XXX`
   branch.
2. No use case starts before every entry in its **Depends On** row is `Status: Done`.
3. At no point are two `/merge-use-case` runs in flight.
4. `git log --graph main` shows no merge commit.
5. Every worktree is removed after its branch merges; `git worktree list` shows only the
   primary checkout and the worktrees of branches that are still blocked.
6. `docs/overview/index.html` shows the cluster with the correct delivered count.
