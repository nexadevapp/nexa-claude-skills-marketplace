---
name: generate-wireframe
description: >
  Generates a low-fidelity wireframe as a single-page HTML file showing all screens,
  their spatial layout, and navigation flow. The wireframe establishes screen structure,
  component placement, and information hierarchy without visual identity — colors, fonts,
  and theming are added later by /design-screens. Supports incremental updates: new screens
  can be added without destroying existing sections. Use when the user asks to "create a
  wireframe", "generate a wireframe", "sketch the screens", "layout the UI", or mentions
  wireframe, screen layout, UI skeleton, or low-fidelity mockup.
---

# Generate Wireframe

## Instructions

Create or update the project wireframe at `docs/wireframes/index.html`. The wireframe is a
single-page HTML document that shows every user-facing screen as a low-fidelity layout —
boxes, labels, placeholder content, and navigation links. It bridges the use case diagram
(what the system does) and the screen designs (how it looks).

$ARGUMENTS is optional. If provided, it is a space-separated list of use case IDs
(e.g., `UC-001 UC-002 UC-003`) to add to an existing wireframe. If omitted, generate
screens for all user-facing use cases in the project.

## Purpose

The wireframe serves four downstream consumers:

1. **`/engineer-requirements`** — The wireframe is a required input. Screen layouts, navigation
   flows, form fields, and data visibility inform the RE's probing questions, exception path
   analysis, and CRUD coverage checks. Without the wireframe, requirements engineering operates
   on abstractions disconnected from how users will actually interact with the system.
2. **`/design-screens`** — Opens the wireframe in Playwright, extracts the visual language
   (layout patterns, spacing, component types), and produces high-fidelity themed HTML per
   use case. The wireframe's structure directly shapes the design output.
3. **Human review** — Stakeholders review the wireframe to validate screen flow, information
   hierarchy, and navigation before visual design begins. This is the cheapest place to catch
   UX problems.
4. **`/sprint-prepare`** — Can trigger wireframe generation for new use cases added during
   sprint refinement, ensuring the wireframe stays current as the project evolves.

## Design Philosophy

**Low-fidelity intentionally.** The wireframe communicates *structure*, not *style*:

- **Grayscale only** — No brand colors. Use shades of gray (`#f5f5f5`, `#e0e0e0`, `#9e9e9e`,
  `#616161`, `#333333`, `#1a1a1a`) to distinguish hierarchy levels.
- **System fonts only** — Use `system-ui, -apple-system, sans-serif`. No Google Fonts, no
  custom typography. Visual identity comes later in `/design-screens`.
- **Boxes and labels** — Show where components go, not what they look like. A card is a
  bordered rectangle with a label. A chart is a placeholder box that says "Chart: Monthly Revenue".
- **Real content, not lorem ipsum** — Use realistic placeholder data that matches entity model
  attributes (e.g., "Maria Popescu", "maria@example.com", not "Lorem ipsum dolor").
- **Navigation is explicit** — Every clickable element that navigates to another screen uses
  an anchor link (`#UC-XXX`) so the wireframe is internally navigable.

## Inputs

| Input | Location | Required |
|-------|----------|----------|
| Use case diagram | `docs/use_cases.puml` | Yes |
| Requirements | `docs/requirements.md` | Yes |
| Entity model | `docs/entity_model.md` | Yes |
| Use case specifications | `docs/use_cases/UC-XXX.md` | If they exist |
| Existing wireframe | `docs/wireframes/index.html` | If updating |

## Output

A single HTML file: `docs/wireframes/index.html`

**CRITICAL: The output MUST be an `.html` file written with the Write tool. Do NOT produce
Markdown. The file extension MUST be `.html` and the content MUST start with `<!DOCTYPE html>`.**

## Internationalization (i18n)

When the project uses internationalization, all placeholder text in the wireframe MUST use
**correct, native-quality text** for the project's primary locale — including every diacritical
mark and accent required by the language.

### Locale detection

Check these sources in order:
1. i18n configuration files (e.g., `next-intl` config, `i18n.ts`, `middleware.ts` locale list)
2. Translation files in `messages/` or `locales/` directories
3. Use case specifications (which may contain localized text)
4. If no locale information is found, default to `lang="en"`

Set the `lang` attribute on `<html>` to match the detected locale.

### Rules

- **Never approximate accented characters.** Use exact Unicode characters (e.g., Romanian:
  ă, â, î, ș (U+0219), ț (U+021B) — never ş (cedilla) or t̜).
- **All visible UI text** — labels, buttons, placeholders, headings, menu items — must be
  written in the project's primary locale with correct accents.
- **Use realistic localized placeholder data** — names, addresses, and content appropriate
  for the locale (e.g., Romanian names for a Romanian app, not anglicized names).

## DO NOT

- Add colors, brand identity, or visual styling beyond grayscale structure
- Use Google Fonts or custom typography — system fonts only
- Use lorem ipsum — use realistic placeholder content from the entity model
- Use any JavaScript framework (no React, no Vue, no Angular)
- Create separate files per screen — everything goes in one `index.html`
- Design screens for use cases that have no user-facing interaction (background jobs, system
  triggers with no UI)
- Invent screens that have no basis in the use case diagram or requirements
- Destroy existing wireframe sections when adding new ones (incremental updates)
- Over-design — this is a structural sketch, not a finished design
- Add responsive breakpoints or mobile layouts — that is `/design-screens`' responsibility
- Strip or approximate diacritics/accents — all UI text must use correct Unicode characters

## Workflow

### Phase 1 — Gather Context

1. Read `docs/use_cases.puml` — extract all use case IDs, names, actors, and relationships
   (includes/extends/dependencies). This is the canonical list.
2. Read `docs/requirements.md` — understand functional requirements and their priorities.
3. Read `docs/entity_model.md` — understand entities, attributes, and relationships. These
   inform the data fields shown on each screen.
4. Read any existing use case specifications in `docs/use_cases/` — these provide detailed
   screen flows (Main Success Scenario steps) that inform component placement.
5. **Detect the project locale** following the Internationalization rules above.
6. If $ARGUMENTS is provided, filter to only those use case IDs. Otherwise, include all
   user-facing use cases.
7. If `docs/wireframes/index.html` already exists, read it to understand the current state.

### Phase 2 — Determine Screen Inventory

For each use case in scope, determine the screen(s) it needs:

1. **Use case specs exist** — derive screens from the Main Success Scenario steps. Each
   distinct "System displays..." step typically implies a screen or screen state.
2. **Use case specs do not exist** — derive screens from the requirements and use case
   diagram. Use the use case name and mapped functional requirements to infer the primary
   screen. Simple CRUD use cases typically need a list screen and a form screen.

Build a screen inventory table:

| UC ID | Screen Name | Screen Type | Key Components | Navigation From | Navigation To |
|-------|-------------|-------------|----------------|-----------------|---------------|
| UC-001 | Registration | Form | name, email, password fields, submit button | Landing (UC-000) | Verify Email (UC-001A) |
| UC-002 | Dashboard | Data display | stats cards, activity table, quick actions | Login (UC-001B) | Profile (UC-003), Reports (UC-004) |

Screen types: **Form**, **List/Table**, **Detail view**, **Dashboard**, **Wizard** (multi-step),
**Modal/Dialog**, **Settings**, **Landing page**

### Phase 3 — Generate the Wireframe HTML

Using the **Write** tool, create `docs/wireframes/index.html` following the HTML structure
below. If updating an existing wireframe, read it first and merge new screens into the
existing document — preserving all existing screen sections.

#### Incremental Update Rules

When adding screens to an existing wireframe:

1. Read the existing `docs/wireframes/index.html`.
2. Identify which screen sections already exist (by their `id="UC-XXX"` anchors).
3. **Preserve all existing sections unchanged** — do not modify their content or structure.
4. Add new screen sections after the last existing screen section and before the Navigation
   Map section.
5. Update the Table of Contents to include the new screens.
6. Update the Navigation Map to include the new screens and their connections.

### Phase 4 — Verify

1. Confirm the file exists at `docs/wireframes/index.html`.
2. Verify every in-scope use case has a corresponding screen section.
3. Verify all internal anchor links (`#UC-XXX`) resolve to existing sections.
4. Verify the Navigation Map includes all screens and their connections.

## HTML Structure

The wireframe must follow this structure. Study the example in `examples/` for a complete
reference implementation.

```html
<!DOCTYPE html>
<html lang="[project locale]">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Project Name] — Wireframe</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.5;
    }

    /* ── Wireframe Chrome ── */
    .wf-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .wf-header { text-align: center; padding: 2rem 0; border-bottom: 2px solid #333; margin-bottom: 2rem; }
    .wf-header h1 { font-size: 1.75rem; font-weight: 700; color: #1a1a1a; }
    .wf-header p { color: #616161; margin-top: 0.5rem; }

    /* ── Table of Contents ── */
    .wf-toc { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
    .wf-toc h2 { font-size: 1.1rem; margin-bottom: 1rem; color: #1a1a1a; }
    .wf-toc ul { list-style: none; columns: 2; }
    .wf-toc li { padding: 0.25rem 0; }
    .wf-toc a { color: #1a1a1a; text-decoration: none; border-bottom: 1px dashed #9e9e9e; }
    .wf-toc a:hover { border-bottom-style: solid; }
    .wf-toc .wf-toc-actor { color: #9e9e9e; font-size: 0.85rem; }

    /* ── Screen Section ── */
    .wf-screen-section {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 2rem; margin-bottom: 2rem;
    }
    .wf-screen-header {
      display: flex; justify-content: space-between; align-items: baseline;
      border-bottom: 1px solid #e0e0e0; padding-bottom: 1rem; margin-bottom: 1.5rem;
    }
    .wf-screen-header h2 { font-size: 1.3rem; color: #1a1a1a; }
    .wf-screen-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: #9e9e9e; }
    .wf-screen-meta span { background: #f5f5f5; padding: 0.2rem 0.6rem; border-radius: 4px; }

    /* ── Wireframe Components ── */
    .wf-viewport {
      background: #fafafa; border: 2px dashed #e0e0e0; border-radius: 8px;
      padding: 1.5rem; min-height: 400px;
    }
    .wf-navbar {
      display: flex; justify-content: space-between; align-items: center;
      background: #1a1a1a; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px;
      margin-bottom: 1rem;
    }
    .wf-navbar-logo { font-weight: 700; font-size: 1.1rem; }
    .wf-navbar-links { display: flex; gap: 1rem; }
    .wf-navbar-links a { color: #e0e0e0; text-decoration: none; font-size: 0.9rem; }
    .wf-sidebar {
      background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px;
      padding: 1rem; min-width: 200px;
    }
    .wf-sidebar-item {
      padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.9rem;
      cursor: default; margin-bottom: 0.25rem;
    }
    .wf-sidebar-item.active { background: #e0e0e0; font-weight: 600; }
    .wf-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 6px;
      padding: 1rem; margin-bottom: 0.75rem;
    }
    .wf-card-title { font-weight: 600; margin-bottom: 0.5rem; }
    .wf-btn {
      display: inline-block; padding: 0.5rem 1.25rem; border-radius: 6px;
      font-size: 0.9rem; font-weight: 500; cursor: default; text-decoration: none;
    }
    .wf-btn-primary { background: #333; color: #fff; }
    .wf-btn-secondary { background: #fff; border: 1px solid #9e9e9e; color: #333; }
    .wf-input {
      display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e0e0e0;
      border-radius: 6px; background: #fff; font-size: 0.9rem; color: #9e9e9e;
      margin-bottom: 0.75rem;
    }
    .wf-label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem; color: #616161; }
    .wf-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .wf-table th { text-align: left; padding: 0.5rem; background: #f5f5f5; border-bottom: 2px solid #e0e0e0; font-weight: 600; }
    .wf-table td { padding: 0.5rem; border-bottom: 1px solid #e0e0e0; }
    .wf-placeholder {
      background: #f5f5f5; border: 2px dashed #e0e0e0; border-radius: 6px;
      padding: 2rem; text-align: center; color: #9e9e9e; font-size: 0.9rem;
    }
    .wf-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .wf-stat-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 1rem; text-align: center; }
    .wf-stat-value { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; }
    .wf-stat-label { font-size: 0.8rem; color: #9e9e9e; margin-top: 0.25rem; }
    .wf-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: 500; }
    .wf-badge-dark { background: #333; color: #fff; }
    .wf-badge-light { background: #e0e0e0; color: #616161; }
    .wf-divider { border: none; border-top: 1px solid #e0e0e0; margin: 1.5rem 0; }

    /* ── Screen Annotations ── */
    .wf-annotation {
      background: #fffde7; border-left: 3px solid #fbc02d; padding: 0.75rem 1rem;
      font-size: 0.85rem; color: #616161; margin-bottom: 1rem; border-radius: 0 4px 4px 0;
    }
    .wf-annotation strong { color: #333; }

    /* ── Navigation Map ── */
    .wf-nav-map {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 2rem; margin-bottom: 2rem;
    }
    .wf-nav-map h2 { font-size: 1.3rem; margin-bottom: 1.5rem; color: #1a1a1a; }
    .wf-nav-flow {
      display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
      margin-bottom: 0.75rem;
    }
    .wf-nav-node {
      background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px;
      padding: 0.4rem 0.8rem; font-size: 0.85rem;
    }
    .wf-nav-node a { color: #1a1a1a; text-decoration: none; }
    .wf-nav-arrow { color: #9e9e9e; font-size: 0.85rem; }
  </style>
</head>
<body>

<div class="wf-container">

  <!-- ============================================================ -->
  <!-- HEADER -->
  <!-- ============================================================ -->
  <div class="wf-header">
    <h1>[Project Name] — Wireframe</h1>
    <p>[Brief project description] | [N] screens | Actors: [actor list]</p>
  </div>

  <!-- ============================================================ -->
  <!-- TABLE OF CONTENTS -->
  <!-- ============================================================ -->
  <div class="wf-toc">
    <h2>Screens</h2>
    <ul>
      <li><a href="#UC-XXX">UC-XXX: [Screen Name]</a> <span class="wf-toc-actor">[Actor]</span></li>
      <!-- Repeat for each screen -->
    </ul>
  </div>

  <!-- ============================================================ -->
  <!-- SCREEN: UC-XXX — [Screen Name] -->
  <!-- ============================================================ -->
  <div class="wf-screen-section" id="UC-XXX">
    <div class="wf-screen-header">
      <h2>UC-XXX: [Screen Name]</h2>
      <div class="wf-screen-meta">
        <span>Actor: [Primary Actor]</span>
        <span>Type: [Form | List | Dashboard | Detail | Wizard | Settings]</span>
        <span>Route: /[suggested-route]</span>
      </div>
    </div>

    <div class="wf-annotation">
      <strong>Purpose:</strong> [What this screen accomplishes — derived from use case goal]
    </div>

    <div class="wf-viewport">
      <!-- Screen layout using wireframe components -->
      <!-- Use .wf-navbar, .wf-sidebar, .wf-card, .wf-btn, .wf-input, .wf-table, etc. -->
    </div>

    <div class="wf-annotation">
      <strong>Navigation:</strong> Navigates to <a href="#UC-YYY">UC-YYY: [Screen Name]</a>
      on [action]. Returns to <a href="#UC-ZZZ">UC-ZZZ: [Screen Name]</a> on cancel.
    </div>
  </div>
  <!-- Repeat for each screen -->

  <!-- ============================================================ -->
  <!-- NAVIGATION MAP -->
  <!-- ============================================================ -->
  <div class="wf-nav-map">
    <h2>Navigation Map</h2>

    <!-- Show primary navigation flows as sequences -->
    <div class="wf-nav-flow">
      <div class="wf-nav-node"><a href="#UC-XXX">UC-XXX: [Name]</a></div>
      <span class="wf-nav-arrow">&rarr;</span>
      <div class="wf-nav-node"><a href="#UC-YYY">UC-YYY: [Name]</a></div>
      <span class="wf-nav-arrow">&rarr;</span>
      <div class="wf-nav-node"><a href="#UC-ZZZ">UC-ZZZ: [Name]</a></div>
    </div>
    <!-- Repeat for each navigation flow -->
  </div>

</div>

</body>
</html>
```

## Component Library Reference

Use these CSS classes to build screen layouts. Each component represents a structural
pattern — **not a styled element**. The grayscale appearance is intentional.

| Component | Class | Use For |
|-----------|-------|---------|
| Top navigation bar | `.wf-navbar` | App-level navigation with logo and links |
| Sidebar navigation | `.wf-sidebar` + `.wf-sidebar-item` | Section navigation, menu panels |
| Content card | `.wf-card` + `.wf-card-title` | Grouping related content |
| Primary button | `.wf-btn.wf-btn-primary` | Main actions (submit, save, create) |
| Secondary button | `.wf-btn.wf-btn-secondary` | Cancel, back, secondary actions |
| Text input | `.wf-input` | Form fields — use `placeholder` for hint text |
| Field label | `.wf-label` | Labels above inputs |
| Data table | `.wf-table` | Tabular data with headers |
| Placeholder box | `.wf-placeholder` | Charts, images, maps, or content not yet defined |
| Stats grid | `.wf-stats-grid` + `.wf-stat-card` | Dashboard KPI cards |
| Badge | `.wf-badge` (`.wf-badge-dark` / `.wf-badge-light`) | Status indicators, tags |
| Divider | `.wf-divider` | Horizontal section separator |
| Annotation | `.wf-annotation` | Design notes visible in the wireframe |
| Screen viewport | `.wf-viewport` | Container for the actual screen layout |

### Layout Patterns

Use standard CSS for layout within `.wf-viewport`:

```html
<!-- Two-column layout (sidebar + content) -->
<div style="display: grid; grid-template-columns: 220px 1fr; gap: 1.5rem;">
  <div class="wf-sidebar">...</div>
  <div><!-- Main content --></div>
</div>

<!-- Form layout -->
<div style="max-width: 480px; margin: 0 auto;">
  <label class="wf-label">Email</label>
  <input class="wf-input" placeholder="maria@example.com">
  <label class="wf-label">Password</label>
  <input class="wf-input" placeholder="********">
  <button class="wf-btn wf-btn-primary" style="width: 100%; margin-top: 1rem;">Sign In</button>
</div>

<!-- Dashboard grid -->
<div class="wf-stats-grid">
  <div class="wf-stat-card">
    <div class="wf-stat-value">128</div>
    <div class="wf-stat-label">Total Users</div>
  </div>
  <!-- More stat cards -->
</div>
```

## Screen Derivation Rules

When deciding what screens to create for each use case:

### Use cases WITH specifications

Parse the Main Success Scenario. Each step that says "System displays..." or "System shows..."
implies a screen or significant screen state. Steps like "User enters..." tell you which
form fields belong on that screen.

Example:
- Step 1: "User selects 'New Reservation'" → **Button on a list or dashboard screen**
- Step 2: "System displays the reservation form" → **Form screen**
- Step 5: "System displays available rooms" → **Same form screen, results section**
- Step 9: "System displays confirmation" → **Confirmation/success state on the form screen**

Combine closely related steps into one screen. Do not create a separate screen for every step.

### Use cases WITHOUT specifications

Infer the minimum screen set from the use case type:

| Use Case Pattern | Screens |
|-----------------|---------|
| Create/Register | One form screen |
| List + View | List screen with a row that links to a detail screen |
| CRUD entity | List screen + Create/Edit form (can be same screen or modal) |
| Dashboard/Overview | Single dashboard screen with cards and tables |
| Multi-step process | Wizard screen with step indicators |
| Search/Filter | List screen with filter controls at top |
| Settings/Profile | Form screen with sections |
| Approval/Review | Detail screen with action buttons (approve/reject) |

## Shared Layout Consistency

All screens that share the same actor and context should have a consistent layout frame:

- **Same navbar** — If multiple screens share a navigation bar, use the same `.wf-navbar`
  structure with the same links across those screens. Highlight the active link.
- **Same sidebar** — If the app has sidebar navigation, show it consistently with the
  active item highlighted.
- **Consistent placement** — Buttons in the same position, tables with the same column
  patterns, forms with the same field layout conventions.

This consistency is essential because `/design-screens` will derive the shared layout
from the wireframe. Inconsistent wireframes produce inconsistent designs.
