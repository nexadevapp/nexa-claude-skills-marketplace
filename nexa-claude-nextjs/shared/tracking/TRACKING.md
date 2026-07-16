# Implementation Tracking via GitHub Issues

## Instructions

Before and after implementing a use case, technical task, bug fix, or change request, perform the tracking steps below using the `gh` CLI.
Every use case (`UC-XXX`), technical task (`TT-XXX`), bug (`BUG-XXX`), and change request (`CR-XXX`) is tracked as a GitHub issue.

The specification file in `docs/` is the single source of truth. The GitHub issue is a **thin pointer** to it — a one-line summary plus a link to the spec. The issue body never copies the spec's description, actors, or acceptance criteria, so there is nothing to keep in sync.

## Git Rules

- Always run `git pull` before starting any task to ensure the local branch is up to date.
- Never create merge commits. Keep a linear Git history.

## Re-Read Before Write

Gate and log files that accumulate a running record via read-modify-write appends (e.g.
`docs/delivery/*-iterations.md`) may in future be written by more than one agent within the
same pipeline run. Before appending to such a file, re-read its current contents immediately
beforehand — do not rely on a copy read earlier in the run. This is a low-cost guard against a
lost update if two writes ever interleave; it does not apply to strictly sequential
single-writer steps, and it does not apply to GitHub issue comments, which are atomic appends
with no existing content to lose.

## Before Implementation

1. Pull the latest changes: `git pull`
2. Read the specification:
   - For **UC-XXX**: Read from `docs/use_cases/`
   - For **TT-XXX**: Read from `docs/technical_tasks/`
   - For **BUG-XXX**: Read from `docs/bugs/`
   - For **CR-XXX**: Read from `docs/change_requests/`
3. Build the absolute spec URL for the issue body:
   ```
   REPO_URL=$(gh repo view --json url -q .url)
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)
   SPEC_URL="${REPO_URL}/blob/${DEFAULT_BRANCH}/<relative-path-to-spec>"
   ```
4. Search for an existing GitHub issue:
   - `gh issue list --search "in:title <id>" --state all` (where `<id>` is `UC-XXX`, `TT-XXX`, `BUG-XXX`, or `CR-XXX`)
5. If no issue exists, create a thin-pointer issue:
   - Title: `<id>: <name>` (e.g., `UC-003: Place Order` or `TT-001: Set Up Dev Profile`)
   - Body (all ticket types) — a one-line summary drawn from the spec plus the spec link:
     ```
     <one-line summary from the spec>

     **Spec:** [`<relative-path-to-spec>`](<SPEC_URL>)
     ```
   - For **BUG-XXX** only, append the fields a triager needs without opening the file, and the native cross-link to the parent use case:
     ```
     **Severity:** <severity from the bug report>
     **Relates to:** <UC-XXX from the bug report's Related Artifacts>
     ```
     If the referenced use case already has a GitHub issue, append its number so GitHub renders the backlink on both issues — look it up with `gh issue list --search "in:title <UC-XXX>"` and write `**Relates to:** <UC-XXX> #<uc-issue-number>`.
   - `gh issue create --title "<id>: <name>" --body "<body>"`
6. If a **closed** issue already exists, ask the user:
   - **Reopen** the existing issue (for rework or bug fix)
   - **Create a new** issue (for a fresh implementation)
   Then proceed based on their answer.
7. If an open issue already exists, no update is needed — the body is a pointer to the spec, which stays current on its own.
8. **Bug origin (BUG-XXX only):**
   The bug report's **Origin** field records where the bug was born:
   - `human-in-the-loop` — the bug `.md` is the source of truth; create the issue as in step 5.
   - a GitHub issue URL — the issue already exists and is where discussion lives; do not create a new one. Ensure the two point at each other: the bug `.md`'s **GitHub Issue** field holds the issue URL, and the issue links back to the bug `.md` (add the `**Spec:**` line via `gh issue comment` if it is missing). There is no content to reconcile.

## After Implementation

1. Re-read the use case specification and the implementation
2. **Update the Status field** in the specification document to reflect completion:
   - For **UC-XXX** (`docs/use_cases/UC-XXX.md`): Set `Status` to `Implemented`
     (evaluation is still pending — the UC pipeline will advance it to `Done` upon successful evaluation)
   - For **TT-XXX** (`docs/technical_tasks/TT-XXX.md`): Set `Status` to `Done`
   - For **BUG-XXX** (`docs/bugs/BUG-XXX.md`): Set `Status` to `Fixed`
   - For **CR-XXX** (`docs/change_requests/CR-XXX.md`): Set `Status` to `Implemented`
     (live doc updates and evaluation still pending — status advances to `Done` once those are complete)
3. Add a comment summarizing what was implemented:
   - `gh issue comment <issue-number> --body "Implemented: <brief summary of what was done>"`
4. If the Definition of Done is satisfied, close the issue:
   - `gh issue close <issue-number>`
5. If the Definition of Done is not yet satisfied, leave the issue open and inform the user what remains
6. Commit the implementation using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) with the ID in the scope:
   - **UC** → `feat(UC-XXX): <description>`
   - **TT** → `chore(TT-XXX): <description>`
   - **BUG** → `fix(BUG-XXX): <description>`
   - **CR** → `feat(CR-XXX): <description>`
   - XXX is always 3 digits, zero-padded
   - Examples: `feat(UC-003): implement place order page and API`, `chore(TT-001): set up dev profile with seed data`, `fix(BUG-003): fix discount code not applied to order total`, `feat(CR-001): replace role field with department dropdown`
   - Always use the ID from the specification (e.g., `UC-001`, `TT-012`, `BUG-003`, `CR-001`)
