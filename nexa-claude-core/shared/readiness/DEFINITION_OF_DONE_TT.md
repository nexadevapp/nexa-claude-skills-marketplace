# Definition of Done — Technical Task

## Instructions

After implementing a technical task, validate the implementation against the checklist below.
Re-read the technical task specification from `docs/technical_tasks/` and cross-check every item against
the code. If any item fails, report all failures to the user and **stop** — do not proceed to
post-implementation tracking until the user either fixes the issues or explicitly waives the failing items.

## Checklist

### Task Completeness

- [ ] **All acceptance criteria met** — Every acceptance criterion from the spec is satisfied
- [ ] **Affected areas updated** — All listed affected areas have been addressed

### Code Quality

- [ ] **Build succeeds** — Build completes without errors
- [ ] **No lint issues** — No lint errors or warnings
- [ ] **Conventions followed** — Code follows existing codebase patterns and conventions

### Regression

- [ ] **Existing tests pass** — All pre-existing tests still pass
- [ ] **No unintended side effects** — Changes do not break existing functionality

### Privacy

- [ ] **No hard-coded secrets** — No API keys, passwords, or secrets hard-coded in source files
- [ ] **Secrets externalized** — Secrets are stored using the stack's standard mechanism (e.g., environment variables, secret managers)
- [ ] **Sensitive files ignored** — Sensitive files (`.env`, `.env.local`, credentials) are listed in `.gitignore`
