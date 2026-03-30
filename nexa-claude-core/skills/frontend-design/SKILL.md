---
name: frontend-design
description: >
  Creates screen design specifications as standalone HTML artifacts from the project wireframe.
  Uses Playwright to open the wireframe, identify the section relevant to the current use case,
  and produces a self-contained HTML design file faithful to the wireframe's layout and enriched
  with states, data mappings, and interactions from the use case specification.
  Use when the user asks to "design a screen", "create a wireframe", "define the UI",
  "design the frontend", or mentions screen design, wireframes, UI layout, or frontend design.
---

# Frontend Design

## Instructions

Create or update an HTML screen design artifact for $ARGUMENTS in `docs/designs/`.
$ARGUMENTS is a use case ID (`UC-XXX`) that has an existing specification in `docs/use_cases/`.

The design artifact bridges the use case specification (what the system does) and the
implementation (how it looks and behaves). It is a **standalone HTML file** that faithfully
translates the relevant wireframe section into a viewable, annotated design reference.

## Inputs

| Input | Location | Required |
|-------|----------|----------|
| Use case specification | `docs/use_cases/UC-XXX.md` | Yes |
| Entity model | `docs/entity_model.md` | If applicable |
| Wireframe | `docs/wireframes/index.html` | Yes |
| Design system CSS | `docs/designs/design-system.css` | Optional — created automatically if missing |

## Output

A single self-contained **HTML** file: `docs/designs/UC-XXX-design.html`

**CRITICAL: The output MUST be an `.html` file written with the Write tool. Do NOT produce Markdown.
Do NOT create a `.md` file. The file extension MUST be `.html` and the content MUST start with
`<!DOCTYPE html>`. If you find yourself writing Markdown syntax (headings with `#`, lists with `-`,
tables with `|`), STOP — you are producing the wrong format.**

## DO NOT

- **Produce Markdown** — the output is HTML, never `.md`. No Markdown syntax anywhere in the file.
- Skip reading the use case specification first
- Use any external dependencies — no CDN links, no remote CSS/JS, no images via URL. The only
  external stylesheet allowed is the project's `design-system.css` (a local file in `docs/designs/`)
- Use any framework-specific code (no React, no Next.js, no component libraries)
- Use lorem ipsum — use realistic placeholder content that matches entity model attributes
- Design screens for steps not in the use case specification
- Omit error states or empty states
- Ignore the wireframe layout — the wireframe takes precedence over assumptions

## Workflow

### Phase 1 — Gather context

1. Read the use case specification from `docs/use_cases/UC-XXX.md`
2. Read the entity model from `docs/entity_model.md` (if applicable)
3. Check if `docs/designs/design-system.css` exists:
   - **If it exists**: Read it — all design tokens and base styles are already defined. Use its
     CSS custom properties throughout the design artifact.
   - **If it does NOT exist**: You will create it during Phase 3 before writing the design HTML.
     Inspect the wireframe's visual language (colors, fonts, spacing, border radii) during Phase 2
     and use those observations to populate the design system tokens. See the
     **Design System CSS** section below for the required structure.

### Phase 2 — Inspect the wireframe with Playwright

All screenshots taken during this phase MUST be saved to `docs/snapshots/` using the naming
convention `UC-XXX-<description>.png` (e.g., `UC-001-overview.png`, `UC-001-form-screen.png`).
Create the `docs/snapshots/` directory if it does not exist.

3. Open the wireframe in Playwright:
   a. Navigate to the `file://` absolute path of `docs/wireframes/index.html`
   b. Take an **accessibility snapshot** to understand the overall structure and navigation
   c. Take a **screenshot** (full page) and save it as `docs/snapshots/UC-XXX-wireframe-overview.png`
4. Navigate to the screen(s) relevant to the use case:
   a. Using the use case specification, identify which screen(s) in the wireframe correspond
      to the use case
   b. Click links, tabs, or navigation elements to reach the relevant screen
   c. Take a **screenshot** (full page) and save it as
      `docs/snapshots/UC-XXX-<screen-name>.png` to capture the visual layout
   d. Take an **accessibility snapshot** to capture the semantic structure, components,
      and hierarchy
   e. If the use case spans multiple screens, repeat for each screen with a distinct
      `<screen-name>` suffix
5. Close the Playwright browser

### Phase 3 — Produce the HTML design artifact

6. If `docs/designs/design-system.css` does not exist, create it now using the **Write** tool.
   Populate the CSS custom properties with values derived from the wireframe inspection in Phase 2.
   Follow the structure defined in the **Design System CSS** section below.
7. Using the **Write** tool, create `docs/designs/UC-XXX-design.html` following the HTML structure
   below. The file content MUST be valid HTML starting with `<!DOCTYPE html>` — never Markdown.
8. For each screen identified in the wireframe:
   - Reproduce the **layout and visual structure** from the wireframe
   - Map **components** to use case steps using `data-uc-step` attributes
   - Map **data fields** to entity model attributes using `data-entity` attributes
   - Include all **states**: default, loading, empty, error, success — each rendered as a
     visible section
   - Use CSS custom properties from the design system (e.g., `var(--color-primary)`,
     `var(--font-body)`, `var(--spacing-md)`) — never hardcode color, typography, or spacing values
9. Include a **navigation flow** section showing how screens connect
10. Include **responsive behavior** using CSS media queries

## HTML Structure

The design HTML must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design: UC-XXX — [Use Case Name]</title>

  <!-- Shared design system — single source of truth for tokens and base styles -->
  <link rel="stylesheet" href="design-system.css">

  <style>
    /* ── Screen-specific overrides only ──
       Layout rules unique to THIS screen go here.
       All color, typography, and spacing values MUST use CSS custom properties
       from the design system (e.g., var(--color-primary), var(--font-body), var(--spacing-md)).
       Do NOT hardcode hex colors, font stacks, or pixel spacing values. */

    /* ── Screen-specific layout ── */

    /* ── Annotations ── */
    [data-uc-step]::after {
      /* Optionally show UC step annotations on hover or always */
    }

    /* ── Responsive overrides for this screen ── */
    @media (max-width: 768px) { /* tablet adjustments */ }
    @media (max-width: 480px) { /* mobile adjustments */ }
  </style>
</head>
<body>

  <!-- ── Design Metadata ── -->
  <header class="design-meta">
    <h1>Screen Design: [Use Case Name]</h1>
    <dl>
      <dt>Use Case</dt><dd>UC-XXX</dd>
      <dt>Status</dt><dd>Draft</dd>
    </dl>
  </header>

  <!-- ── Screen Map ── -->
  <nav class="screen-map">
    <h2>Screen Map</h2>
    <ol>
      <li><a href="#screen-1">[Screen 1 Name]</a></li>
      <li><a href="#screen-2">[Screen 2 Name]</a></li>
    </ol>
  </nav>

  <!-- ── Screen 1 ── -->
  <section id="screen-1" class="screen">
    <h2 class="screen__title">[Screen Name]</h2>
    <p class="screen__purpose">Purpose: [What the user accomplishes here]</p>
    <p class="screen__trigger">Triggered by: [UC step or navigation action]</p>

    <!-- Default state -->
    <div class="state state--default">
      <h3>Default State</h3>
      <div class="screen__layout">
        <!--
          Reproduce the wireframe layout here using semantic HTML.
          Annotate interactive elements with data-uc-step and data fields with data-entity.

          Example:
          <form data-uc-step="3">
            <label for="email">Email</label>
            <input id="email" type="email" data-entity="User.email" placeholder="user@example.com">

            <label for="password">Password</label>
            <input id="password" type="password" data-entity="User.passwordHash" placeholder="••••••••">

            <button type="submit" data-uc-step="4">Sign In</button>
          </form>
        -->
      </div>
    </div>

    <!-- Loading state -->
    <div class="state state--loading">
      <h3>Loading State</h3>
      <div class="screen__layout">
        <!-- Show what the user sees while data loads or action processes -->
      </div>
    </div>

    <!-- Empty state -->
    <div class="state state--empty">
      <h3>Empty State</h3>
      <div class="screen__layout">
        <!-- Show what the user sees when there is no data -->
      </div>
    </div>

    <!-- Error state -->
    <div class="state state--error">
      <h3>Error State</h3>
      <div class="screen__layout">
        <!-- Show what the user sees when something fails.
             Map to Alternative Flows from the use case spec. -->
      </div>
    </div>

    <!-- Success state -->
    <div class="state state--success">
      <h3>Success State</h3>
      <div class="screen__layout">
        <!-- Show what the user sees after a successful action -->
      </div>
    </div>
  </section>

  <!-- ── Repeat for each screen ── -->

  <!-- ── Navigation Flow ── -->
  <section class="navigation-flow">
    <h2>Navigation Flow</h2>
    <!-- Describe or diagram how screens connect:
         what action on Screen 1 leads to Screen 2, etc. -->
  </section>

</body>
</html>
```

## Data Attribute Reference

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-uc-step="N"` | Maps element to use case Main Success Scenario step N | `data-uc-step="3"` |
| `data-uc-alt="N"` | Maps element to Alternative Flow N | `data-uc-alt="2"` |
| `data-entity="Entity.attr"` | Maps field to entity model attribute | `data-entity="User.email"` |

## Design Principles

- **Wireframe-faithful** — The layout, component placement, and navigation structure must match
  the wireframe. Do not invent layouts.
- **Semantic HTML** — Use appropriate elements (`form`, `table`, `nav`, `button`, `input`) so the
  design communicates component intent.
- **All states visible** — Every state (default, loading, empty, error, success) is rendered as a
  visible section. This makes the design a complete reference — no hidden requirements.
- **Traceable** — Every interactive element traces back to a use case step via `data-uc-step`.
  Every data field traces to the entity model via `data-entity`.
- **Self-contained within `docs/designs/`** — The HTML file and `design-system.css` together open
  in any browser with no internet dependencies. The design system CSS is a project-local shared
  resource, not an external dependency.

## Design System CSS

The file `docs/designs/design-system.css` is the single source of truth for visual tokens and base
component styles. All design artifacts link to it. When a stylistic change arrives (brand colors,
typography, spacing), update this one file and all designs reflect the change.

**When to create it**: The first time `/frontend-design` runs on a project that has no
`docs/designs/design-system.css`. Derive token values from the wireframe's visual language.

**When to update it**: If a design needs a new token category or component style not yet in the
file, add it. Never remove tokens that other designs may use without checking.

### Required structure

```css
:root {
  /* ── Colors ── */
  --color-primary: ...;
  --color-primary-hover: ...;
  --color-secondary: ...;
  --color-bg: ...;
  --color-surface: ...;
  --color-border: ...;
  --color-text: ...;
  --color-text-muted: ...;
  --color-error: ...;
  --color-success: ...;
  --color-warning: ...;

  /* ── Typography ── */
  --font-body: ...;
  --font-heading: ...;
  --font-mono: ...;
  --font-size-sm: ...;
  --font-size-base: ...;
  --font-size-lg: ...;
  --font-size-xl: ...;

  /* ── Spacing ── */
  --spacing-xs: ...;
  --spacing-sm: ...;
  --spacing-md: ...;
  --spacing-lg: ...;
  --spacing-xl: ...;

  /* ── Borders & Radius ── */
  --radius-sm: ...;
  --radius-md: ...;
  --radius-lg: ...;
  --border-default: ...;

  /* ── Shadows ── */
  --shadow-sm: ...;
  --shadow-md: ...;
}

/* ── Base reset & typography ── */
/* ── Component styles: buttons, forms, tables, cards, nav ── */
/* ── State variants: .state--loading, .state--empty, .state--error, .state--success ── */
/* ── Design metadata & screen structure: .design-meta, .screen, .screen-map ── */
/* ── Responsive breakpoints ── */
```

### Token categories

| Category | Properties | Purpose |
|----------|-----------|---------|
| Colors | `--color-*` | Brand palette, semantic colors (error, success, warning), surfaces, borders |
| Typography | `--font-*`, `--font-size-*` | Font families (body, heading, mono) and size scale |
| Spacing | `--spacing-*` | Consistent spacing scale from xs to xl |
| Borders & Radius | `--radius-*`, `--border-*` | Corner radii and default border style |
| Shadows | `--shadow-*` | Elevation levels |

### Base component styles

Below the `:root` tokens, include base styles for common components so that design artifacts share
a consistent look without duplicating CSS:

- **Reset & typography**: box-sizing, body font, heading styles, link styles
- **Buttons**: `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--danger`
- **Forms**: `input`, `select`, `textarea`, `label`, form layout
- **Tables**: `table`, `th`, `td`, striped rows, hover states
- **Cards**: `.card`, `.card__header`, `.card__body`
- **Navigation**: `.nav`, `.nav__item`, active states
- **State variants**: `.state--loading`, `.state--empty`, `.state--error`, `.state--success`
- **Design metadata**: `.design-meta`, `.screen`, `.screen-map`
- **Responsive breakpoints**: tablet (768px) and mobile (480px) base adjustments
