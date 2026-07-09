---
name: resolve-bug
description: >
  Orchestrates the full bugfix pipeline for a BUG-XXX or GitHub issue: an isolated tester
  reproduces the bug and updates the issue, a senior-dev agent writes a root-cause fix plan
  while a business-analyst agent links the affected requirement(s) in parallel, then the fix
  is implemented and gated on Definition of Done. Use when the user asks to "fix this bug",
  "resolve BUG-XXX", "run the bugfix pipeline", pastes a GitHub issue link and asks to fix it,
  or mentions an end-to-end bug resolution workflow.
---

# Resolve Bug Pipeline

## Instructions

Run the complete bugfix pipeline for $ARGUMENTS — a bug ID (`BUG-XXX`), a GitHub issue URL
(e.g. `https://github.com/owner/repo/issues/47`), or a bare issue number.

This orchestrates four roles in sequence/parallel: **Tester** (reproduce) → **Senior Dev
Analyst** + **Business Analyst** (in parallel: fix plan / requirement linking) → **Senior Dev**
(implement the fix). Each isolated role runs as a typed subagent with no visibility into the
others' reasoning, so findings are independent, not rationalized.

## Prerequisites

- `docs/requirements.md` and `docs/use_cases/` (from core skills) — used by the
  `requirement-linker` agent.
- A `BUG-XXX` doc, or a GitHub issue that one can be created from (see Step 0).

## DO NOT

- Skip the reproduction step, even if the bug "obviously" still exists — the tester's evidence
  is what the fix plan and the fix itself are grounded in
- Proceed to Step 2 or Step 3 if the tester reports Not Reproducible
- Let the `bug-analyst` or `requirement-linker` agents edit implementation files — they analyze
  and link only; only Step 3 touches code
- Apply the `bug-analyst`'s fix plan blindly — verify it against the current code before
  implementing, the plan can go stale between posting and implementation
- Auto-close the GitHub issue on a Not Reproducible verdict — leave it open for a human to
  triage
- Run more than 2 DoD_BUG fix iterations in Step 3

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Rollback Checkpoint

Before Step 3 (the only step that writes code), record the current commit:

```
git rev-parse HEAD
```

Store as the rollback point for Failure Recovery.

## Pipeline

---

### Step 0: Resolve the Bug Doc

1. If `$ARGUMENTS` matches `BUG-XXX`, read `docs/bugs/BUG-XXX.md` directly and go to 3.
2. If `$ARGUMENTS` is a GitHub issue URL or bare number, search for an existing bug doc that
   already points at it:
   ```
   grep -rl "<issue-url-or-number>" docs/bugs/
   ```
   If found, use that `BUG-XXX` and go to 3.
3. If no bug doc exists for a given GitHub issue, invoke the `report-bug` skill (via the Skill
   tool, `skill: "report-bug"`) with the issue URL as its argument. This creates the doc and
   the thin-pointer issue linkage per its own `github-issue` origin workflow — do not
   duplicate that logic here. Use the resulting `BUG-XXX` id.
4. Run `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_READY_BUG.md` against the bug
   doc. If any item fails, report the failures and stop — do not begin the pipeline until the
   user fixes the report or explicitly waives the failing items.
5. Note the bug doc's **GitHub Issue** field — this is the issue number every subagent in
   this pipeline will comment on.

---

### Step 1: Reproduce (Isolated Agent)

Spawn a **typed `bug-tester` subagent** (not general-purpose). The agent's system prompt is
its operating manual — the tester role is loaded as identity, not as a referenced doc. It runs
cold: no visibility into any prior fix attempt or analysis.

Invoke via the Agent tool with `subagent_type: "bug-tester"`. Prompt:

> Reproduce the bug described in `docs/bugs/BUG-XXX.md` (GitHub issue #<number>).
>
> Follow your operating manual (`resolve-bug/SKILL.md` Step 1, loaded as your identity) to the
> letter. Report your verdict (Reproducible / Not Reproducible), the evidence you gathered,
> and the issue comment you posted.

**If Not Reproducible:** stop the pipeline here. Print the tester's evidence and:

```
PIPELINE STOPPED: BUG-XXX not reproducible

[tester's evidence]

The issue has been commented with this finding and left open (Status: Open) for manual
triage — decide whether to close it, request more repro details, or re-run
/resolve-bug BUG-XXX later.
```

**If Reproducible:** continue to Step 2.

---

### Step 2: Analyze + Link (Parallel Isolated Agents)

Spawn both subagents in the **same message** (two Agent tool calls) so they run in parallel —
neither depends on the other's output.

#### Senior Dev Analyst

Invoke via the Agent tool with `subagent_type: "bug-analyst"`. Prompt:

> Analyze the root cause of the bug in `docs/bugs/BUG-XXX.md` (GitHub issue #<number>), now
> confirmed reproducible. Read the tester's reproduction evidence from the issue thread first.
>
> Follow your operating manual (`resolve-bug/SKILL.md` Step 2, loaded as your identity) to the
> letter. You do not edit any file. Report the root cause, the fix plan you posted, and the
> issue comment id.

#### Business Analyst

Invoke via the Agent tool with `subagent_type: "requirement-linker"`. Prompt:

> Identify the requirement(s), use case(s), and business rule(s) that the bug in
> `docs/bugs/BUG-XXX.md` (GitHub issue #<number>) violates.
>
> Follow your operating manual (`resolve-bug/SKILL.md` Step 2, loaded as your identity) to the
> letter. You only edit the bug doc's Related Artifacts section — no implementation files.
> Report what you linked and the issue comment id.

Wait for both to complete before proceeding.

---

### Step 3: Fix (Main Context)

Read and follow: `${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md` for `BUG-XXX`.

Additionally, before starting implementation, read the `bug-analyst`'s `## Fix Plan` comment
from the GitHub issue (`gh issue view <number> --comments`) and use it as your primary
guidance for root cause and approach. **Verify it against the current code rather than
applying it blindly** — the analysis was written moments ago but code is the source of truth.
If the plan and the code disagree, trust the code and note the discrepancy in your delivery
summary.

`implement/SKILL.md` already runs the `DEFINITION_OF_READY_BUG.md` gate (already satisfied
from Step 0) and, at its end, its own Post-Implementation Tracking section (issue comment,
status update, close, conventional commit). **Do not let that tracking section run yet** —
first complete the DoD_BUG gate below, then let it run.

**DoD_BUG Gate** — after implementation, tests, and build succeed (steps 1–12 of
`implement/SKILL.md`), read `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_DONE_BUG.md`
and check every item against the code and the reproduction steps. Fix any Critical failures
(items that are entirely unmet — e.g. actual behavior still occurs, no regression test added)
and re-check. Up to 2 iterations.

If DoD_BUG still fails after 2 iterations, stop and follow **Failure Recovery** below — do not
proceed to Post-Implementation Tracking with an unresolved Critical failure.

Once DoD_BUG passes, let `implement/SKILL.md`'s Post-Implementation Tracking section run to
completion (this is what comments "Implemented: ...", sets bug Status to `Fixed`, closes the
issue if satisfied, and creates the `fix(BUG-XXX): ...` commit).

---

## Completion

Terminal summary:

```
## Pipeline Complete: BUG-XXX

| Step                    | Status |
|--------------------------|--------|
| Reproduce (bug-tester)   | Reproducible |
| Analyze (bug-analyst)    | Fix plan posted |
| Link (requirement-linker)| [requirements linked] |
| Fix (implement)          | ... |
| DoD_BUG                  | N / 2 |

GitHub issue: <url>
Bug doc: docs/bugs/BUG-XXX.md
```

---

## Failure Recovery

When the DoD_BUG gate exhausts its 2 iterations without passing:

```
BUGFIX FAILED: BUG-XXX

[remaining DoD_BUG Critical failures]

Roll back all changes from this pipeline run? (Y/n)

Recommended: Roll back. Resets to the pre-fix state for a clean retry.
Alternative: Keep the code, leave the issue open, and fix the remaining items manually.
```

### Roll back (default)

```
git reset --hard <saved-commit-hash>
```

Confirm all pipeline changes have been reverted. Do not let `implement/SKILL.md`'s
Post-Implementation Tracking run — the issue stays open, `Status` stays whatever it was before
this pipeline started.

### Keep code

Leave the working tree as-is and tell the user which DoD_BUG items remain.
