---
name: generate-wireframe
description: >
  Generates a high-quality wireframe as a single-page HTML file showing all screens,
  their spatial layout, and navigation flow. The wireframe establishes screen structure,
  component placement, and information hierarchy with production-grade visual design
  powered by the frontend-design skill. Supports incremental updates: new screens
  can be added without destroying existing sections. Use when the user asks to "create a
  wireframe", "generate a wireframe", "sketch the screens", "layout the UI", or mentions
  wireframe, screen layout, UI skeleton, or low-fidelity mockup.
---

# Generate Wireframe

## Instructions

Create or update the project wireframe at `docs/wireframes/index.html`. The wireframe is a
single-page HTML document that shows every user-facing screen with production-grade visual
design — distinctive typography, cohesive color palette, polished components, and navigation
links. It bridges the use case diagram (what the system does) and stakeholder review (does
this look right?).

**This skill uses the `frontend-design` skill for all visual output.** The `frontend-design`
skill provides the aesthetic direction, typography, color, spatial composition, and motion
guidelines. Read and apply them when generating the HTML.

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
   (layout patterns, colors, typography, component styles), and produces themed HTML per
   use case with full state coverage. The wireframe's visual identity directly shapes the
   design output.
3. **Human review** — Stakeholders review the wireframe to validate screen flow, information
   hierarchy, visual direction, and navigation. A polished wireframe builds confidence early.
4. **`/sprint-prepare`** — Can trigger wireframe generation for new use cases added during
   sprint refinement, ensuring the wireframe stays current as the project evolves.

## Design Philosophy

**Production-grade visual design.** The wireframe communicates both *structure* and *style*:

- **Distinctive typography** — Use Google Fonts with characterful, unexpected choices. Pair a
  distinctive display font with a refined body font. Never use generic fonts (Inter, Roboto,
  Arial, system fonts).
- **Cohesive color palette** — Commit to a bold aesthetic direction with dominant colors and
  sharp accents. Use CSS variables for consistency. Avoid timid, evenly-distributed palettes.
- **Polished components** — Cards, buttons, inputs, tables, and navigation should look like
  they belong in a finished product. Use shadows, rounded corners, hover states, and
  micro-interactions where appropriate.
- **Spatial composition** — Use generous whitespace, asymmetry where it adds interest, and
  grid-based layouts. Avoid cramped or generic layouts.
- **Atmosphere and depth** — Add background textures, gradients, or subtle effects that match
  the aesthetic direction. Avoid flat solid-color backgrounds.
- **Real content, not lorem ipsum** — Use realistic placeholder data that matches entity model
  attributes (e.g., "Maria Popescu", "maria@example.com", not "Lorem ipsum dolor").
- **Navigation is explicit** — Every clickable element that navigates to another screen uses
  an anchor link (`#UC-XXX`) so the wireframe is internally navigable.

**Apply the `frontend-design` skill guidelines** for typography, color, motion, spatial
composition, and backgrounds. The wireframe should be visually striking and memorable —
not a gray sketch.

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
1. The project's `CLAUDE.md` for the marker `<!-- NEXA_I18N_CONFIGURED -->` (includes locale list and default locale)
2. i18n configuration files (e.g., `next-intl` config, `i18n.ts`, `middleware.ts` locale list)
3. Translation files in `messages/` or `locales/` directories
4. Use case specifications (which may contain localized text)
5. If no locale information is found, default to `lang="en"`

Set the `lang` attribute on `<html>` to match the detected locale.

### Rules

- **Never approximate accented characters.** Use exact Unicode characters (e.g., Romanian:
  ă, â, î, ș (U+0219), ț (U+021B) — never ş (cedilla) or t̜).
- **All visible UI text** — labels, buttons, placeholders, headings, menu items — must be
  written in the project's primary locale with correct accents.
- **Use realistic localized placeholder data** — names, addresses, and content appropriate
  for the locale (e.g., Romanian names for a Romanian app, not anglicized names).

## DO NOT

- Use generic AI aesthetics (Inter/Roboto fonts, purple gradients on white, cookie-cutter layouts)
- Use lorem ipsum — use realistic placeholder content from the entity model
- Use any JavaScript framework (no React, no Vue, no Angular)
- Create separate files per screen — everything goes in one `index.html`
- Design screens for use cases that have no user-facing interaction (background jobs, system
  triggers with no UI)
- Invent screens that have no basis in the use case diagram or requirements
- Destroy existing wireframe sections when adding new ones (incremental updates)
- Add responsive breakpoints or mobile layouts — that is `/design-screens`' responsibility
- Strip or approximate diacritics/accents — all UI text must use correct Unicode characters

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

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

The wireframe uses Tailwind CSS and Google Fonts for production-grade visual quality. Study the
example in `examples/` for a complete reference implementation.

**Technology stack:**
- **Tailwind CSS** via CDN (`https://cdn.tailwindcss.com`) — for all utility-based styling
- **Google Fonts** — distinctive, characterful font choices (never Inter, Roboto, or system fonts)
- **Inline `<style>`** — only for custom CSS animations, effects, and component styles that
  Tailwind cannot express. Define CSS custom properties here for the color palette.
- **Inline `<script>` for Tailwind config** — extend Tailwind with the wireframe's custom
  color palette and font families

### Design direction

Before writing HTML, commit to a **bold aesthetic direction** following the `frontend-design`
skill guidelines:

1. **Choose a tone** — e.g., brutally minimal, luxury/refined, organic/natural, editorial/magazine,
   retro-futuristic, playful, art deco, industrial. Pick one and execute with precision.
2. **Choose distinctive fonts** — pair a display font with a body font from Google Fonts. The
   pairing should be unexpected and memorable.
3. **Choose a color palette** — 3–4 colors with clear hierarchy. Define as CSS custom properties
   and in the Tailwind config. Dominant color with sharp accents, not evenly distributed.
4. **Choose atmospheric elements** — gradients, textures, grain overlays, shadows, or other
   effects that create depth and character.

### Template structure

```html
<!DOCTYPE html>
<html lang="[project locale]">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Project Name] — Wireframe</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=[Display+Font]:wght@[weights]&family=[Body+Font]:wght@[weights][&subset=latin-ext if needed]&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            // Define 3-4 palette colors with evocative names and shade scales
            // e.g., ocean: { 50: '...', 100: '...', ..., 900: '...' }
          },
          fontFamily: {
            display: ['[Display Font]', 'sans-serif'],
            body: ['[Body Font]', 'serif'],
          }
        }
      }
    }
  </script>
  <style>
    /* ── CSS Custom Properties ── */
    :root {
      /* Define palette tokens matching the Tailwind config */
      /* Define semantic aliases: --bg-page, --bg-card, --text-primary, --accent, etc. */
    }

    /* ── Custom animations, effects, and component styles ── */
    /* Grain overlays, gradient meshes, hover effects, transitions, etc. */
    /* Annotation styles for wireframe metadata */

    .wf-annotation {
      /* Style annotations to be visually distinct but harmonious with the palette */
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      border-radius: 0.5rem;
    }
  </style>
</head>
<body class="[bg and text classes using palette] antialiased">

<div class="max-w-[1400px] mx-auto px-6 py-8">

  <!-- ============================================================ -->
  <!-- HEADER -->
  <!-- ============================================================ -->
  <div class="text-center py-8 mb-8 border-b-2 [border-color]">
    <h1 class="font-display text-3xl font-bold">[Project Name] — Wireframe</h1>
    <p class="mt-2 [muted-text-color]">[Brief project description] | [N] screens | Actors: [actor list]</p>
  </div>

  <!-- ============================================================ -->
  <!-- TABLE OF CONTENTS -->
  <!-- ============================================================ -->
  <div class="[card-styling] rounded-xl p-6 mb-8">
    <h2 class="font-display text-lg font-semibold mb-4">Screens</h2>
    <ul class="columns-2 list-none">
      <li class="py-1"><a href="#UC-XXX" class="[link-styling]">UC-XXX: [Screen Name]</a> <span class="text-sm [muted-color]">[Actor]</span></li>
      <!-- Repeat for each screen -->
    </ul>
  </div>

  <!-- ============================================================ -->
  <!-- SCREEN: UC-XXX — [Screen Name] -->
  <!-- ============================================================ -->
  <div class="[card-styling] rounded-xl p-8 mb-8" id="UC-XXX">
    <div class="flex justify-between items-baseline border-b [border-color] pb-4 mb-6 flex-wrap gap-2">
      <h2 class="font-display text-xl font-bold">UC-XXX: [Screen Name]</h2>
      <div class="flex gap-3 text-sm [muted-color]">
        <span class="[badge-styling] px-3 py-1 rounded-lg">Actor: [Primary Actor]</span>
        <span class="[badge-styling] px-3 py-1 rounded-lg">Type: [Form | List | Dashboard | ...]</span>
        <span class="[badge-styling] px-3 py-1 rounded-lg">Route: /[suggested-route]</span>
      </div>
    </div>

    <div class="wf-annotation">
      <strong>Purpose:</strong> [What this screen accomplishes — derived from use case goal]
    </div>

    <div class="[viewport-styling] rounded-xl p-6 min-h-[400px]">
      <!-- Screen layout using Tailwind utility classes -->
      <!-- Build navbars, sidebars, cards, forms, tables, stats grids, etc. -->
      <!-- Use the chosen font families, colors, and spatial composition -->
    </div>

    <div class="wf-annotation mt-4">
      <strong>Navigation:</strong> Navigates to <a href="#UC-YYY">UC-YYY: [Screen Name]</a>
      on [action]. Returns to <a href="#UC-ZZZ">UC-ZZZ: [Screen Name]</a> on cancel.
    </div>
  </div>
  <!-- Repeat for each screen -->

  <!-- ============================================================ -->
  <!-- NAVIGATION MAP -->
  <!-- ============================================================ -->
  <div class="[card-styling] rounded-xl p-8 mb-8">
    <h2 class="font-display text-xl font-bold mb-6">Navigation Map</h2>

    <!-- Show primary navigation flows as sequences -->
    <div class="flex flex-wrap gap-2 items-center mb-3">
      <div class="[node-styling] px-3 py-1.5 rounded-lg text-sm"><a href="#UC-XXX">UC-XXX: [Name]</a></div>
      <span class="[muted-color] text-sm">&rarr;</span>
      <div class="[node-styling] px-3 py-1.5 rounded-lg text-sm"><a href="#UC-YYY">UC-YYY: [Name]</a></div>
      <span class="[muted-color] text-sm">&rarr;</span>
      <div class="[node-styling] px-3 py-1.5 rounded-lg text-sm"><a href="#UC-ZZZ">UC-ZZZ: [Name]</a></div>
    </div>
    <!-- Repeat for each navigation flow -->
  </div>

</div>

</body>
</html>
```

**Note:** The `[bracketed-styling]` placeholders above are not literal — replace them with
actual Tailwind classes using your chosen palette. The template shows the structural skeleton;
the visual execution must follow the `frontend-design` skill's aesthetic guidelines.

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

- **Same navbar** — If multiple screens share a navigation bar, use the same navbar
  structure with the same links across those screens. Highlight the active link.
- **Same sidebar** — If the app has sidebar navigation, show it consistently with the
  active item highlighted.
- **Consistent placement** — Buttons in the same position, tables with the same column
  patterns, forms with the same field layout conventions.
- **Same visual identity** — Typography, color palette, spacing, and component styles must
  be identical across all screens. This is enforced naturally by the shared Tailwind config
  and CSS custom properties.

This consistency is essential because `/design-screens` will derive the shared layout
from the wireframe. Inconsistent wireframes produce inconsistent designs.
