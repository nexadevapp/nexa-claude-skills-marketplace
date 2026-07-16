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
- Run more than 2 Code Review iterations in Step 3
- Hard-stop on DoR_BUG upfront for a doc auto-created from a raw GitHub issue in this run —
  thin Expected/Actual Behavior, Steps to Reproduce, or Severity are expected there; let the
  `bug-tester` fill them from actual investigation instead (see Step 0.4)
- Apply that same leniency to a **pre-existing** `BUG-XXX` doc — a human wrote or reviewed it,
  so it's still held to the full DoR_BUG standard immediately in Step 0

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

1. If `$ARGUMENTS` matches `BUG-XXX`, read `docs/bugs/BUG-XXX.md` directly. Mark this doc
   **pre-existing** and go to 4.
2. If `$ARGUMENTS` is a GitHub issue URL or bare number, search for an existing bug doc that
   already points at it:
   ```
   grep -rl "<issue-url-or-number>" docs/bugs/
   ```
   If found, use that `BUG-XXX`, mark it **pre-existing**, and go to 4.
3. If no bug doc exists for a given GitHub issue, invoke the `report-bug` skill (via the Skill
   tool, `skill: "report-bug"`) with the issue URL as its argument. This creates the doc and
   the thin-pointer issue linkage per its own `github-issue` origin workflow — do not
   duplicate that logic here. Use the resulting `BUG-XXX` id and mark it **auto-created**.
4. **DoR_BUG gate — conditional on origin:**
   - **Pre-existing doc** (paths 1–2): a human is presumed to have written or reviewed it, so
     hold it to the full standard now. Run
     `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_READY_BUG.md` against it. If any
     item fails, report the failures and stop — do not begin the pipeline until the user fixes
     the report or explicitly waives the failing items.
   - **Auto-created doc** (path 3): raw GitHub issues are routinely thin or poorly formatted —
     missing Expected/Actual Behavior, vague or absent reproduction steps, no severity. Do
     **not** run DoR_BUG here. Proceed straight to Step 1 and let the `bug-tester` fill these
     gaps from its own investigation instead of demanding a human do it upfront. The gate is
     not skipped, only deferred: Step 3 reuses `implement/SKILL.md`, which runs this exact same
     `DEFINITION_OF_READY_BUG.md` check again before touching code. By then the doc should
     carry real, investigated content; if it still doesn't, the pipeline stops there with a
     concrete reason instead of a presumptive one now.
5. Note the bug doc's **GitHub Issue** field — this is the issue number every subagent in
   this pipeline will comment on. Carry the **pre-existing / auto-created** marking into
   Step 1's prompt.

---

### Step 1: Reproduce (Isolated Agent)

Spawn a **typed `bug-tester` subagent** (not general-purpose). The agent's system prompt is
its operating manual — the tester role is loaded as identity, not as a referenced doc. It runs
cold: no visibility into any prior fix attempt or analysis.

Invoke via the Agent tool with `subagent_type: "bug-tester"`. Prompt:

> Reproduce the bug described in `docs/bugs/BUG-XXX.md` (GitHub issue #<number>). This doc is
> **[pre-existing | auto-created from the raw GitHub issue]**.
>
> Follow your operating manual (`resolve-bug/SKILL.md` Step 1, loaded as your identity) to the
> letter. If auto-created, fill any missing/placeholder Expected Behavior, Actual Behavior,
> Steps to Reproduce, or Severity from your own investigation — do not leave them for a human
> to backfill. Report your verdict (Reproducible / Not Reproducible / Insufficient
> Information), the evidence you gathered, any fields you filled in, and the issue comment you
> posted.

**If Insufficient Information** (only possible for an auto-created doc — the tester couldn't
determine what to even attempt): stop the pipeline. Print what's missing and:

```
PIPELINE STOPPED: BUG-XXX — not enough information to reproduce

[tester's report of what's missing]

The raw GitHub issue didn't have enough for the tester to act on. Add the missing detail to
the issue (or docs/bugs/BUG-XXX.md directly) and re-run /resolve-bug.
```

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
neither depends on the other's output. They don't share a write target (`bug-analyst` only
posts a GitHub issue comment; `requirement-linker` is the sole writer of the bug doc's Related
Artifacts section), so TRACKING.md's Re-Read Before Write guidance does not apply here.

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

`implement/SKILL.md` already runs the `DEFINITION_OF_READY_BUG.md` gate itself before
implementing. For a **pre-existing** doc this was already satisfied in Step 0 and simply
re-passes. For an **auto-created** doc, Step 0 deliberately deferred that gate — this is
where it actually bites: if the `bug-tester`'s fill-ins in Step 1 weren't enough to satisfy
DoR_BUG, `implement/SKILL.md` stops here with the specific failing items, same as it would for
any other `BUG-XXX`. Resolve those (or have the user waive them) before continuing.

`implement/SKILL.md` also runs, at its end, its own Post-Implementation Tracking section
(issue comment, status update, close, conventional commit). **Do not let that tracking section
run yet** — first complete the DoD_BUG gate below, then let it run.

**DoD_BUG Gate** — after implementation, tests, and build succeed (steps 1–12 of
`implement/SKILL.md`), read `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_DONE_BUG.md`
and check every item against the code and the reproduction steps. Fix any Critical failures
(items that are entirely unmet — e.g. actual behavior still occurs, no regression test added)
and re-check. Up to 2 iterations.

If DoD_BUG still fails after 2 iterations, stop and follow **Failure Recovery** below — do not
proceed to Post-Implementation Tracking with an unresolved Critical failure.

**Code Review Gate (up to 2 iterations)** — once DoD_BUG passes, spawn a **typed
`code-review` subagent** (not general-purpose) via the Agent tool with
`subagent_type: "code-review"`. Prompt:

> Review the fix for BUG-XXX (GitHub issue #<number>). Run `git diff <rollback-checkpoint-hash>`
> (the hash recorded in Rollback Checkpoint) to see every change made so far, and review it
> against `docs/bugs/BUG-XXX.md` and the `bug-analyst`'s fix plan posted to the issue.
>
> Follow your operating manual (`code-review/SKILL.md`) to the letter. Return the structured
> review report exactly as specified in its Output Format section.

Fix every Critical finding — required before proceeding. Fix Important findings when the fix
is straightforward; otherwise note them in the completion summary as a follow-up rather than
blocking. Minor findings never block. After applying fixes, re-run the DoD_BUG check, then
re-launch the `code-review` subagent for re-review. This DoD_BUG re-check is a regression
check within the Code Review Gate's own iteration budget — it does not consume or reset the
DoD_BUG gate's already-exhausted budget from the step above.

After 2 iterations with a Critical finding still open, stop and follow **Failure Recovery**
below — do not proceed to Post-Implementation Tracking with an unresolved Critical finding.

Once the Code Review Gate passes, let `implement/SKILL.md`'s Post-Implementation Tracking
section run to completion (this is what comments "Implemented: ...", sets bug Status to
`Fixed`, closes the issue if satisfied, and creates the `fix(BUG-XXX): ...` commit).

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
| Code Review              | N / 2 |

GitHub issue: <url>
Bug doc: docs/bugs/BUG-XXX.md
```

---

## Failure Recovery

When the DoD_BUG gate or the Code Review Gate exhausts its 2 iterations without passing:

```
BUGFIX FAILED: BUG-XXX

[remaining DoD_BUG or Code Review Critical failures]

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
