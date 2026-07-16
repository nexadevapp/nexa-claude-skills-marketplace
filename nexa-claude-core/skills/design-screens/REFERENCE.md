# Design Screens Reference

Detailed templates for `design-screens/SKILL.md`. Worked reference designs (not duplicated
here) live in this skill's [examples/](examples/) directory — see the `## Examples` section
of `SKILL.md` for what each example file demonstrates.

## Romanian i18n Example and Common Mistakes

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

## Mobile Layout HTML Structure

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

## HTML Structure Template

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

## Theme CSS Required Sections

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
