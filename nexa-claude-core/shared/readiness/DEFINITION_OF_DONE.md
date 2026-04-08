# Definition of Done

## Instructions

After implementing a use case, validate the implementation against the checklist below.
Re-read the use case specification from `docs/use_cases/` and cross-check every item against the code.
If any item fails, report all failures to the user and **stop** — do not proceed to post-implementation
tracking until the user either fixes the issues or explicitly waives the failing items.

## Checklist

### Task Completeness

- [ ] **Main Success Scenario coverage** — Every Main Success Scenario step has a corresponding implementation
- [ ] **Alternative Flows handled** — Every Alternative Flow is handled (error states, branching logic, edge cases)
- [ ] **Business Rules enforced** — Every Business Rule is enforced at the appropriate layer
- [ ] **Preconditions validated** — Preconditions are validated where applicable
- [ ] **Postconditions reachable** — Both success and failure postconditions are reachable through the implementation

### Acceptance Criteria

- [ ] **Tracking issue criteria met** — All acceptance criteria on the GitHub tracking issue are satisfiable
- [ ] **Spec fidelity** — No specified behavior is missing; no undocumented behavior is added

### Code Quality

- [ ] **Build succeeds** — Build completes without errors
- [ ] **No lint issues** — No lint errors or warnings
- [ ] **Conventions followed** — Code follows existing codebase patterns and conventions
- [ ] **Input validated** — Input is validated at system boundaries (user input, API requests)
- [ ] **Error feedback** — Error states surface meaningful feedback to the user

### Test Coverage

- [ ] **Unit tests exist** — Unit tests exist for new/modified business logic
- [ ] **Unit tests pass** — All unit tests pass
- [ ] **Main Success Scenario integration tested** — Main Success Scenario is covered by integration tests
- [ ] **Alternative Flows integration tested** — Alternative Flows are covered by integration tests
- [ ] **Business Rules unit tested** — Business Rule enforcement is covered by unit tests

### Privacy

- [ ] **No hard-coded secrets** — No API keys, passwords, or secrets hard-coded in source files
- [ ] **Secrets externalized** — Secrets are stored using the stack's standard mechanism (e.g., environment variables, secret managers)
- [ ] **Sensitive files ignored** — Sensitive files (`.env`, `.env.local`, credentials) are listed in `.gitignore`

### Internationalization

Always check whether the project uses internationalization — look for translation/message files,
i18n configuration, locale directories, translation function imports, locale-based routing, or
i18n libraries in `package.json`. If the project uses i18n:

- [ ] **No hardcoded user-facing strings** — Every user-facing string in new or modified components, pages, server actions, and API route handlers uses the project's translation pattern, not a hardcoded literal
- [ ] **Translation keys added to all locales** — Every new translation key exists in all locale files, following the project's existing file structure and conventions
- [ ] **Namespace structure maintained** — New keys are organized consistently with the existing message file structure
- [ ] **Localized navigation used** — If the project provides localized navigation utilities, new code uses them instead of raw framework imports

### Configuration Management

- [ ] **Environment profiles exist** — Environment-specific configuration exists for dev and prod using the stack's profile mechanism (Spring profiles, `.env.development`/`.env.production`)
- [ ] **Secrets differ per environment** — Secret values differ between environments (no shared keys across dev and prod)
