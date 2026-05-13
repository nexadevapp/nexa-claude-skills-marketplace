---
name: audit
description: >
  Runs a comprehensive implementation audit for a delivered use case. Checks Definition of Done,
  i18n completeness and correctness, error message i18n, accessibility, visual fidelity against
  the design, and loading/error states. Run after /deliver-use-case or before /sprint-complete
  for a quality deep-dive. Results are advisory — Critical and Major findings should be fixed;
  Minor findings are observations.
context: fork
---

# Implementation Audit

## Instructions

Audit the implementation of $ARGUMENTS (a use case ID like `UC-XXX`) against its specification,
design, and quality standards. This is an independent quality review intended to catch issues
that unit and E2E tests do not surface.

Run the lenses below sequentially. Collect all findings before producing the final report.

## Inputs

| Input | Location |
|-------|----------|
| Use case specification | `docs/use_cases/$ARGUMENTS.md` |
| Frontend design | `docs/designs/$ARGUMENTS-design.html` |
| Entity model | `docs/entity_model.md` |
| Definition of Done | `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_DONE.md` |
| i18n config | `i18n/config.ts` (supported locales) |
| Message files | `messages/*.json` (one per locale) |

## DO NOT

- Modify any implementation files — this is a read-only audit
- Flag issues already verified by passing E2E tests unless the test assertion itself is wrong
- Suggest architectural changes beyond what the spec requires

## i18n Detection

Before running Lenses 1–3, check whether the project uses i18n:
- Look for `<!-- NEXA_I18N_CONFIGURED -->` in the project's `CLAUDE.md`, or
- Check for a `messages/` or `i18n/` directory

If none found, mark Lenses 1–3 as **N/A** and skip them.

## Lenses

---

### Lens 0: Definition of Done (file analysis — no browser)

Read the Definition of Done checklist. For every item, independently verify whether the
implementation satisfies it by reading the code, spec, and entity model.

For each item, report:
1. The item name
2. **PASS** or **FAIL** with evidence (file paths, line numbers, observations)
3. If FAIL: what is missing or incorrect

Key verification points:
- **Task Completeness** — Cross-reference every MSS step, alternative flow, business rule,
  precondition, and postcondition from the spec against the code
- **Acceptance Criteria** — Check the GitHub issue for $ARGUMENTS; verify each criterion is satisfiable
- **Code Quality** — Run `npx next build`; verify input validation at system boundaries;
  verify error states surface meaningful feedback
- **Test Coverage** — Verify unit tests exist for business logic, MSS, alternative flows,
  and business rules
- **Privacy** — Search for hardcoded secrets; verify `.gitignore` covers sensitive files
- **i18n** — Only check if i18n is detected (see i18n Detection above); otherwise mark N/A
- **Configuration Management** — Verify environment profiles exist

---

### Lens 1: i18n Completeness (file analysis — no browser) — skip if no i18n

Identify every user-facing string introduced or modified for $ARGUMENTS:
1. Verify each uses a translation function (`t('key')`, `getTranslations`, `useTranslations`),
   not a hardcoded literal. Search `.tsx` and `.ts` files for:
   - JSX text content not wrapped in a translation call
   - String literals in UI props (`placeholder`, `title`, `aria-label`, `alt`) that are not keys
   - Hardcoded validation error and toast messages
2. Verify every translation key exists in **all** locale files under `messages/`
3. Flag keys missing from non-default locales
4. Flag keys with a `[TRANSLATE]` prefix (placeholder not yet translated)

---

### Lens 2: i18n Correctness (file analysis — no browser) — skip if no i18n

For every translation key used by $ARGUMENTS, compare values across all locales:
1. Verify placeholders (`{name}`, `{count}`) match across locales — same names, same count
2. Verify pluralization rules for each locale (if `{count}` used, check `one`/`other` forms)
3. Flag translations that appear machine-translated or identical to the default locale
4. Flag translations where meaning clearly diverges from the default

---

### Lens 3: Error Message i18n (file analysis — no browser) — skip if no i18n

Search all implementation files for $ARGUMENTS and identify every error-handling path:
- `catch` blocks displaying messages to the user
- `error.tsx` boundary components
- Form validation errors (client-side zod and server-side)
- Toast/notification error messages
- API route error responses surfaced to the UI

For each, verify the message uses a translation key, not a hardcoded string. Hardcoded strings
like `"Something went wrong"`, `"Invalid input"`, or `"Please try again"` are findings.

---

### Lens 4: Accessibility (Playwright MCP — browser required)

Start the dev server if not running (`npm run dev`). For each screen in the frontend design:
1. Navigate using `browser_navigate`
2. Run axe-core via `browser_evaluate`:
   ```javascript
   await import('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js');
   return axe.run();
   ```
3. Collect all violations with impact level (critical, serious, moderate, minor)
4. Additionally check:
   - Every `<img>` has a non-empty `alt` (or `alt=""` with `role="presentation"` for decorative)
   - Every form input has `<label>` or `aria-label`
   - Focus order is logical (tab through with `browser_press_key`)
   - Color contrast meets WCAG AA (axe-core covers this, but flag if axe is unavailable)

---

### Lens 5: Screen Fidelity vs Design (Playwright MCP — browser required)

For each screen in the frontend design:
1. Open the design HTML in the browser (`browser_navigate` to the file path)
2. Take a snapshot (`browser_snapshot`)
3. Navigate to the implemented screen in the running app
4. Take a snapshot
5. Compare and flag:
   - Missing components (in design, absent in implementation)
   - Layout deviations (arrangement, alignment, spacing)
   - Typography mismatches (headings, font sizes, font weights)
   - Color mismatches (background, text, border)
   - Missing states (design specifies an empty state that implementation doesn't handle)

---

### Lens 6: Loading and Error States (Playwright MCP — browser required)

For each screen that performs async operations (data fetching, form submissions):
1. Navigate to the screen
2. Verify `loading.tsx` or a loading skeleton exists and renders
3. Verify `error.tsx` boundary exists for the route segment
4. Verify data screens handle the empty state (no data → meaningful message, not a blank page)

---

### Lens 7: E2E Traceability (file analysis — no browser)

Skip if `e2e/helpers/traced.ts` does not exist (project has not adopted the
traceability helper yet).

Otherwise, for every spec under `e2e/**/*.spec.ts`:

1. **Build the ignore set.** If `e2e/.tracedignore` exists, parse it as a
   gitignore-style list (one path per line, `#` comments, blank lines skipped)
   and exclude matching specs from the rest of the lens.

2. **Check imports.** Read each remaining spec and verify it imports at least
   one of `uc`, `meta`, or `bug` from a `./helpers/traced` path (relative forms
   like `'./helpers/traced'` or `'../helpers/traced'` are both fine). `test`
   and `expect` imported from `@playwright/test` are expected and required —
   they are not violations.

3. **Check `test.describe(...)` calls.** Every UC group is declared with
   `test.describe('UC-NNN: ...', uc('UC-NNN'), () => { ... })`. A
   `test.describe(...)` call whose second arg is not a `uc('UC-NNN')` literal
   (e.g., raw `{ tag: [...] }`, or only two args — title and body) is a
   violation. Lift it to `uc()` so the UC doc is validated at registration.

4. **Check `test(...)` calls.** Walk every `test('...', ..., async (...) => ...)`
   call in the file (excluding framework hooks like `test.beforeAll`,
   `test.afterEach`, `test.afterAll`). Each one must pass a `meta(...)` or
   `bug(...)` call as its second argument:
   - Inside a `test.describe('UC-NNN: ...', uc('UC-NNN'), () => { ... })`
     body, each `test()` must use `meta('UC-NNN', { scenario, verifies?, fixes? })`,
     with the first arg matching the enclosing describe's UC id.
   - At module scope (outside any `test.describe()`), each `test()` must use
     `bug('BUG-NNN')`.
   A `test()` call whose second arg is a plain object literal, a non-helper
   function call, or absent is a violation.

5. **Check references.** For every `uc('UC-NNN')`, `meta('UC-NNN', { scenario: '...', verifies: ['CR-NNN', ...], fixes: ['BUG-NNN', ...] })`,
   and `bug('BUG-NNN')` literal: confirm the referenced doc exists under
   `docs/use_cases/`, `docs/change_requests/`, or `docs/bugs/`. The helper
   enforces this at runtime; the audit catches it before a test run.

6. **Check the spec for a `BUG-NNN` referenced in `fixes:` or via `bug()`.**
   If the bug file shows a status of `RESOLVED` (or equivalent), this is
   correct. If the status is still `OPEN`, the test is guarding against a
   regression of an unfixed bug — flag as Minor and ask whether the bug should
   be marked resolved.

For each violation, report file path, line number, and the specific rule
broken. Severity: **Major** during rollout (advisory). Once one full sprint
has been delivered cleanly under the helper, escalate to **Critical** and have
the audit fail sprint completion.

---

## Output Format

Produce one section per lens. For each finding:
- **Severity:** Critical / Major / Minor
- **Location:** file path and line number (or screen name for browser lenses)
- **Finding:** what is wrong
- **Fix:** how to fix it

**Severity guide:**
- **Critical** — DoD item FAIL, user sees broken/untranslated text, app crashes, WCAG A violation
- **Major** — Missing translation in non-default locale, WCAG AA violation, missing error state,
  missing unit tests for a business rule or alternative flow
- **Minor** — Placeholder not yet translated, minor style deviation, missing decorative alt text

End with a summary:
- Total findings by severity
- Verdict: **PASS** (0 Critical, 0 Major) | **PASS WITH OBSERVATIONS** (0 Critical, Minor only) | **FAIL** (any Critical or Major)
