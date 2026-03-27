# Definition of Done — Bug Fix

## Instructions

After implementing a bug fix, validate the fix against the checklist below.
Re-read the bug report from `docs/bugs/` and cross-check every item against
the code. If any item fails, report all failures to the user and **stop** — do not proceed to
post-implementation tracking until the user either fixes the issues or explicitly waives the failing items.

## Checklist

### Fix Completeness

- [ ] **Actual behavior resolved** — The actual (buggy) behavior described in the report no longer occurs
- [ ] **Expected behavior achieved** — The expected behavior described in the report is now observed
- [ ] **Reproduction steps verified** — Following the Steps to Reproduce now produces the expected behavior

### Regression

- [ ] **Existing tests pass** — All pre-existing tests still pass
- [ ] **No unintended side effects** — The fix does not break existing functionality
- [ ] **Regression test added** — A test exists that would catch this bug if it were reintroduced

### Code Quality

- [ ] **Build succeeds** — Build completes without errors
- [ ] **No lint issues** — No lint errors or warnings
- [ ] **Conventions followed** — Code follows existing codebase patterns and conventions
- [ ] **Minimal change** — The fix is scoped to the defect; no unrelated changes are included

### Privacy

- [ ] **No hard-coded secrets** — No API keys, passwords, or secrets hard-coded in source files
- [ ] **Secrets externalized** — Secrets are stored using the stack's standard mechanism (e.g., environment variables, secret managers)
- [ ] **Sensitive files ignored** — Sensitive files (`.env`, `.env.local`, credentials) are listed in `.gitignore`
