---
name: design-screens
description: >
  Creates screen design specifications as standalone HTML artifacts from the project wireframe.
  Uses Playwright to open the wireframe, identify the section relevant to the current use case,
  and produces a self-contained HTML design file faithful to the wireframe's layout and enriched
  with states, data mappings, and interactions from the use case specification.
  Uses a separated CSS theming approach — HTML references a theme switcher CSS file and a Tailwind
  config, so changing the theme across all designs requires only swapping CSS files.
  Use when the user asks to "design a screen", "create a wireframe", "define the UI",
  "design the frontend", or mentions screen design, wireframes, UI layout, or frontend design.
context: fork
---

# Frontend Design

## Instructions

Create or update an HTML screen design artifact for $ARGUMENTS in `docs/designs/`.
$ARGUMENTS is a use case ID (`UC-XXX`) that has an existing specification in `docs/use_cases/`.

The design artifact bridges the use case specification (what the system does) and the
implementation (how it looks and behaves). It is a **standalone HTML file** that faithfully
translates the relevant wireframe section into a viewable, annotated design reference.

## Theming Architecture

**CSS is fully separated from HTML.** All visual identity lives in external CSS theme files and
Tailwind config files. The HTML uses Tailwind utility classes with semantic color names and CSS
custom properties from the theme — it never contains hardcoded colors, font stacks, or brand values.

Switching the entire visual theme across all design artifacts requires changing only two files:
- `current-theme.css` — change the `@import` to point to a different theme CSS
- `current-tailwind-config.js` — replace contents with the matching Tailwind config

### File structure in `docs/designs/`

```
docs/designs/
├── current-theme.css              # Theme switcher — @imports the active theme
├── current-tailwind-config.js     # Active Tailwind config (colors, fonts)
├── <main-theme>-001.css           # Main theme derived from wireframe (CSS custom properties + components)
├── <main-theme>-tailwind-config.js# Main Tailwind color/font config
├── <alt-theme>-001.css            # Optional alternative theme variant
├── <alt-theme>-tailwind-config.js # Optional alternative Tailwind config
├── UC-000-design.html             # Design artifact (references current-theme.css)
├── UC-001-design.html
└── ...
```

### How the theme switcher works

**`current-theme.css`** contains a single `@import` pointing to the active theme:
```css
@import url('<main-theme>-001.css');
```

**`current-tailwind-config.js`** contains the active Tailwind configuration that maps semantic
color names to the theme's palette. Each theme defines four color palette roles with evocative
names derived from the wireframe's visual language:

| Role | Purpose | Example names |
|------|---------|---------------|
| **Primary** | Main brand color | `forest`, `ocean`, `ember`, `indigo` |
| **Accent** | Secondary/accent color | `coral`, `azure`, `mint`, `amber` |
| **Neutral** | Background/surface neutrals | `cream`, `slate`, `sand`, `mist` |
| **Highlight** | Premium/highlight color | `gold`, `lemon`, `copper`, `silver` |

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Names derived from the wireframe's visual language — NOT prescribed
        [primary]: { 50:'...', 100:'...', /* ... */ 900:'...' },
        [accent]:  { 50:'...', 100:'...', /* ... */ 900:'...' },
        [neutral]: { 50:'...', 100:'...', /* ... */ },
        [highlight]:{ 50:'...', 100:'...', /* ... */ 900:'...' },
      },
      fontFamily: {
        display: ['...', 'sans-serif'],
        body: ['...', 'serif'],
        mono: ['...', 'monospace'],
      }
    }
  }
}
```

To switch themes: change the `@import` in `current-theme.css` and replace
`current-tailwind-config.js` contents with the matching config. All design HTML files instantly
reflect the new theme.

## Examples

Reference examples are available in this skill's `examples/` directory. These examples use a
**green/forest theme** — study the **structure and patterns**, not the specific color names.
Your project's theme must be derived from its own wireframe:

| File | Purpose |
|------|---------|
| `examples/UC-000_landing_page.html` | Complete landing page design — shows section-by-section layout with annotations |
| `examples/UC-001_register.html` | Registration flow design — shows forms, validation states, multi-step flow |
| `examples/UC-002_verify_ong_company.html` | Verification flow — shows admin review screens, status states |
| `examples/current-theme.css` | Theme switcher file — single `@import` line |
| `examples/current-tailwind-config.js` | Active Tailwind config file |
| `examples/green-theme-001.css` | Green/Forest theme — full CSS custom properties + component styles |
| `examples/green-tailwind-config.js` | Green/Forest Tailwind color palette |
| `examples/blue-theme-001.css` | Blue/Indigo theme — same structure, different palette |
| `examples/blue-tailwind-config.js` | Blue/Indigo Tailwind color palette |

**Study these examples before producing output.** They demonstrate:
- How HTML uses Tailwind utility classes with semantic names (e.g., `bg-forest-800`, `text-coral-500` in the green example)
- How CSS custom properties (e.g., `var(--forest-600)`, `var(--bg-card)`) are used in component styles
- The section-by-section design layout with `design-section-divider`, `design-annotation`,
  `design-screen` patterns
- How `design-header`, `design-meta`, `design-annotation`, `design-data-table` classes annotate
  the design without embedding styling in HTML
- How theme CSS files share identical structure (resets, animations, components) but differ only
  in `:root` token values and rgba references

## Inputs

| Input | Location | Required |
|-------|----------|----------|
| Use case specification | `docs/use_cases/UC-XXX.md` | Yes |
| Entity model | `docs/entity_model.md` | If applicable |
| Wireframe | `docs/wireframes/index.html` | Yes |
| Design rules | `docs/designs/DESIGN_RULES.md` | Optional — project-specific design constraints |
| Theme CSS | `docs/designs/current-theme.css` | Optional — created automatically if missing |
| Tailwind config | `docs/designs/current-tailwind-config.js` | Optional — created automatically if missing |

## Output

A single **HTML** file: `docs/designs/UC-XXX-design.html`

If the theme files do not exist yet, also create the theme infrastructure (see Phase 3).

**CRITICAL: The output MUST be an `.html` file written with the Write tool. Do NOT produce Markdown.
Do NOT create a `.md` file. The file extension MUST be `.html` and the content MUST start with
`<!DOCTYPE html>`. If you find yourself writing Markdown syntax (headings with `#`, lists with `-`,
tables with `|`), STOP — you are producing the wrong format.**

## Internationalization (i18n)

When the project uses internationalization, all placeholder text in design artifacts MUST use
**correct, native-quality text** for the target locale — including every diacritical mark and
accent required by the language.

### Rules

1. **Never approximate accented characters.** Use the exact Unicode characters the language
   requires. For example, Romanian requires ă, â, î, ș (with comma below, U+0219), and
   ț (with comma below, U+021B) — never substitute with ş (cedilla, U+015F) or t̜.
   Similarly, French requires é, è, ê, ë, ç, etc. Missing or wrong diacritics are treated
   as bugs.
2. **Set the `lang` attribute** on `<html>` to match the project's primary locale (e.g.,
   `lang="ro"` for Romanian, `lang="fr"` for French). If the project supports multiple
   locales, use the default locale.
3. **Detect the project locale automatically.** Check these sources in order:
   - The project's `CLAUDE.md` for the marker `<!-- NEXA_I18N_CONFIGURED -->` (includes locale list and default locale)
   - i18n configuration files (e.g., `next-intl` config, `i18n.ts`, `middleware.ts` locale list)
   - Translation files in `messages/` or `locales/` directories
   - The use case specification (which may contain localized text)
   - If no locale information is found, default to `lang="en"`
4. **All visible UI text** — labels, buttons, placeholders, headings, error messages, empty
   states, success messages — must be written in the project's primary locale with correct
   accents. This includes placeholder content that demonstrates realistic data.
5. **Ensure fonts support the required character set.** Google Fonts loaded in the HTML head
   must include the character subsets needed for the locale (e.g., `&subset=latin-ext` for
   Romanian, Polish, Czech, etc.). Add the subset parameter to the Google Fonts URL when the
   locale requires characters beyond basic Latin.

### Example — Romanian

```html
<html lang="ro">
<!-- Google Fonts with latin-ext subset -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&subset=latin-ext&display=swap" rel="stylesheet">

<!-- Correct Romanian text -->
<button>Înregistrează-te</button>
<label>Adresă de email</label>
<input placeholder="exemplu@email.com">
<p class="error">Câmpul este obligatoriu</p>
<p>Încărcați documentele necesare</p>
<span>Verificare în curs de procesare</span>
```

### Common mistakes to avoid

| Wrong | Correct | Language |
|-------|---------|----------|
| Inregistreaza-te | Înregistrează-te | Romanian |
| Adresa de email | Adresă de email | Romanian |
| Incarcati documentele | Încărcați documentele | Romanian |
| Campul este obligatoriu | Câmpul este obligatoriu | Romanian |
| Reusit | Reușit | Romanian |
| Resumé | Résumé | French |
| Uber | Über | German |

## DO NOT

- **Produce Markdown** — the output is HTML, never `.md`. No Markdown syntax anywhere in the file.
- Skip reading the use case specification first
- **Hardcode colors, fonts, or spacing in HTML** — use Tailwind utility classes with the theme's
  semantic color names and CSS custom properties from the theme
- **Embed CSS custom property definitions in the HTML `<style>` block** — token definitions belong
  in the theme CSS files only. The HTML `<style>` block is for screen-specific layout rules only.
- Use any framework-specific code (no React, no Next.js, no component libraries)
- Use lorem ipsum — use realistic placeholder content that matches entity model attributes
- **Strip or approximate diacritics/accents** — all UI text must use correct Unicode characters
  for the project locale (see Internationalization section)
- Design screens for steps not in the use case specification
- Omit error states or empty states
- Ignore the wireframe layout — the wireframe takes precedence over assumptions
- **Ignore project design rules** — if `docs/designs/DESIGN_RULES.md` exists, every rule in it
  must be followed. Missing a shared element (header, footer, sidebar) specified in design rules
  is a defect.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Workflow

### Phase 1 — Gather context

1. Read the use case specification from `docs/use_cases/UC-XXX.md`
2. Read the entity model from `docs/entity_model.md` (if applicable)
3. Read the example files from this skill's `examples/` directory to understand the expected
   output format, HTML structure, and theming patterns
4. **Read project design rules** from `docs/designs/DESIGN_RULES.md` (if it exists).
   These are project-specific constraints that every design artifact must follow — e.g.,
   shared layout elements (header, footer, sidebar), mandatory components, consistent
   navigation patterns, accessibility requirements, or brand guidelines. Every rule in this
   file applies to **all** design artifacts unless the rule itself specifies a narrower scope.
5. **Detect the project locale** following the rules in the Internationalization section.
   Determine the `lang` attribute value and whether `&subset=latin-ext` (or other subsets)
   are needed for the Google Fonts URL.
6. Check if `docs/designs/current-theme.css` exists:
   - **If it exists**: Read it and the active theme CSS it imports — all design tokens and base
     styles are already defined.
   - **If it does NOT exist**: You will create the theme infrastructure during Phase 3.
     Inspect the wireframe's visual language (colors, fonts, spacing) during Phase 2
     and use those observations to populate the theme tokens.

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

6. If the theme infrastructure does not exist, create it now using the **Write** tool.
   **The wireframe's visual language dictates the theme** — extract colors, fonts, and spacing
   from the wireframe screenshots taken in Phase 2 and use them as the basis for the theme tokens.
   - Choose evocative **palette names** that reflect the wireframe's color identity (e.g., `ocean`
     for a blue maritime palette, `ember` for warm reds, `forest` for greens). Do NOT default to
     the example names (`forest`, `coral`, `cream`, `gold`) — those belong to the green example theme.
   - Create a **theme CSS file** (e.g., `docs/designs/ocean-theme-001.css`) following the
     structure from the examples. Populate `:root` custom properties with values extracted from
     the wireframe. Include all base resets, animations, and component styles.
   - Create the matching **Tailwind config** (e.g., `docs/designs/ocean-tailwind-config.js`)
     with color palettes matching the theme CSS tokens.
   - Create **`current-theme.css`** with a single `@import` pointing to the theme CSS.
   - Create **`current-tailwind-config.js`** with contents matching the active Tailwind config.
   - Optionally create a second theme variant to demonstrate the theme switching capability.
7. Using the **Write** tool, create `docs/designs/UC-XXX-design.html` following the HTML structure
   below. The file content MUST be valid HTML starting with `<!DOCTYPE html>` — never Markdown.
8. For each screen identified in the wireframe:
   - Reproduce the **layout and visual structure** from the wireframe
   - Use **Tailwind utility classes** with the theme's semantic color names (e.g., `bg-[primary]-800`,
     `text-[accent]-500`, `border-[neutral]-200`) for layout and styling — never hardcode hex values
   - Use **CSS custom properties** (`var(--[primary]-600)`, `var(--bg-card)`) in the theme CSS for
     component styles that can't be expressed as Tailwind utilities
   - Map **components** to use case steps using `data-uc-step` attributes
   - Map **data fields** to entity model attributes using `data-entity` attributes
   - Include all **states**: default, loading, empty, error, success — each rendered as a
     visible section
   - Use `design-section-divider`, `design-section-title`, `design-annotation`, `design-screen`,
     and `design-data-table` CSS classes from the theme for design artifact structure
9. Include a **navigation flow** section showing how screens connect
10. Include **responsive behavior** using Tailwind responsive prefixes and CSS media queries
11. Include a **Mobile Layout** section showing how the design adapts to mobile viewports

## Mobile Layout Section

Every design artifact MUST include a dedicated **Mobile Layout** section that explicitly shows
how the UI adapts for mobile viewports (< 768px). Responsiveness cannot be assumed to work
"out of the box" — mobile requires explicit design decisions.

### What to include

1. **Navigation changes** — e.g., hamburger menu replacing horizontal nav
2. **Layout reflows** — e.g., sidebar collapses, grid becomes single column
3. **Component adaptations** — e.g., data tables become cards, horizontal tabs become dropdowns
4. **Touch targets** — buttons/links sized for finger taps (minimum 44x44px)
5. **Hidden/revealed elements** — what's hidden on mobile, what's shown differently

### HTML structure for Mobile Layout section

```html
<!-- ============================================================== -->
<!-- MOBILE LAYOUT -->
<!-- ============================================================== -->
<div class="design-section-divider"></div>
<div class="design-section-title">Mobile Layout (< 768px)</div>

<div class="design-annotation">
  <strong>Navigation:</strong> [How nav transforms — hamburger, drawer, etc.]
</div>

<div class="design-annotation">
  <strong>Layout changes:</strong>
  <ul class="list-disc ml-5 mt-2">
    <li>[Change 1 — e.g., "2-column grid → single column stack"]</li>
    <li>[Change 2 — e.g., "Sidebar collapses into bottom sheet"]</li>
    <li>[Change 3 — e.g., "Data table → card list with key fields only"]</li>
  </ul>
</div>

<div class="design-screen">
  <!-- Mobile viewport rendering of the main screen -->
  <div class="max-w-[375px] mx-auto border border-[neutral]-300 rounded-xl overflow-hidden">
    <!-- Mobile layout here -->
  </div>
</div>

<div class="design-annotation">
  <strong>Touch targets:</strong> All interactive elements meet 44x44px minimum.
  <strong>Gestures:</strong> [Any swipe, pull-to-refresh, or other mobile gestures]
</div>
```

## HTML Structure

The design HTML must follow this structure:

```html
<!DOCTYPE html>
<html lang="[project locale, e.g. en, ro, fr — see Internationalization section]">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UC-XXX — [Use Case Name] — [Project] Design</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500[&subset=latin-ext if needed]&display=swap" rel="stylesheet">
<script src="current-tailwind-config.js"></script>
<link rel="stylesheet" href="current-theme.css">
</head>
<body class="bg-[neutral]-100 text-[primary]-800 antialiased">

<div class="max-w-[1400px] mx-auto px-6 py-8">

  <!-- Design Header -->
  <div class="design-header">
    <h1>UC-XXX — [Use Case Name]</h1>
    <p>[Brief description of what this screen/flow accomplishes]</p>
    <div class="design-meta">
      <span>Actor: <strong>[Primary Actor]</strong></span>
      <span>Route: <strong>[URL route]</strong></span>
      <span>Priority: <strong>[Priority]</strong></span>
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- SECTION 1: [Section Name] -->
  <!-- ============================================================== -->
  <div class="design-section-divider"></div>
  <div class="design-section-title">1. [Section Name]</div>

  <div class="design-annotation">
    <strong>[Annotation type]:</strong> [Description of the section's purpose,
    layout, behavior, and key interactions]
  </div>

  <div class="design-screen">
    <!-- Actual screen content using Tailwind utility classes -->
    <!-- Use the theme's semantic color names (e.g., bg-[primary]-800, text-[accent]-500) -->
  </div>

  <div class="design-annotation">
    <strong>Data mapping:</strong> [Entity-to-field mappings, navigation targets,
    API endpoints]
  </div>

  <!-- Repeat sections for each part of the screen -->

  <!-- ============================================================== -->
  <!-- STATES -->
  <!-- ============================================================== -->
  <div class="design-section-divider"></div>
  <div class="design-section-title">States</div>

  <!-- Loading state -->
  <div class="design-annotation">
    <strong>Loading:</strong> [What the user sees while data loads]
  </div>
  <div class="design-screen">
    <!-- Loading skeleton / spinner -->
  </div>

  <!-- Empty state -->
  <div class="design-annotation">
    <strong>Empty:</strong> [What the user sees when there is no data]
  </div>
  <div class="design-screen">
    <!-- Empty state content -->
  </div>

  <!-- Error state -->
  <div class="design-annotation">
    <strong>Error:</strong> [What the user sees on failure — map to Alternative Flows]
  </div>
  <div class="design-screen">
    <!-- Error state content -->
  </div>

  <!-- Success state -->
  <div class="design-annotation">
    <strong>Success:</strong> [What the user sees after successful action]
  </div>
  <div class="design-screen">
    <!-- Success state content -->
  </div>

</div>
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
- **Mobile-explicit** — Every design includes a dedicated Mobile Layout section. Do not assume
  responsiveness works automatically — mobile requires explicit decisions about navigation,
  layout reflows, and component adaptations.
- **CSS-separated theming** — All visual identity (colors, fonts, spacing tokens) lives in
  external CSS theme files and Tailwind configs. HTML never contains hardcoded brand values.
  Changing the theme = swapping CSS files. This is the most important architectural principle.
- **Semantic HTML + Tailwind** — Use appropriate elements (`form`, `table`, `nav`, `button`,
  `input`) styled with Tailwind utility classes using the theme's semantic color names (four
  palettes: primary, accent, neutral, highlight — with evocative names derived from the wireframe).
  Custom component styles use CSS custom properties from the theme.
- **All states visible** — Every state (default, loading, empty, error, success) is rendered as a
  visible section. This makes the design a complete reference — no hidden requirements.
- **Traceable** — Every interactive element traces back to a use case step via `data-uc-step`.
  Every data field traces to the entity model via `data-entity`.
- **Section-by-section layout** — Each logical section of the screen gets its own
  `design-section-divider` + `design-section-title` + `design-annotation` + `design-screen`
  block, making the design easy to review and implement incrementally.

## Theme CSS Structure

Each theme CSS file contains the **complete** visual identity. All theme files for a project share
identical structure but differ in `:root` token values. The theme name reflects the wireframe's
visual language (e.g., `ocean-theme-001.css` for a blue palette, `ember-theme-001.css` for warm tones).

### Required sections

```css
/* ── Reset & Base ── */
/* box-sizing, body font, heading font families */

/* ── CSS Custom Properties (Theme Tokens) ── */
:root {
  /* Color palettes: --[primary]-*, --[accent]-*, --[neutral]-*, --[highlight]-* (50-900 scale) */
  /* Semantic aliases: --bg-page, --bg-card, --text-primary, --accent, etc. */
  /* Sizing: --radius-*, --shadow-*, --nav-height */
}

/* ── Grain Overlay ── */
/* ── Custom Scrollbar ── */
/* ── Animations ── (fadeUp, fadeIn, scaleIn, slideRight, float, pulse-ring, shimmer) */
/* ── Page Transitions ── */
/* ── Component styles ── (hero-blob, card-hover, tab-link, toggle-switch, etc.) */
/* ── Status Chips ── */
/* ── Language Switcher ── */
/* ── Design Artifact classes ── (design-header, design-section-divider, design-annotation,
      design-screen, design-data-table, design-state-label) */
```

### Semantic color names

Each project defines four palette names derived from the wireframe's visual identity. All themes
within the same project use the same four names so HTML never changes — only the `:root` values
differ between themes.

| Role | Purpose | Example (green theme) | Example (ocean theme) |
|------|---------|----------------------|----------------------|
| **Primary** | Main brand color | `forest` (emerald scale) | `ocean` (deep blue scale) |
| **Accent** | Secondary/accent color | `coral` (orange/amber) | `azure` (sky blue) |
| **Neutral** | Background/surface neutrals | `cream` (green-tinted) | `mist` (blue-tinted) |
| **Highlight** | Premium/highlight color | `gold` (true gold) | `copper` (warm metallic) |

The HTML always writes `bg-[primary]-600` or `var(--[primary]-600)` using the project's chosen
palette names — the actual rendered color depends entirely on which theme CSS is active.

> **Note:** The examples in this skill's `examples/` directory use `forest`/`coral`/`cream`/`gold`
> as their palette names. These are specific to the green example theme, not universal defaults.
> Your project's palette names should reflect its own wireframe.
