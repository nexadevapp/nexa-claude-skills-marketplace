---
name: fix-designs
description: >
  Migrates existing design artifacts to use a shared design system CSS file. Scans all
  UC-*-design.html files in docs/designs/, extracts inline styles into a unified
  docs/designs/design-system.css with CSS custom properties, and rewrites each HTML file
  to reference the shared stylesheet. Use when the user asks to "fix designs",
  "migrate designs", "extract design system", "unify design styles", or mentions
  design system extraction, design migration, or CSS consolidation.
---

# Fix Designs

## Instructions

Migrate all existing design artifacts in `docs/designs/` to use a shared `design-system.css` file.
This skill extracts hardcoded inline styles from existing `UC-*-design.html` files, consolidates
them into CSS custom properties in `docs/designs/design-system.css`, and rewrites each HTML file
to reference the shared stylesheet.

The **target structure** for migrated files is defined by the `/frontend-design` skill
(`nexa-claude-core/skills/frontend-design/SKILL.md`). After migration, every design artifact must
conform to `/frontend-design`'s **HTML Structure** template (with `<link rel="stylesheet"
href="design-system.css">` and screen-specific overrides only) and the **Design System CSS**
section (token categories, base component styles, required structure). Read that skill definition
before starting migration so you know exactly what the end state looks like.

$ARGUMENTS is optional. If provided, it is a comma-separated list of use case IDs (e.g.,
`UC-001,UC-002`) to migrate selectively. If omitted, all `UC-*-design.html` files are migrated.

## Inputs

| Input | Location | Required |
|-------|----------|----------|
| `/frontend-design` skill definition | `nexa-claude-core/skills/frontend-design/SKILL.md` | Yes — defines the target HTML structure and design system CSS format |
| Existing design artifacts | `docs/designs/UC-*-design.html` | Yes — at least one |
| Design system CSS | `docs/designs/design-system.css` | Optional — created if missing |

## Output

| Output | Location |
|--------|----------|
| Design system CSS | `docs/designs/design-system.css` (created or updated) |
| Migrated design artifacts | `docs/designs/UC-*-design.html` (rewritten in place) |
| Migration report | Printed to console — summary of changes per file |

## DO NOT

- Change the **HTML structure** of any design artifact — sections, data attributes, screen layout,
  and navigation flow must remain identical
- Remove or rename CSS classes used in the HTML
- Change any `data-uc-step`, `data-uc-alt`, or `data-entity` attributes
- Alter the content or text of any design artifact
- Delete the original files — this is an in-place migration
- Introduce CDN links, remote CSS/JS, or any internet dependencies
- Invent new visual styles — extract only what already exists in the inline CSS

## Workflow

### Phase 1 — Inventory

1. Read the `/frontend-design` skill definition from `nexa-claude-core/skills/frontend-design/SKILL.md`
   to understand the target HTML structure and design system CSS format. This is your reference for
   what every migrated file must look like.
2. List all `UC-*-design.html` files in `docs/designs/`. If $ARGUMENTS is provided, filter to only
   the specified use case IDs.
3. If no design files are found, stop and inform the user.
4. Check if `docs/designs/design-system.css` already exists. Record whether this is a creation or
   an update scenario.

### Phase 2 — Extract tokens

5. Read each design HTML file and extract all inline `<style>` content.
6. Across all files, identify and catalog:
   - **Colors**: all hex values, rgb/rgba values, hsl values, and named colors used for
     `color`, `background`, `background-color`, `border-color`, `box-shadow`, `outline-color`
   - **Typography**: `font-family` stacks, `font-size` values, `font-weight` values, `line-height`
   - **Spacing**: `margin`, `padding`, `gap` values that form a consistent scale
   - **Border radii**: `border-radius` values
   - **Shadows**: `box-shadow` values
   - **Borders**: `border` shorthand and `border-width`/`border-style`/`border-color` values
7. Deduplicate and group the extracted values. Map them to the design system token categories:

   | Token | How to derive |
   |-------|--------------|
   | `--color-primary` | The most prominent brand/action color (buttons, links, active states) |
   | `--color-primary-hover` | Darker/lighter variant of primary used on `:hover` |
   | `--color-secondary` | Second most common accent color |
   | `--color-bg` | The `body` or outermost container background |
   | `--color-surface` | Card/panel/section backgrounds |
   | `--color-border` | Most common border color |
   | `--color-text` | Primary text color (`body` or base `color`) |
   | `--color-text-muted` | Secondary/lighter text (labels, hints, timestamps) |
   | `--color-error` | Red/danger color used in `.state--error` or error messages |
   | `--color-success` | Green color used in `.state--success` or success messages |
   | `--color-warning` | Yellow/amber color used for warnings |
   | `--font-body` | The `font-family` used for body text |
   | `--font-heading` | The `font-family` used for headings (or same as body) |
   | `--font-mono` | Monospace font if present |
   | `--font-size-sm` | Smallest font size in use |
   | `--font-size-base` | Default body font size |
   | `--font-size-lg` | Large text (subheadings, emphasis) |
   | `--font-size-xl` | Largest text (page titles, h1) |
   | `--spacing-xs` | Smallest spacing value |
   | `--spacing-sm` | Small spacing value |
   | `--spacing-md` | Medium/default spacing value |
   | `--spacing-lg` | Large spacing value |
   | `--spacing-xl` | Largest spacing value |
   | `--radius-sm` | Smallest border-radius |
   | `--radius-md` | Medium border-radius |
   | `--radius-lg` | Largest border-radius |
   | `--border-default` | Most common border shorthand (e.g., `1px solid var(--color-border)`) |
   | `--shadow-sm` | Subtle box-shadow |
   | `--shadow-md` | More prominent box-shadow |

8. If `design-system.css` already exists, read it and **merge**: keep existing tokens, add any new
   ones found in the designs, and flag conflicts (same token, different value) in the migration
   report. Prefer the existing `design-system.css` value for conflicts — do not overwrite
   established tokens silently.

### Phase 3 — Create or update design-system.css

9. If `design-system.css` does not exist, create it using the **Write** tool with the full
   structure defined in the `/frontend-design` skill's **Design System CSS** section:
   - `:root` block with all token categories
   - Base reset & typography
   - Component styles (buttons, forms, tables, cards, nav)
   - State variants (`.state--loading`, `.state--empty`, `.state--error`, `.state--success`)
   - Design metadata & screen structure (`.design-meta`, `.screen`, `.screen-map`)
   - Responsive breakpoints

10. If `design-system.css` already exists, use the **Edit** tool to add any new tokens or component
   styles that were found in the designs but missing from the file.

### Phase 4 — Rewrite design HTML files

11. For each design HTML file, use the **Edit** tool to:

    a. **Replace the `<style>` block in `<head>`**: Remove the full inline `<style>...</style>` and
       replace with:
       ```html
       <!-- Shared design system — single source of truth for tokens and base styles -->
       <link rel="stylesheet" href="design-system.css">

       <style>
         /* ── Screen-specific overrides only ──
            Layout rules unique to THIS screen go here.
            All color, typography, and spacing values MUST use CSS custom properties
            from the design system (e.g., var(--color-primary), var(--font-body), var(--spacing-md)).
            Do NOT hardcode hex colors, font stacks, or pixel spacing values. */

         /* [screen-specific layout rules extracted from the original inline styles] */
       </style>
       ```

    b. **Migrate values to CSS custom properties**: In the remaining screen-specific `<style>` block,
       replace every hardcoded value with its corresponding CSS variable:
       - `#3b82f6` → `var(--color-primary)`
       - `16px` padding → `var(--spacing-md)` (if it maps to the medium spacing token)
       - `'Inter', sans-serif` → `var(--font-body)`
       - And so on for all token categories

    c. **Separate shared vs screen-specific styles**: Move styles that match design-system.css
       component classes (buttons, forms, state variants, `.design-meta`, `.screen`, etc.) out of
       the inline block entirely — they are now provided by the linked stylesheet. Keep only layout
       rules that are unique to this specific screen.

12. After editing each file, verify that the HTML structure is unchanged — same sections, same
    classes, same data attributes, same content.

### Phase 5 — Report

13. Print a migration summary:
    - Number of files migrated
    - Whether `design-system.css` was created or updated
    - Tokens extracted (list the token names and their values)
    - Any conflicts encountered (token existed with a different value)
    - Any values that could not be cleanly mapped to a token (keep as hardcoded with a TODO comment)

## Verification

After migration, each design HTML file should:

- Start with `<!DOCTYPE html>`
- Contain `<link rel="stylesheet" href="design-system.css">` in `<head>`
- Have an inline `<style>` block with only screen-specific overrides using `var(--*)` properties
- Have **zero** hardcoded hex colors, font-family stacks, or spacing magic numbers in the `<style>` block
- Have identical HTML structure (same elements, classes, data attributes, content) as before migration
- Render identically in a browser when `design-system.css` is in the same directory
