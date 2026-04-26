# Snapshot capture instructions

This folder holds the PNG figures used in **The AI Sprint Playbook** PDF, on the landing page, and in the case study. Every artifact the Nexa methodology produces is shown to the reader as a real screenshot — not a stock illustration. This document tells you exactly what to capture, how, and where to save it.

> Convention: use `docs/snapshots/` (singular folder), not `docs/screenshots/`. This matches `/design-screens` and other Nexa skills.

---

## 1 · Naming convention

```
docs/snapshots/
├── 01-requirements-catalog.png
├── 02-entity-model.png
├── 03-use-cases-diagram.png
├── 04-wireframe-overview.png
├── 04a-wireframe-UC-002.png
├── 04b-wireframe-UC-001.png
├── 05-uc-002-spec.png
├── 06a-uc-002-design-default.png
├── 06b-uc-002-design-success.png
├── 06c-uc-002-design-error-invalid-url.png
├── 06d-uc-002-design-error-rate-limit.png
├── 07a-uc-001-design-loaded.png
├── 07b-uc-001-design-empty.png
├── 07c-uc-001-design-loading.png
├── 08a-uc-003-design-302-trace.png
├── 08b-uc-003-design-410.png
└── 08c-uc-003-design-451.png
```

- **Two-digit prefix** = section order in the PDF. This keeps the folder readable in alphabetical sort.
- **`UC-XXX`** suffixes match the use case ID exactly (uppercase, hyphenated).
- **State names** are short and descriptive (`success`, `error-invalid-url`, `loading`, `loaded`, `empty`).
- **Lowercase**, hyphenated, no spaces.
- All files are **PNG** at **2× DPR** (Retina-ready).

---

## 2 · Quality bar

| Property | Value |
|---|---|
| Format | PNG, lossless |
| Width | 1440 px (CSS) → 2880 px actual at 2× |
| Background | Use the artifact's own background — do **not** add browser chrome unless explicitly noted |
| Browser | Chrome / Edge / Brave / Arc — whatever supports DevTools full-page capture |
| Locale | English (matches the wireframe's `lang="en"`) |
| Cursor | Hidden — no mouse cursor in any frame |
| Devtools panel | Closed during capture |
| Window size | 1440×900 minimum; for "full page" captures the height is whatever the page demands |
| Fonts | Allow ~3 seconds after page load before capturing — Bricolage Grotesque must be loaded, not falling back to serif |

If a screenshot is going to be cropped for the PDF, **export at full size first**, crop in post.

---

## 3 · Tools

You can use any of the following — pick what's already on your machine.

### Browser-native (recommended for HTML)

**Chrome / Edge:**
1. Open the file (e.g. `file:///.../docs/wireframes/index.html`).
2. `Cmd+Option+I` (Mac) / `F12` (Windows) — open DevTools.
3. `Cmd+Shift+P` → type "screenshot" → choose **"Capture full size screenshot"**.
4. PNG saves to your Downloads folder.

**Firefox:**
1. Open the file.
2. Right-click anywhere on the page → **Take Screenshot** → **Save full page**.

### CLI (reproducible, scriptable)

```bash
# One-shot full-page capture with headless Chrome
npx puppeteer-screenshot \
  --url "file://$(pwd)/docs/wireframes/index.html" \
  --output "docs/snapshots/04-wireframe-overview.png" \
  --width 1440 \
  --full-page
```

Or with Playwright (already a project dependency in `nexa-starter-shortener`):

```js
// tools/snap.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('file://' + process.cwd() + '/docs/wireframes/index.html');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'docs/snapshots/04-wireframe-overview.png', fullPage: true });
await browser.close();
```

Run with `node tools/snap.mjs`.

### Diagram renderers

- **PlantUML** (`docs/use_cases.puml`):
  - Online: paste the file contents into [plantuml.com/plantuml](https://www.plantuml.com/plantuml) → PNG.
  - CLI: `plantuml -tpng -o ../snapshots docs/use_cases.puml` (requires `plantuml` installed).
  - VS Code: install the *PlantUML* extension, open the `.puml`, `Alt+D` to preview, right-click → Export.
- **Mermaid** (the ER block inside `docs/entity_model.md`):
  - Online: copy the Mermaid block into [mermaid.live](https://mermaid.live) → Actions → PNG.
  - CLI: `npx -p @mermaid-js/mermaid-cli mmdc -i entity_model.md -o ../snapshots/02-entity-model.png` (extracts the Mermaid block).

---

## 4 · What to capture (per-artifact checklist)

### 4.1 — `01-requirements-catalog.png`

**Source:** `docs/requirements.md`, rendered as Markdown.

**Goal:** show the FR + NFR tables side-by-side, demonstrating that requirements are structured, measurable, and machine-readable.

**Capture method:**
1. Open `docs/requirements.md` in a Markdown previewer (VS Code, Obsidian, or `mdcat`).
2. Set the previewer to a wide layout (1400px+).
3. Capture either the full page **or** a tight crop showing all three tables (FR, NFR, Constraints) with their headers visible.

**Must include:** the FR table header row, at least the first 4 NFR rows, and at least one constraint. The reader should see "this is structured data, not prose."

---

### 4.2 — `02-entity-model.png`

**Source:** the Mermaid block inside `docs/entity_model.md`.

**Goal:** show the ER diagram with both entities and the relationship arrow.

**Capture method:**
- Render with mermaid.live or `mmdc`.
- The output should show **USER** and **LINK** boxes connected by `||--o{ "owns"`.
- Background: white or theme-light. The PDF page is white, so a transparent background works too.

**Must include:** both entity names and the relationship label. **Must NOT include** attributes inside the boxes — those live in the attribute tables, not the diagram.

---

### 4.3 — `03-use-cases-diagram.png`

**Source:** `docs/use_cases.puml`.

**Goal:** show the actor → use-case map plus the technical-task dependency.

**Capture method:** PlantUML render (online or CLI).

**Must include:** both actors (Anonymous Visitor, Link Owner), all three use cases (UC-001/002/003), the TT-001 dashed-border node, and the `<<requires>>` arrow from UC-001 to TT-001.

---

### 4.4 — `04-wireframe-overview.png`

**Source:** `docs/wireframes/index.html`, full-page capture from the top.

**Goal:** establish the visual identity. This is the first design artifact the reader sees.

**Capture method:** browser full-page screenshot at 1440px width. **Wait 3 seconds for fonts.**

**Must include:** the header strip with `lnk.sh` logo, the "Screens" table of contents, and at least the start of the UC-002 screen card. The reader should perceive: "this is not a gray sketch; this is a designed wireframe."

---

### 4.5 — `04a-wireframe-UC-002.png` and `04b-wireframe-UC-001.png`

**Source:** `docs/wireframes/index.html#UC-002` and `#UC-001`.

**Goal:** isolate each screen card so it can sit beside its corresponding design HTML in the PDF.

**Capture method:**
1. Navigate to the anchor (`#UC-002`).
2. Capture only the screen card (the `id="UC-002"` div). Easiest: right-click → Inspect → right-click the node → "Capture node screenshot."

**Must include:** the screen header (UC ID + name + badges), the viewport with browser chrome and the screen content, and at least one `wf-annotation` block.

---

### 4.6 — `05-uc-002-spec.png`

**Source:** `docs/use_cases/UC-002.md`, rendered Markdown.

**Goal:** show how a use case spec looks — overview table, numbered scenario steps, alternative flows.

**Capture method:** open in Markdown previewer, capture full page or first ~80% of the document.

**Must include:** the Overview table (with UC-002 ID and primary actor), the Main Success Scenario list (steps 1–10), and at least one alternative flow (e.g., A1 Invalid URL).

---

### 4.7 — `06a` … `06d` — UC-002 design states

**Source:** `docs/designs/UC-002-design.html`.

The file shows 6 states stacked. Capture each state's card individually:

| File | What to crop |
|---|---|
| `06a-uc-002-design-default.png` | The "State 01 · Default — empty form" card (state label + viewport + annotations) |
| `06b-uc-002-design-success.png` | The "State 03 · Success — link created" card |
| `06c-uc-002-design-error-invalid-url.png` | The "State 04 · Error A1 — invalid destination URL" card |
| `06d-uc-002-design-error-rate-limit.png` | The "States 06 · Generic rejections" card (showing both A2 blocklist and A5 rate limit) |

**Capture method:** scroll to each state, use "Capture node screenshot" on the wrapping `theme-card` div.

**Must include:** the state label badge, the viewport with the actual UI, and at least one design annotation block.

---

### 4.8 — `07a` … `07c` — UC-001 design states

**Source:** `docs/designs/UC-001-design.html`.

| File | What to crop |
|---|---|
| `07a-uc-001-design-loaded.png` | "State 01 · Loaded — owner has links" |
| `07b-uc-001-design-empty.png` | "State 02 · Empty (A1)" |
| `07c-uc-001-design-loading.png` | "State 03 · Loading — Suspense fallback" |

---

### 4.9 — `08a` … `08c` — UC-003 design states

**Source:** `docs/designs/UC-003-design.html`.

| File | What to crop |
|---|---|
| `08a-uc-003-design-302-trace.png` | "Path 01 · Success" — the HTTP request/response trace card |
| `08b-uc-003-design-410.png` | "Path A2 · 410 Gone" |
| `08c-uc-003-design-451.png` | "Path A3 · 451 Unavailable" |

The 302-trace screenshot is the most important — it visually demonstrates that UC-003 has no UI on the success path.

---

## 5 · Future captures (Step 12 — implementation)

When the implementation lands, add:

| File | Source |
|---|---|
| `09-implementation-action.png` | `app/actions/shorten.ts` in VS Code with syntax highlighting |
| `09a-implementation-route.png` | `app/[slug]/route.ts` |
| `10-vitest-output.png` | Terminal showing `vitest run` with all green |
| `10a-playwright-output.png` | Terminal showing `playwright test` with all green |
| `11-evaluate-output.png` | `/evaluate` skill output: spec ✓ design ✓ tests ✓ |
| `12-merged-pr.png` | GitHub PR page showing green CI matrix and "Merged" status |

These are the proof that the methodology closed the loop from spec to merged code.

---

## 6 · Capture checklist

Before saving a screenshot, verify:

- [ ] Filename matches the convention exactly (lowercase, hyphenated, two-digit prefix, UC ID uppercase)
- [ ] Resolution is 2× DPR (open the PNG, confirm pixel dimensions are at least 2880px wide for full-page captures)
- [ ] Bricolage Grotesque is rendering (the headings should be the curvy, slightly-flared display font — not Times or system serif)
- [ ] No DevTools panel visible in the frame
- [ ] No mouse cursor visible
- [ ] Mid-state captures show the intended state, not a transition (e.g., the `submitting` capture must show the spinner mid-spin and the disabled CTA — not pre-click)
- [ ] PNG file is < 2 MB; if larger, run `pngquant --quality=80-95 file.png --output file.png --force`

---

## 7 · After capture

1. Save into `docs/snapshots/`.
2. Commit with message: `docs(lead-magnet): add snapshots for [section name]`.
3. The PDF assembly step (Step 9 in `CHECKPOINT.md`) consumes these files directly. The order on disk is the order in the PDF.

---

## 8 · Re-capturing when the artifacts change

Re-shoot **all** screenshots affected by a change. The PDF must reflect the current state of the artifacts, not an older revision. If you change the theme or refactor a use case spec, walk through the checklist above again.

A future improvement: a `tools/snap-all.mjs` Playwright script that captures every screenshot in one run, pinned in the repo. Add it when there are more than ~25 snapshots to maintain.
