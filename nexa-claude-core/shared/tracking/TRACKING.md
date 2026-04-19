# Implementation Tracking via GitHub Issues

## Instructions

Before and after implementing a use case, technical task, or bug fix, perform the tracking steps below using the `gh` CLI.
This ensures every use case (`UC-XXX`), technical task (`TT-XXX`), and bug (`BUG-XXX`) is tracked as a GitHub issue and stays in sync with the specification.

## Git Rules

- Always run `git pull` before starting any task to ensure the local branch is up to date.
- Never create merge commits. Keep a linear Git history.

## Before Implementation

1. Pull the latest changes: `git pull`
2. Read the specification:
   - For **UC-XXX**: Read from `docs/use_cases/`
   - For **TT-XXX**: Read from `docs/technical_tasks/`
   - For **BUG-XXX**: Read from `docs/bugs/`
3. Compute a hash of the spec file content: `md5 -q <spec-file>` (macOS) or `md5sum <spec-file>` (Linux)
4. Build the absolute spec URL for the issue body:
   ```
   REPO_URL=$(gh repo view --json url -q .url)
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)
   SPEC_URL="${REPO_URL}/blob/${DEFAULT_BRANCH}/<relative-path-to-spec>"
   ```
5. Search for an existing GitHub issue:
   - `gh issue list --search "in:title <id>" --state all` (where `<id>` is `UC-XXX`, `TT-XXX`, or `BUG-XXX`)
6. If no issue exists, create one:
   - Title: `<id>: <name>` (e.g., `UC-003: Place Order` or `TT-001: Set Up Dev Profile`)
   - Body format for **UC-XXX**:
     ```
     ## <use-case-id>: <use-case-name>

     <brief description from the spec>

     **Actors:** <actors from the spec>

     **Acceptance criteria:**
     - [ ] <derived from main success scenario and key alternative flows>

     **Spec:** [`<relative-path-to-spec>`](<SPEC_URL>)

     <!-- spec-hash: <computed-hash> -->
     ```
   - Body format for **TT-XXX**:
     ```
     ## <task-id>: <task-name>

     <goal from the spec>

     **Category:** <category from the spec>

     **Acceptance criteria:**
     - [ ] <copied from the spec's acceptance criteria>

     **Spec:** [`<relative-path-to-spec>`](<SPEC_URL>)

     <!-- spec-hash: <computed-hash> -->
     ```
   - Body format for **BUG-XXX**:
     ```
     ## <bug-id>: <title>

     <description from the bug report>

     **Severity:** <severity from the bug report>
     **Discovered In:** <discovered in from the bug report>

     **Acceptance criteria:**
     - [ ] Actual behavior resolved
     - [ ] Expected behavior achieved
     - [ ] Regression test added

     **Spec:** [`<relative-path-to-spec>`](<SPEC_URL>)

     <!-- spec-hash: <computed-hash> -->
     ```
   - `gh issue create --title "<id>: <name>" --body "<body>"`
7. If a **closed** issue already exists, ask the user:
   - **Reopen** the existing issue (for rework or bug fix)
   - **Create a new** issue (for a fresh implementation)
   Then proceed based on their answer.
8. If an open issue already exists, check for drift:
   - Extract the hash from the issue body: look for `<!-- spec-hash: <hash> -->`
   - If the hash differs from the current spec hash, update the issue body with fresh acceptance criteria and the new hash
   - If the hash matches, no update needed

## After Implementation

1. Re-read the use case specification and the implementation
2. On the existing GitHub issue, check off acceptance criteria that are now satisfied
3. Add a comment summarizing what was implemented:
   - `gh issue comment <issue-number> --body "Implemented: <brief summary of what was done>"`
4. If all acceptance criteria and definition-of-done items are checked, close the issue:
   - `gh issue close <issue-number>`
5. If not all items are checked, leave the issue open and inform the user what remains
6. Commit the implementation using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) with the ID in the scope:
   - **UC** → `feat(UC-XXX): <description>`
   - **TT** → `chore(TT-XXX): <description>`
   - **BUG** → `fix(BUG-XXX): <description>`
   - XXX is always 3 digits, zero-padded
   - Examples: `feat(UC-003): implement place order page and API`, `chore(TT-001): set up dev profile with seed data`, `fix(BUG-003): fix discount code not applied to order total`
   - Always use the ID from the specification (e.g., `UC-001`, `TT-012`, `BUG-003`)
