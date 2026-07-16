---
name: sprint-complete
description: >
  Completes the current sprint by validating all use cases are delivered, running an E2E
  regression gate, closing GitHub issues, generating a sprint summary, updating the sprints
  overview dashboard, archiving the sprint folder, and creating a pull request from the
  sprint branch to main. The PR body contains the sprint report. Use when the user asks to
  "complete the sprint", "close the sprint", "finish the sprint", "wrap up the sprint", or
  mentions sprint completion, sprint close, or sprint demo preparation.
user_invocable: true
arguments: none
---

# Sprint Complete

## Instructions

Complete the current sprint by validating delivery, running the E2E regression gate,
closing GitHub issues, generating a summary report, updating the project dashboard,
archiving sprint artifacts, and creating a pull request to merge the sprint branch
into `main`.

The PR serves as the formal release gate — E2E tests run in GitHub Actions on the PR,
and a formal code review must be completed before merging. Merging the PR to `main` is
the release / sprint demo moment.

## Prerequisites

- Sprint has been delivered (`/sprint-deliver` completed for all use cases in scope)
- The application builds successfully (`npx next build`)
- `docs/sprints/next-sprint/readiness-report.md` exists
- Currently on a `sprint-<N>` branch (created by `/sprint-kickoff`)

If any prerequisite fails, stop and report which prerequisite is not met.

## DO NOT

- Modify specification or design documents
- Skip the E2E regression gate when E2E tests exist
- Fix bugs or implementation issues — the sprint is done, this is closing time
- Skip the GitHub issue closure step
- Archive without generating the summary first
- Create a git commit on the current branch without user confirmation
- Create the PR without user confirmation
- **Sleep or wait between test retries** — when `npx playwright test` fails, present options to the user immediately. Never use `sleep`, `setTimeout`, or any delay before re-running. The fix-then-rerun cycle must be immediate — no pauses of any duration

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

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

### Phase 2: E2E Regression Gate

Run the full Playwright E2E suite as a regression check before closing the sprint. This
ensures that bug fixes, technical tasks, and any other changes introduced during the sprint
have not broken existing functionality — even in sprints that only contain bug fixes and
have no new use case deliveries.

1. Check whether E2E tests exist:
   - Look for files matching `e2e/**/*.spec.ts`
   - If no test files exist, skip this phase entirely and note "No E2E tests found — regression
     gate skipped" (this will be included in the sprint summary)

2. Verify Docker is running (required for Testcontainers database):
   ```bash
   docker info > /dev/null 2>&1
   ```
   If Docker is not running, ask the user to start Docker or Colima before continuing.
   Wait for confirmation, then re-check before proceeding.

3. Run the full E2E suite:
   ```bash
   npx playwright test
   ```
   **Critical rules** (same as `/deliver-use-case`):
   - NO filters: no `--grep`, `--grep-invert`, `--project` subset
   - Must show `0 failed`, `0 skipped`, **exit code 0** to pass

4. If all tests pass:
   - Record the result: total tests, passed count, duration
   - Proceed to Phase 3

5. If any tests fail:
   - Display the failure summary to the user
   - Classify each failure:
     - **Regression from bug fix** — a fix introduced in this sprint broke an existing test
     - **Flaky test** — test passes on re-run without code changes
     - **Pre-existing failure** — test was already failing before this sprint
   - Present options:

     > **E2E Regression Gate — FAILED**
     >
     > | Test | Classification | Details |
     > |------|---------------|---------|
     > | [test name] | [type] | [brief reason] |
     >
     > **Options:**
     > 1. Fix and re-run — address the failures, then re-run the suite
     > 2. Complete anyway — proceed with failures noted in the sprint summary
     > 3. Cancel — stop sprint completion
     >
     > What would you like to do?

   - **Option 1**: The user fixes the issue (or asks you to), then re-run from step 3.
     Allow up to 3 re-runs. After 3 failures, only options 2 and 3 remain.
   - **Option 2**: Record failures in the sprint summary as known regressions and proceed.
   - **Option 3**: Stop the pipeline.

---

### Phase 3: Close GitHub Issues

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

### Phase 4: Determine Sprint Number

1. Read the sprint number from the current branch name:
   ```bash
   git branch --show-current
   ```
   - Expected format: `sprint-<N>` (e.g., `sprint-3`)
   - Extract N from the branch name
   - If the current branch does not match `sprint-<N>`, stop and report:
     "Not on a sprint branch. Expected `sprint-<N>` branch (created by `/sprint-kickoff`)."

---

### Phase 5: Generate Sprint Summary

Gather information and generate the summary:

1. **Delivered UCs**: List from iteration logs with iteration counts
2. **Traceability**: Read `docs/delivery/<UC-ID>-traceability.md` for each delivered UC
   to count verified requirements
3. **E2E regression**: Record result from Phase 2 (passed/failed/skipped, test counts, failures)
4. **Issues encountered**: Extract from iteration logs (retries, blockers, failures)
5. **Sprint duration**: From git log — first and last commit touching sprint artifacts
6. **Audit results**: Read `docs/delivery/sprint-audit-report.md` if it exists (optional —
   may not be present since sprint-audit is no longer part of the pipeline)

Write `docs/sprints/next-sprint/SUMMARY.md` using the template in
[REFERENCE.md](REFERENCE.md#sprint-summary-template).

---

### Phase 6: Update Sprints Overview Dashboard

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
     (since the folder will be renamed in Phase 7):
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

### Phase 7: Archive the Sprint

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

### Phase 8: Commit Sprint Artifacts

1. Stage all changes on the sprint branch:
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
   git commit -m "chore(sprint-N): close — [1-line summary of delivered UCs]"
   ```

4. Push to remote:
   ```bash
   git push origin sprint-<N>
   ```

---

### Phase 9: Create Pull Request

Create a PR from `sprint-<N>` → `main`. The sprint report becomes the PR body so that
reviewers see the full sprint summary, and GitHub Actions runs E2E tests on the PR.

1. Read the generated `docs/sprints/sprint-N/SUMMARY.md` to use as the PR body content.

2. Ask the user for confirmation:

   > **Ready to create the sprint PR.**
   >
   > - From: `sprint-<N>`
   > - To: `main`
   > - Title: `Sprint N: [1-line summary]`
   > - Body: Sprint summary report
   >
   > Create the pull request?

3. If confirmed, create the PR:
   ```bash
   gh pr create --base main --head sprint-<N> \
     --title "Sprint N: [1-line summary of delivered UCs]" \
     --body "<sprint summary content from SUMMARY.md>"
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
   > **Pull Request:** [PR URL]
   >
   > **Dashboard:** `docs/sprints/sprints-overview/index.html`
   >
   > **Summary:** `docs/sprints/sprint-N/SUMMARY.md`
   >
   > **Next steps:**
   > 1. GitHub Actions will run E2E tests on the PR
   > 2. Perform a formal code review on the PR
   > 3. Merge the PR to `main` — this is the release
   > 4. Present the dashboard to stakeholders for sprint demo
   > 5. Run `/sprint-prepare` to plan the next sprint

## Folder Structure After Completion

See [REFERENCE.md](REFERENCE.md#folder-structure-after-completion) for the full directory
layout produced by Phases 6–7.
