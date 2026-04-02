---
name: sprint-audit
description: >
  Runs cross-cutting quality checks across all use cases delivered in a sprint: unused i18n
  keys, cross-screen visual consistency, auth guard coverage, responsive breakpoints,
  navigation flow, and dead code. Produces a structured report for a fixer agent. Use when
  the user asks to "audit the sprint", "run sprint review", "check sprint quality",
  "validate the sprint", or mentions sprint audit, sprint review, or cross-cutting checks.
---

# Sprint Audit

## Instructions

Audit all use cases delivered in the current sprint by running cross-cutting quality checks
that span the entire application. These checks cannot run per use case — they require the
full sprint to be delivered first.

$ARGUMENTS is optional. If provided, it is a comma-separated list of use case IDs to scope
the audit (e.g., `UC-001,UC-002,UC-003`). If omitted, the audit covers all use cases
delivered in the current sprint.

## Prerequisites

- All use cases in scope have been delivered via `/deliver-use-case`
- The application builds successfully (`npx next build`)
- All existing tests pass (`npx vitest run` and `npx playwright test`)
- Docker is running (required for Testcontainers and Playwright)

If any prerequisite fails, stop and report which prerequisite is not met.

## DO NOT

- Modify specification or design documents
- Create or modify E2E test files (that is the Playwright test skill's job)
- Skip any lens without checking its skip condition
- Fix issues directly — this skill only produces a report. A separate fixer agent applies fixes
- Run more than the specified iterations per lens

## Identifying Sprint Scope

If $ARGUMENTS is not provided, determine which use cases were delivered in the current sprint:

1. Read `docs/delivery/` directory — each `*-iterations.md` file corresponds to a delivered use case
2. Check git log for recent `/deliver-use-case` completions
3. Read any sprint planning document in `docs/` (e.g., sprint backlog, sprint plan)

Present the identified scope to the user for confirmation before proceeding:

> **Sprint Audit Scope:**
>
> The following use cases will be audited:
> - UC-XXX: [name]
> - UC-YYY: [name]
>
> Should I proceed?

Wait for confirmation.

## Audit Lenses

Run these lenses **sequentially**. Each lens produces a section of the final report.

---

### Lens 1: Unused i18n Keys (file analysis — no browser)

**Skip if** the project does not use internationalization (no `messages/` directory).

Identify translation keys that exist in message files but are never referenced in code:

1. Read all message files under `messages/` and extract every translation key (including
   nested keys like `common.save`, `auth.loginTitle`).
2. For each key, search the codebase (`app/`, `components/`, `lib/`, `src/`) for references:
   - Direct usage: `t('key')`, `t('namespace.key')`
   - Namespace usage: `getTranslations('namespace')` combined with `t('key')` in the same file
   - Dynamic keys: `t(variable)` — flag these as unchecked (cannot statically verify)
3. Report keys that have **zero references** across the codebase as unused.
4. Group findings by namespace for clarity.

**Severity:** Minor (unused keys are dead weight, not broken functionality).

---

### Lens 2: Cross-Screen Visual Consistency (Playwright MCP — browser required)

Check that screens delivered in this sprint maintain consistent styling:

1. Start the dev server if not running (`npm run dev`).
2. For each delivered use case, identify all screens from the design artifact
   (`docs/designs/$UC-design.html`).
3. Navigate to each screen using Playwright MCP tools and take a snapshot (`browser_snapshot`).
4. Compare across screens and flag:
   - **Inconsistent typography** — headings, body text, or labels use different font sizes,
     weights, or families across screens
   - **Inconsistent spacing** — padding, margins, or gaps differ between similar components
     (e.g., form fields on one screen vs another)
   - **Inconsistent color usage** — primary buttons use different colors, backgrounds vary
     without design justification
   - **Inconsistent component patterns** — similar UI elements (tables, cards, modals, forms)
     look or behave differently across screens
   - **Inconsistent empty/loading/error states** — some screens show skeletons while others
     show spinners, or some show empty states while others show blank areas
5. For each finding, identify both screens being compared.

**Severity:**
- Major — component patterns or color usage are inconsistent (user-facing confusion)
- Minor — spacing or font-weight differences in secondary elements

---

### Lens 3: Auth Guard Coverage (Playwright MCP — browser required)

Verify that every protected route redirects unauthenticated users:

1. Read the middleware file to identify which route patterns require authentication.
2. Read all `page.tsx` files under `app/[locale]/` (or `app/`) to build a route map.
3. For each route that should be protected:
   - Open a **new browser context with no session** (no cookies, no auth state).
   - Navigate to the route using `browser_navigate`.
   - Verify the response: the user should be redirected to the login page or see an
     unauthorized error. The route must NOT render its content to an unauthenticated user.
4. Also check the inverse: public routes (login, register, landing page) should be
   accessible without authentication.

**Severity:**
- Critical — a protected route renders content to an unauthenticated user
- Minor — a public route unnecessarily redirects to login

---

### Lens 4: Responsive Breakpoints (Playwright MCP — browser required)

Check that all screens render correctly at standard viewport sizes:

1. Define the viewport sizes to test:
   - Mobile: 375x667 (iPhone SE)
   - Tablet: 768x1024 (iPad)
   - Desktop: 1280x800 (standard laptop)
2. For each delivered use case, identify the main screens from the design artifact.
3. For each screen, at each viewport size:
   - Resize the browser using `browser_resize`.
   - Take a snapshot (`browser_snapshot`).
   - Check for:
     - **Horizontal overflow** — content extends beyond the viewport, causing horizontal scroll
     - **Overlapping elements** — text or components overlap each other
     - **Broken layout** — flex/grid items collapse or stack incorrectly
     - **Unreadable text** — text is too small to read at the viewport size
     - **Inaccessible interactions** — buttons or links are too small to tap on mobile,
       or are hidden off-screen
     - **Missing responsive behavior** — a table that should become a card list on mobile
       but doesn't, or a sidebar that should collapse but doesn't

**Severity:**
- Critical — horizontal overflow or overlapping elements that break the layout
- Major — unreadable text or inaccessible interactions on mobile
- Minor — spacing tweaks or non-ideal stacking that doesn't break usability

---

### Lens 5: Navigation Flow (Playwright MCP — browser required)

Walk through the application as a user to verify all navigation paths work:

1. Start from the application entry point (e.g., `/` or `/dashboard` after login).
2. Build a navigation graph by:
   - Taking a snapshot of each screen (`browser_snapshot`)
   - Identifying all clickable navigation elements (links, buttons, menu items, breadcrumbs)
   - Clicking each one and recording where it leads
3. For each navigation path, verify:
   - **No dead links** — every link resolves to a real page (not a 404 or error)
   - **No dead ends** — every screen has a way to navigate back or to another section
     (no screens that trap the user)
   - **Breadcrumbs consistency** — if breadcrumbs exist, they reflect the correct hierarchy
   - **Active state** — the current page is highlighted in the navigation menu
   - **Back navigation** — the browser back button returns to the expected previous screen
4. Also check:
   - **Cross-UC navigation** — if UC-001 links to a screen from UC-002, that link works
   - **Post-action redirects** — after form submissions, the redirect goes to the correct
     destination (not a stale or wrong page)

**Severity:**
- Critical — dead link (404) or dead end (user is stuck)
- Major — back navigation goes to wrong page, or cross-UC link is broken
- Minor — missing active state in nav, breadcrumb inconsistency

---

### Lens 6: Dead Code (file analysis — no browser)

Identify code introduced in the sprint that is unreachable or unused:

1. Identify all files created or modified in the sprint scope (use `git diff` against the
   branch point or compare with the main branch).
2. For each new export (function, component, constant, type) introduced:
   - Search the codebase for imports or references to that export.
   - Flag exports with **zero references** outside their own file.
3. For each new file introduced:
   - Check if the file is imported anywhere.
   - For `page.tsx` and `route.ts` files, these are entry points (not dead code).
   - For components, utilities, and helpers — flag if never imported.
4. Check for:
   - **Unused imports** — modules imported but never referenced in the file
   - **Unused variables** — variables declared but never read (the build should catch most
     of these, but check for `_` prefixed variables that suppress warnings)
   - **Commented-out code blocks** — large blocks of commented code introduced in the sprint

**Severity:**
- Major — unused component or utility file (entire file is dead weight)
- Minor — unused export within an otherwise active file, commented-out code

---

## Output Format

Produce a single structured report:

```markdown
# Sprint Audit Report

## Summary

| Lens                          | Findings | Critical | Major | Minor |
|-------------------------------|----------|----------|-------|-------|
| Unused i18n Keys              | N        | 0        | 0     | N     |
| Cross-Screen Visual Consistency | N      | 0        | N     | N     |
| Auth Guard Coverage           | N        | N        | 0     | N     |
| Responsive Breakpoints        | N        | N        | N     | N     |
| Navigation Flow               | N        | N        | N     | N     |
| Dead Code                     | N        | 0        | N     | N     |
| **Total**                     | **N**    | **N**    | **N** | **N** |

**Verdict:** PASS | PASS WITH OBSERVATIONS | FAIL

## Lens 1: Unused i18n Keys

[Findings or "No findings."]

## Lens 2: Cross-Screen Visual Consistency

[Findings or "No findings."]

## Lens 3: Auth Guard Coverage

[Findings or "No findings."]

## Lens 4: Responsive Breakpoints

[Findings or "No findings."]

## Lens 5: Navigation Flow

[Findings or "No findings."]

## Lens 6: Dead Code

[Findings or "No findings."]

## Recommendations

[Prioritized list of fixes, grouped by severity. Each recommendation includes:]
- **Finding reference:** Lens N, Finding N
- **Priority:** Critical > Major > Minor
- **Fix description:** what to change and where
- **Estimated scope:** single file / multi-file / cross-cutting
```

**Verdict criteria:**
- **PASS** — 0 Critical, 0 Major findings
- **PASS WITH OBSERVATIONS** — 0 Critical, Minor findings only
- **FAIL** — any Critical or Major findings

## Report Delivery

### File Output

Save the report to `docs/delivery/sprint-audit-report.md`. If a previous report exists,
archive it by renaming to `sprint-audit-report-YYYY-MM-DD.md` before writing the new one.

### GitHub Issue

Post the report summary as a new GitHub issue:

1. Create the issue:
   ```
   gh issue create --title "Sprint Audit Report — [date]" --body "<report>" --label "quality"
   ```
   If the `quality` label does not exist, create it first:
   ```
   gh label create quality --description "Quality audit findings" --color "0E8A16"
   ```
2. The issue body must include:
   - The full summary table
   - The verdict
   - The recommendations section
   - A footer: `Generated by /sprint-audit`

### Handoff to Fixer

After the report is delivered, inform the user:

> **Sprint Audit Complete — Verdict: [PASS/FAIL/PASS WITH OBSERVATIONS]**
>
> Report saved to `docs/delivery/sprint-audit-report.md` and posted as GitHub issue #N.
>
> [If FAIL or PASS WITH OBSERVATIONS:]
> To fix the findings, run `/implement` with the audit report as context:
>
> ```
> /implement BUG-XXX-sprint-audit-fixes
> ```
>
> Or create a technical task from the findings:
> ```
> /technical-task TT-XXX-sprint-audit-fixes
> ```
