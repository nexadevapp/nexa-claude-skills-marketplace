---
name: sprint-rework
description: >
  Resets the sprint branch to match main after a PR review and re-delivers all use cases.
  Optionally refines specifications and designs before re-delivery. Triggered after the human
  reviews the sprint PR and requests changes — either because specs need refinement or because
  the agent made implementation mistakes. Use when the user asks to "rework the sprint",
  "redo the sprint", "reset and re-deliver", "start the sprint over", or mentions sprint rework,
  sprint redo, or PR review rework.
user_invocable: true
arguments: none
---

# Sprint Rework

## Purpose

After a sprint PR has been reviewed by a human, the reviewer may request changes that require
a full re-delivery of the sprint. This skill resets the sprint branch to match `main` or `master`, optionally
allows refinement of specifications and designs, cleans up delivery artifacts, and then re-delivers
all use cases from scratch.

Two common scenarios:

1. **Implementation mistakes** — the specs and designs are fine, but the agent made errors during
   implementation. No refinement needed, just re-deliver.
2. **Spec/design refinement needed** — the reviewer identified gaps or issues in the specifications
   or designs that should be addressed before re-implementation.

## Prerequisites

- Currently on a `sprint-<N>` branch (created by `/sprint-kickoff`)
- A sprint PR exists (created by `/sprint-complete`) — or the user has reviewed the sprint work
- `docs/sprints/next-sprint/readiness-report.md` exists (the sprint was archived by `/sprint-complete`,
  so it must be restored first)

If not on a sprint branch, stop: "Not on a sprint branch. Expected `sprint-<N>` branch."

## DO NOT

- Delete or modify the sprint PR — the existing PR will be updated automatically when new commits are pushed
- Skip the user confirmation before resetting the branch — this is a destructive operation
- Re-run `/sprint-kickoff` — the branch already exists, we are reusing it
- Create a new sprint branch — rework happens on the same `sprint-<N>` branch
- Bump the sprint number — this is the same sprint, just re-delivered

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Pipeline

Execute these phases in order.

Throughout this skill, `<BASE>` refers to the repository's default branch — either `main` or
`master`. Detect it once in Phase 1 and use it consistently in all subsequent phases.

---

### Phase 1: Validate Sprint State

1. Detect the base branch:
   ```bash
   git remote show origin | grep 'HEAD branch' | sed 's/.*: //'
   ```
   Store the result as `<BASE>` (typically `main` or `master`). Use this value in all
   subsequent git commands instead of hardcoding `main`.

2. Verify the current branch is a sprint branch:
   ```bash
   git branch --show-current
   ```
   Expected format: `sprint-<N>`. If not, stop: "Not on a sprint branch."

3. Extract the sprint number N from the branch name.

4. Check if a PR exists for this branch:
   ```bash
   gh pr list --head sprint-<N> --state open --json number,title,url -q '.[0]'
   ```
   - If a PR exists, display it: "Found open PR: #[number] — [title]"
   - If no PR exists, that's fine — the user may have reviewed the work locally or
     the PR may have been closed. Continue regardless.

5. Display the current state:

   > **Sprint Rework — Sprint N**
   >
   > Branch: `sprint-<N>`
   > Base branch: `<BASE>`
   > PR: #[number] ([url]) / No open PR found
   >
   > This will reset the sprint branch to match `<BASE>` and re-deliver all use cases.
   > All current implementation work on this branch will be discarded.

---

### Phase 2: Determine Rework Scope

Ask the user what kind of rework is needed:

> **What needs to change before re-delivery?**
>
> 1. **Just re-deliver** — specs and designs are fine, only re-implement
> 2. **Refine first** — update specs/designs before re-implementation
>
> Which option?

Wait for the user's response.

- **Option 1**: Skip to Phase 4 (no refinement needed).
- **Option 2**: Proceed to Phase 3.

---

### Phase 3: Refine Specifications and Designs (Optional)

This phase only runs if the user chose Option 2 in Phase 2.

All refinement work happens on `<BASE>`. Specifications and designs are documentation
artifacts that live on `<BASE>` — they must never be committed on the sprint branch.

1. Switch to `<BASE>`:
   ```bash
   git checkout <BASE>
   git pull origin <BASE>
   ```

2. Locate the readiness report. Check both possible locations:
   - `docs/sprints/next-sprint/readiness-report.md` (if sprint was not yet archived)
   - `docs/sprints/sprint-<N>/readiness-report.md` (if sprint was archived by `/sprint-complete`)

   Read the readiness report to get the sprint scope (Delivery Order table).

3. Display the use cases in scope and ask what needs refinement:

   > **Use cases in this sprint:**
   >
   > | # | UC ID | Name |
   > |---|-------|------|
   > | 1 | UC-XXX | [name] |
   > | 2 | UC-YYY | [name] |
   >
   > **What would you like to refine?**
   >
   > You can:
   > - Describe changes to specific use case specs or designs
   > - Ask me to re-run `/use-case-spec <UC-ID>` for specific use cases
   > - Ask me to re-run `/design-screens <UC-ID>` for specific use cases
   > - Provide PR review comments to address
   >
   > Tell me what needs to change.

4. Wait for the user's input and apply the requested refinements. This may involve:
   - Editing spec files (`docs/use_cases/<UC-ID>.md`) based on review feedback
   - Re-generating designs (`docs/designs/<UC-ID>-design.html`)
   - Running `/use-case-spec` or `/design-screens` for specific use cases
   - Any other adjustments the user requests

5. Commit all refinements on `<BASE>`:
   ```bash
   git add docs/use_cases/ docs/designs/ docs/sprints/
   git commit -m "Refine specs/designs for sprint-<N> rework"
   git push origin <BASE>
   ```

6. Switch back to the sprint branch:
   ```bash
   git checkout sprint-<N>
   ```

7. Confirm with the user:

   > **Refinements committed to `<BASE>`. Ready to reset the sprint branch and re-deliver.**
   >
   > Proceed?

   Wait for confirmation before continuing.

---

### Phase 4: Reset Sprint Branch

This is a destructive operation — confirm before proceeding.

1. Ask for final confirmation:

   > **About to reset `sprint-<N>` to match `<BASE>`.**
   >
   > This will discard ALL implementation work on this branch.
   > Specifications and designs are safe on `<BASE>`.
   >
   > **Are you sure?** (yes/no)

   Wait for explicit confirmation. If the user says no, stop.

2. Fetch latest from remote:
   ```bash
   git fetch origin <BASE>
   ```

3. Reset the sprint branch to match `<BASE>`:
   ```bash
   git reset --hard origin/<BASE>
   ```

4. Force push the reset branch:
   ```bash
   git push --force-with-lease origin sprint-<N>
   ```

5. Confirm the reset:

   > **Branch `sprint-<N>` has been reset to match `<BASE>`.**

---

### Phase 5: Clean Up Delivery Artifacts

Remove delivery artifacts from previous implementation so `/sprint-deliver` treats
all use cases as undelivered:

1. Check for and remove iteration logs and traceability reports:
   ```bash
   # Remove iteration logs (these mark a UC as "delivered")
   rm -f docs/delivery/*-iterations.md
   rm -f docs/delivery/*-traceability.md
   ```

2. If the sprint was archived (folder `docs/sprints/sprint-<N>/` exists from a previous
   `/sprint-complete`), restore it to `next-sprint`:
   ```bash
   # If archived, restore
   if [ -d "docs/sprints/sprint-<N>" ]; then
     rm -rf docs/sprints/next-sprint
     mv docs/sprints/sprint-<N> docs/sprints/next-sprint
   fi
   ```

3. Remove delivery subfolder from the sprint archive (if it was moved there):
   ```bash
   rm -rf docs/sprints/next-sprint/delivery/
   ```

4. Remove the sprint summary (it will be regenerated by `/sprint-complete` after rework):
   ```bash
   rm -f docs/sprints/next-sprint/SUMMARY.md
   ```

5. Update the dashboard manifest if needed:
   - Read `docs/sprints/sprints-overview/manifest.json`
   - If the sprint entry has `status: "delivered"`, change it back to `"in-progress"`
   - Update `currentSprint` to `"sprint-<N>"`
   - Update file paths back to `next-sprint` references
   - Remove `delivery` file references from use case entries
   - Write the updated manifest

6. Commit the cleanup:
   ```bash
   git add docs/delivery/ docs/sprints/
   git commit -m "Reset sprint-<N> for rework: clean delivery artifacts"
   git push origin sprint-<N>
   ```

---

### Phase 6: Re-Deliver

Invoke `/sprint-deliver` to re-deliver all use cases from scratch.

The delivery order from the readiness report is preserved — use cases will be delivered
in the same order as the original sprint.

Report to the user before starting:

> **Sprint N — Rework Ready**
>
> Branch: `sprint-<N>` (reset to `<BASE>`)
> Delivery artifacts: cleaned
> Specs/designs: [preserved / refined]
> Use cases to deliver: [list UC IDs from delivery order]
>
> Starting re-delivery via `/sprint-deliver`...

Then invoke `/sprint-deliver`.
