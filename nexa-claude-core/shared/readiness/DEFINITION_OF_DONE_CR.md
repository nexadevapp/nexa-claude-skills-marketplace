# Definition of Done — Change Request

## Instructions

After implementing a change request, validate the implementation against the checklist below.
Re-read the CR from `docs/change_requests/` and cross-check every item against the code.
If any item fails, report all failures to the user and **stop** — do not proceed to
post-implementation tracking until the user either fixes the issues or explicitly waives them.

## Checklist

### Change Completeness

- [ ] **Delta implemented** — Every item in the Requested Change section is implemented
- [ ] **Acceptance criteria met** — All acceptance criteria in the CR are satisfied
- [ ] **All affected layers updated** — Every checked layer (UI, API, DB, logic) has been updated

### E2E Tests

- [ ] **Existing tests updated** — All tests listed as "Update" in E2E Test Impact have been modified
- [ ] **New tests added** — All tests listed as "Add" in E2E Test Impact have been created
- [ ] **Removed tests deleted** — All tests listed as "Remove" in E2E Test Impact have been deleted
- [ ] **Dual annotation applied** — Every updated or new E2E test carries both `@UC-XXX` and `@CR-XXX`

### Regression

- [ ] **Existing tests pass** — All pre-existing tests still pass
- [ ] **No unintended side effects** — The change does not break behavior outside the CR scope
- [ ] **Original UC behavior preserved** — Behavior specified in the referenced use case that is
  NOT part of this CR's delta is unchanged

### Code Quality

- [ ] **Build succeeds** — Build completes without errors
- [ ] **No lint issues** — No lint errors or warnings
- [ ] **Conventions followed** — Code follows existing codebase patterns and conventions
- [ ] **Minimal change** — Only code required by the CR is modified; no unrelated cleanup included

### Live Documentation

- [ ] **Requirements doc updated** — The affected requirement entry in `docs/requirements.md` is
  revised to reflect the new desired behavior (not the old behavior the CR replaced)
- [ ] **Use case amended** — An `## Amendments` section is appended to the referenced UC file
  listing this CR with a one-line summary of what changed. The UC scenario body is not modified.
- [ ] **CR status set to Done** — The `Status` field in `docs/change_requests/CR-XXX.md` is
  updated from `Implemented` to `Done` once all live documentation gates above are satisfied

### Privacy

- [ ] **No hard-coded secrets** — No API keys, passwords, or secrets hard-coded in source files
- [ ] **Secrets externalized** — Secrets are stored using the stack's standard mechanism
- [ ] **Sensitive files ignored** — Sensitive files are listed in `.gitignore`
