---
name: sprint-complete
description: >
  Completes the current sprint by validating all use cases are delivered, closing GitHub
  issues, generating a sprint summary, updating the sprints overview dashboard, archiving
  the sprint folder, and publishing the report to the sprint-report branch for Amplify
  deployment. Use when the user asks to "complete the sprint", "close the sprint",
  "finish the sprint", "wrap up the sprint", or mentions sprint completion, sprint close,
  or sprint demo preparation.
user_invocable: true
arguments: none
---

# Sprint Complete

## Instructions

Complete the current sprint by validating delivery, closing GitHub issues, generating a
summary report, updating the project dashboard, archiving sprint artifacts, and publishing
the updated report for stakeholder review.

The sprints overview dashboard (`docs/sprints/sprints-overview/index.html`) is the
stakeholder-facing artifact — it is what gets presented in the sprint demo. This skill
ensures it reflects the completed sprint.

## Prerequisites

- Sprint has been delivered (`/sprint-deliver` completed for all use cases in scope)
- The application builds successfully (`npx next build`)
- `docs/sprints/next-sprint/readiness-report.md` exists

If any prerequisite fails, stop and report which prerequisite is not met.

## DO NOT

- Modify specification or design documents
- Fix bugs or implementation issues — the sprint is done, this is closing time
- Skip the GitHub issue closure step
- Archive without generating the summary first
- Force-push to `sprint-report` without confirming the dashboard renders correctly
- Create a git commit on the current branch without user confirmation

## Pipeline

Execute these phases in order.

---

### Phase 1: Validate Sprint Completion

1. Check that `docs/sprints/next-sprint/` exists.
   - If not, stop: "No active sprint found. Run `/sprint-prepare` to start a sprint."

2. Read `docs/sprints/next-sprint/readiness-report.md` to get the sprint scope.
   - Extract the **Delivery Order** table to know which UCs were planned.

3. Check delivery status for each planned UC:
   - Look for `docs/delivery/<UC-ID>-iterations.md`
   - Mark as delivered if the iteration log exists

4. If any UCs are not delivered, present the status and ask the user:

   > **Sprint has undelivered use cases:**
   >
   > | UC ID | Name | Status |
   > |-------|------|--------|
   > | UC-XXX | [name] | Delivered |
   > | UC-YYY | [name] | NOT DELIVERED |
   >
   > **Options:**
   > 1. Complete anyway — undelivered UCs will be noted in the summary and excluded
   >    from GitHub issue closure
   > 2. Cancel and continue delivery
   >
   > What would you like to do?

   Wait for user confirmation. If the user cancels, stop.

---

### Phase 2: Close GitHub Issues

For each **delivered** use case, find and close its GitHub issue:

1. Search for the issue:
   ```
   gh issue list --search "in:title <UC-ID>" --state open --json number,title -q '.[] | select(.title | startswith("<UC-ID>:")) | .number'
   ```

2. If an open issue is found, close it with a comment:
   ```
   gh issue close <number> --comment "Delivered in sprint-N. Closing as part of /sprint-complete."
   ```

3. Track results:

   | UC ID | Issue | Action |
   |-------|-------|--------|
   | UC-XXX | #42 | Closed |
   | UC-YYY | — | No issue found |

Report the results to the user before proceeding.

---

### Phase 3: Determine Sprint Number

1. List existing sprint folders in `docs/sprints/`:
   - Pattern: `sprint-1/`, `sprint-2/`, etc.
   - Find the highest number N
   - New sprint number = N + 1
   - If no numbered sprints exist, start with sprint-1

---

### Phase 4: Generate Sprint Summary

Gather information and generate the summary:

1. **Delivered UCs**: List from iteration logs with iteration counts
2. **Traceability**: Read `docs/delivery/<UC-ID>-traceability.md` for each delivered UC
   to count verified requirements
3. **Issues encountered**: Extract from iteration logs (retries, blockers, failures)
4. **Sprint duration**: From git log — first and last commit touching sprint artifacts
5. **Audit results**: Read `docs/delivery/sprint-audit-report.md` if it exists (optional —
   may not be present since sprint-audit is no longer part of the pipeline)

Write `docs/sprints/next-sprint/SUMMARY.md`:

```markdown
# Sprint N Summary

**Completed:** [date]
**Duration:** [first delivery commit] → [last delivery commit]

## Delivered Use Cases

| # | UC ID | Name | Iterations | Verified FRs | Status |
|---|-------|------|------------|--------------|--------|
| 1 | UC-XXX | [name] | N | N/N | Delivered |
| 2 | UC-YYY | [name] | N | N/N | Delivered |
| 3 | UC-ZZZ | [name] | — | — | Not delivered |

## Sprint Metrics

| Metric | Value |
|--------|-------|
| Planned UCs | N |
| Delivered UCs | N |
| Completion rate | N% |
| Total delivery iterations | N |
| Avg iterations per UC | N.N |
| Total verified FRs | N |

## GitHub Issues

| UC ID | Issue | Action |
|-------|-------|--------|
| UC-XXX | #42 | Closed |
| UC-YYY | #43 | Closed |

## Issues Encountered

### Retries

- UC-XXX required N retries due to [reason from iteration log]

### Blockers

- [Any blockers encountered and how they were resolved]

*(If none: "No significant issues encountered.")*

## Carryover

- [ ] UC-ZZZ — not delivered, reason: [from Phase 1]
- [ ] [Any technical debt noted during delivery]

*(If none: "Nothing to carry over.")*

---

*Generated by `/sprint-complete`*
```

---

### Phase 5: Update Sprints Overview Dashboard

The sprints overview lives at `docs/sprints/sprints-overview/` and is driven by
`manifest.json`. `/sprint-prepare` bootstraps this directory and creates the initial
manifest entry with status `in-progress`.

1. Read `docs/sprints/sprints-overview/manifest.json`.

2. Find the sprint entry where `status` is `"in-progress"` (there should be exactly one —
   the sprint being completed).

3. Update the entry:
   - Set `status` to `"delivered"`
   - Set `date` to today's date
   - Update the `files` object to point to the **archived** sprint folder paths
     (since the folder will be renamed in Phase 6):
     ```json
     "files": {
       "readiness": "../sprint-N/readiness-report.md",
       "changelog": "../sprint-N/changelog.md",
       "refinement": "../sprint-N/refinement-proposal.md",
       "summary": "../sprint-N/SUMMARY.md"
     }
     ```

4. Update `currentSprint` to `null` (no active sprint after completion).

5. Verify that the `useCases` array in the manifest contains entries for all delivered UCs
   with correct paths to their spec, design, and delivery files. These entries should already
   exist (created by `/sprint-prepare`). If any are missing, add them.

6. Write the updated `manifest.json`.

---

### Phase 6: Archive the Sprint

1. Rename the sprint folder:
   ```bash
   mv docs/sprints/next-sprint docs/sprints/sprint-N
   ```

2. Move delivery artifacts into the sprint archive:
   ```bash
   mkdir -p docs/sprints/sprint-N/delivery

   # Move iteration logs for delivered UCs
   for each delivered UC-ID:
     mv docs/delivery/<UC-ID>-iterations.md docs/sprints/sprint-N/delivery/

   # Move traceability reports for delivered UCs
   for each delivered UC-ID:
     mv docs/delivery/<UC-ID>-traceability.md docs/sprints/sprint-N/delivery/ 2>/dev/null || true
   ```

3. Create fresh `docs/sprints/next-sprint/` directory:
   ```bash
   mkdir -p docs/sprints/next-sprint
   ```

---

### Phase 7: Publish to Sprint Report Branch

Rebase the `sprint-report` branch from the main branch and push so AWS Amplify auto-deploys
the updated dashboard. The `sprint-report` branch is the long-lived branch from which the
sprint demo is presented — it accumulates the state of all completed sprints.

1. Verify the dashboard files are in place:
   - `docs/sprints/sprints-overview/index.html` exists
   - `docs/sprints/sprints-overview/manifest.json` exists and is valid JSON
   - `docs/sprints/sprints-overview/md-viewer.html` exists

2. Determine the main branch name:
   ```bash
   git remote show origin | sed -n 's/.*HEAD branch: //p'
   ```
   Use the result (typically `main` or `master`) as `<main-branch>` below.

3. Create or rebase the `sprint-report` branch:

   **If `sprint-report` does not exist locally or on remote:**
   ```bash
   git branch sprint-report <main-branch>
   ```

   **If `sprint-report` already exists:**
   ```bash
   git checkout sprint-report
   git rebase <main-branch>
   ```

   If the rebase has conflicts, abort and report to the user — do not force-resolve.

4. Push to remote:
   ```bash
   git push origin sprint-report --force-with-lease
   git checkout -
   ```

5. Confirm the push succeeded. If it fails (e.g., no remote, auth issue), warn the user
   but do not fail the entire sprint-complete pipeline — the local artifacts are still valid.

---

### Phase 8: Commit and Report

1. Stage all changes on the current branch:
   ```bash
   git add docs/sprints/ docs/delivery/
   ```

2. Ask the user for confirmation before committing:

   > **Ready to commit sprint completion artifacts.**
   >
   > Changes:
   > - Sprint archived to `docs/sprints/sprint-N/`
   > - Delivery logs moved to archive
   > - Dashboard updated (`manifest.json`)
   > - Sprint summary generated
   > - Fresh `docs/sprints/next-sprint/` created
   >
   > Create commit?

3. If confirmed, commit:
   ```bash
   git commit -m "Close sprint-N: [1-line summary of delivered UCs]"
   ```

4. Report to user:

   > **Sprint N completed!**
   >
   > **Delivered:**
   > - UC-XXX: [name]
   > - UC-YYY: [name]
   >
   > **GitHub Issues Closed:** #42, #43
   >
   > **Dashboard:** `docs/sprints/sprints-overview/index.html`
   > **Published:** Force-pushed to `sprint-report` branch (Amplify will deploy)
   >
   > **Summary:** `docs/sprints/sprint-N/SUMMARY.md`
   >
   > **Next steps:**
   > - Present the dashboard to stakeholders for sprint demo
   > - Run `/sprint-prepare` to plan the next sprint

## Folder Structure After Completion

```
docs/
├── sprints/
│   ├── sprints-overview/
│   │   ├── index.html          # Dashboard (cumulative, all sprints)
│   │   ├── manifest.json       # Updated: sprint-N status = delivered
│   │   └── md-viewer.html      # Markdown renderer
│   ├── sprint-1/
│   │   ├── readiness-report.md
│   │   ├── changelog.md
│   │   ├── refinement-proposal.md
│   │   ├── SUMMARY.md
│   │   └── delivery/
│   │       ├── UC-001-iterations.md
│   │       └── UC-001-traceability.md
│   ├── sprint-2/
│   │   ├── ...
│   └── next-sprint/             # Fresh, empty, ready for next sprint
├── delivery/                    # Cleared of completed sprint's artifacts
├── use_cases/                   # Specs remain in place (referenced by dashboard)
└── designs/                     # Designs remain in place (referenced by dashboard)
```
