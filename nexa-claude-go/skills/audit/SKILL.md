---
name: audit
description: >
  Runs a comprehensive implementation audit for a delivered use case in a Go web application.
  Checks Definition of Done, i18n completeness and correctness, error message i18n,
  accessibility, visual fidelity against the design, htmx loading/error/empty states, and E2E
  traceability. Run after /deliver-use-case or before /merge-use-case for a quality deep-dive.
  Use when the user asks to "audit UC-XXX", "run a quality audit", "check accessibility",
  "check translations", or mentions a deep quality review. Results are advisory — Critical and
  Major findings should be fixed; Minor findings are observations.
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
| i18n package | `internal/i18n/i18n.go` (supported locales, `T`, `TN`, `Locale`) |
| Message catalogs | `internal/i18n/locales/*.toml` (one per locale) |

## DO NOT

- Modify any implementation files — this is a read-only audit
- Scan generated code (`*_templ.go`, `internal/db/`) — audit the `.templ`, `.sql`, and hand-written `.go` sources
- Flag issues already verified by passing E2E tests unless the test assertion itself is wrong
- Suggest architectural changes beyond what the spec requires

## i18n Detection

Before running Lenses 1–3, check whether the project uses i18n:
- Look for `<!-- NEXA_I18N_CONFIGURED -->` in the project's `CLAUDE.md`, or
- Check for an `internal/i18n/` directory, or `github.com/nicksnyder/go-i18n` in `go.mod`

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
  precondition, and postcondition from the spec against the handlers, services, and views
- **Acceptance Criteria** — Read the acceptance criteria from the spec file (`docs/use_cases/UC-XXX.md`) for $ARGUMENTS; verify each criterion is satisfiable
- **Code Quality** — Run `go tool templ generate && sqlc generate && go build ./... && go vet ./...`;
  verify form `Validate()` runs on every mutation at the system boundary; verify error states
  surface meaningful feedback
- **Test Coverage** — Verify unit tests exist next to the code, as `/implement` prescribes:
  `form_test.go` (validation rules), `service_test.go` (business rules, returned errors),
  `handler_test.go` (status codes, `422`, fragment vs full page, redirects), `views_test.go`
  (empty-state and error text). Every MSS step, alternative flow, and business rule is asserted
- **Privacy** — Search for hardcoded secrets; verify `.gitignore` covers `.env` and `.env.*`
- **i18n** — Only check if i18n is detected (see i18n Detection above); otherwise mark N/A
- **Configuration Management** — Verify environment profiles (`.env`, `.env.dev`) and
  `internal/config/config.go` exist

---

### Lens 1: i18n Completeness (file analysis — no browser) — skip if no i18n

Identify every user-facing string introduced or modified for $ARGUMENTS:
1. Verify each goes through `i18n.T(ctx, ...)` or `i18n.TN(ctx, ...)`, not a hardcoded literal.
   Search the feature's `.templ` and `.go` files for:
   - Text nodes in `.templ` files not wrapped in `{ i18n.T(ctx, "...") }`
   - Attribute literals (`placeholder`, `title`, `aria-label`, `alt`, `value` on buttons) that
     do not go through `i18n.T`
   - Literal messages returned by `Validate()` — with i18n configured, `Validate()` returns
     field → message ID and the view translates it
   - `http.Error` bodies and error fragments rendered to the user
2. Verify every message ID used exists in **all** catalogs under `internal/i18n/locales/`
3. Flag IDs missing from non-default locales
4. Flag values with a `[TRANSLATE]` prefix (placeholder not yet translated)

---

### Lens 2: i18n Correctness (file analysis — no browser) — skip if no i18n

For every message ID used by $ARGUMENTS, compare values across all catalogs:
1. Verify template placeholders (`{{.Min}}`, `{{.Name}}`) match across locales — same names,
   same count — and match the data passed at the `T` / `TN` call site
2. Verify plural messages (used with `TN`) define every CLDR form the locale needs — `one` and
   `other` everywhere, plus `few` / `many` where the locale requires them (e.g. `ro`, `pl`, `ru`)
3. Flag translations that appear machine-translated or identical to the default locale
4. Flag translations where meaning clearly diverges from the default

---

### Lens 3: Error Message i18n (file analysis — no browser) — skip if no i18n

Search all implementation files for $ARGUMENTS and identify every error-handling path:
- Handler error mapping — not found → `404`, forbidden → `403`, anything else → `500`
- `422` form re-renders with field errors and the non-field error summary
- htmx error fragments
- The `Recover` middleware's `500` response
- The `401` + `HX-Redirect` and `403` responses from `internal/auth`

For each, verify the message shown to the user uses a message ID, not a hardcoded string.
Hardcoded strings like `"Something went wrong"`, `"Invalid input"`, or `"Please try again"` are
findings. Log messages written with `slog` are not user-facing — do not flag them.

---

### Lens 4: Accessibility (Playwright MCP — browser required)

Start the app if not running: `set -a; . ./.env; set +a; go run ./cmd/dev`. For each screen in
the frontend design:
1. Navigate using `browser_navigate`
2. Run axe-core. The app's CSP (`script-src 'self'`, set by `/setup-web-middleware`) blocks
   importing axe-core from a CDN inside `browser_evaluate`. Inject it from the Node side with
   `browser_run_code_unsafe` instead:
   ```javascript
   async (page) => {
     const src = await (await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js')).text();
     await page.evaluate(src);
     return await page.evaluate(() => axe.run());
   }
   ```
3. Collect all violations with impact level (critical, serious, moderate, minor)
4. Additionally check:
   - Every `<img>` has a non-empty `alt` (or `alt=""` with `role="presentation"` for decorative)
   - Every form input has `<label for>` or `aria-label`
   - Focus order is logical (tab through with `browser_press_key`)
   - Focus lands somewhere sensible after an htmx swap (e.g. the first field error)
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

### Lens 6: Loading, Error, and Empty States (file analysis + Playwright MCP)

For each screen that performs async operations (htmx requests, form submissions):
1. Verify every triggering element has `hx-indicator`, and `internal/web/static/app.css` defines
   the `.htmx-indicator` rules (htmx's inline indicator styles are disabled by the CSP setup)
2. Verify the layout's `htmx-config` `responseHandling` swaps `422`, so re-rendered forms with
   validation errors actually appear
3. Submit invalid input in the browser: field errors appear next to their inputs, and non-field
   errors appear in a summary
4. Verify data screens render an explicit empty-state component (no rows → meaningful message,
   not a blank page)
5. Navigate to a missing resource (e.g. `/items/does-not-exist`): the app responds `404` with a
   page, not a `500` or a blank body
6. Verify a `5xx` on an htmx request shows the user something (an error fragment, a swapped
   error target, or an `htmx:responseError` handler in a static `.js` file) rather than silently
   doing nothing

---

### Lens 7: E2E Traceability (file analysis — no browser)

Skip if `e2e/trace_test.go` does not exist (project has not adopted the traceability helper
yet).

Otherwise, for every file `e2e/*_test.go` except `trace_test.go` and `setup_test.go`:

1. **Build the ignore set.** If `e2e/.tracedignore` exists, parse it as a gitignore-style list
   (one path per line, `#` comments, blank lines skipped) and exclude matching files from the
   rest of the lens.

2. **Check top-level test names.** Every top-level `func TestXxx(t *testing.T)` (excluding
   `TestMain`) is named `TestUC<NNN>` or `TestBUG<NNN>`. Any other name is a violation.

3. **Check `TestUC<NNN>` subtests.** Every `t.Run("<scenario>/<journey>", ...)` inside
   `TestUC<NNN>` starts with `useCase(t, "UC-NNN", "<scenario>", refs...)`, where:
   - the `UC-NNN` argument matches the enclosing test name (`TestUC007` → `"UC-007"`)
   - the scenario argument is `MSS`, `AF-N`, or `EX-N` and matches the `t.Run` name prefix
   A subtest whose first statement is not `useCase(...)`, or whose arguments disagree with the
   test or subtest name, is a violation.

4. **Check `TestBUG<NNN>` tests.** The first statement is `bug(t, "BUG-NNN")` with the ID
   matching the test name.

5. **Check references.** For every `useCase(t, "UC-NNN", scenario, "CR-NNN", "BUG-NNN", ...)`
   and `bug(t, "BUG-NNN")` literal: confirm the referenced doc exists under `docs/use_cases/`,
   `docs/change_requests/`, or `docs/bugs/`. The helper enforces this at runtime; the audit
   catches it before a test run.

6. **Check the status of each referenced `BUG-NNN`.** If the bug file shows a status of
   `RESOLVED` (or equivalent), this is correct. If the status is still `OPEN`, the test is
   guarding against a regression of an unfixed bug — flag as Minor and ask whether the bug
   should be marked resolved.

For each violation, report file path, line number, and the specific rule broken. Severity:
**Major** during rollout (advisory). Once one full cluster has been delivered cleanly under the
helper, escalate to **Critical** and have the audit fail the merge gate.

---

## Output Format

Produce one section per lens. For each finding:
- **Severity:** Critical / Major / Minor
- **Location:** file path and line number (or screen name for browser lenses)
- **Finding:** what is wrong
- **Fix:** how to fix it

**Severity guide:**
- **Critical** — DoD item FAIL, user sees broken/untranslated text, app crashes or panics, WCAG A violation
- **Major** — Missing translation in non-default locale, WCAG AA violation, missing error state,
  missing unit tests for a business rule or alternative flow
- **Minor** — Placeholder not yet translated, minor style deviation, missing decorative alt text

## Verification

The audit is complete when:
- Every lens has a section marked with findings, **no findings**, or **N/A** with the reason
- Every finding has severity, location, finding, and fix
- The report ends with a summary:
  - Total findings by severity
  - Verdict: **PASS** (no findings) | **PASS WITH OBSERVATIONS** (0 Critical, Minor only) | **FAIL** (any Critical or Major)
