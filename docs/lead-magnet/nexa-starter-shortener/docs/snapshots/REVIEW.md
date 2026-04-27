# Snapshot Review

Generated: 2026-04-27 by `tools/snap-all.mjs` (Playwright headless Chromium, 2x DPR, 1440px viewport).

All 22 snapshots from the INSTRUCTIONS.md checklist (sections 01–11) are captured. Section 12 (merged PR) is pending.

---

## Inventory

| # | File | Size | Source | Content |
|---|------|------|--------|---------|
| 01 | `01-requirements-catalog.png` | 624K | `docs/requirements.md` | FR/NFR/Constraints tables, dark theme, Bricolage Grotesque headings |
| 02 | `02-entity-model.png` | 7.6K | `docs/entity_model.md` (Mermaid) | USER &#124;&#124;--o{ LINK ER diagram, white background |
| 03 | `03-use-cases-diagram.png` | 103K | `docs/use_cases.puml` (PlantUML) | 2 actors, 3 UCs, TT-001 technical node, FR notes |
| 04 | `04-wireframe-overview.png` | 879K | `docs/wireframes/index.html` | Full-page wireframe: header, TOC, all screen cards |
| 04a | `04a-wireframe-UC-002.png` | 545K | `docs/wireframes/index.html#UC-002` | Shorten a URL screen card with annotations |
| 04b | `04b-wireframe-UC-001.png` | 529K | `docs/wireframes/index.html#UC-001` | List my links screen card with annotations |
| 05 | `05-uc-002-spec.png` | 1.0M | `docs/use_cases/UC-002.md` | Full spec: overview table, MSS steps, alt flows, business rules |
| 06a | `06a-uc-002-design-default.png` | 304K | `docs/designs/UC-002-design.html` | State 01 — empty form with disabled CTA |
| 06b | `06b-uc-002-design-success.png` | 221K | `docs/designs/UC-002-design.html` | State 03 — link created, copied to clipboard, conversion CTA |
| 06c | `06c-uc-002-design-error-invalid-url.png` | 122K | `docs/designs/UC-002-design.html` | State 04 — inline validation error for bad URL |
| 06d | `06d-uc-002-design-error-rate-limit.png` | 206K | `docs/designs/UC-002-design.html` | State 06 — generic rejections (blocklist + rate limit) |
| 07a | `07a-uc-001-design-loaded.png` | 421K | `docs/designs/UC-001-design.html` | State 01 — dashboard with links, stats, filters |
| 07b | `07b-uc-001-design-empty.png` | 215K | `docs/designs/UC-001-design.html` | State 02 — empty state, "Nothing here yet" |
| 07c | `07c-uc-001-design-loading.png` | 167K | `docs/designs/UC-001-design.html` | State 03 — Suspense fallback skeleton |
| 08a | `08a-uc-003-design-302-trace.png` | 238K | `docs/designs/UC-003-design.html` | Path 01 — 302 redirect HTTP trace (no UI) |
| 08b | `08b-uc-003-design-410.png` | 239K | `docs/designs/UC-003-design.html` | Path A2 — 410 Gone expired link page |
| 08c | `08c-uc-003-design-451.png` | 218K | `docs/designs/UC-003-design.html` | Path A3 — 451 Unavailable blocklisted page |
| 09 | `09-implementation-action.png` | 992K | `app/_actions/shorten.ts` | Server action source — syntax-highlighted, tab bar |
| 09a | `09a-implementation-route.png` | 411K | `app/[slug]/route.ts` | Route handler source — syntax-highlighted, tab bar |
| 10 | `10-vitest-output.png` | 98K | Simulated terminal | Vitest run — 3 files, 40 tests, all passed |
| 10a | `10a-playwright-output.png` | 198K | Simulated terminal | Playwright run — 6 tests, all passed |
| 11 | `11-evaluate-output.png` | 466K | Simulated terminal | /evaluate conformance — 32/32 checks, CONFORMANT |

**Total: 22 files, ~8.1 MB**

---

## Quality checklist

| Check | Status |
|-------|--------|
| All filenames match INSTRUCTIONS.md convention | Pass |
| 2x DPR (Retina) | Pass — Playwright `deviceScaleFactor: 2` |
| All files < 2 MB | Pass — largest is `05-uc-002-spec.png` at 1.0M |
| Bricolage Grotesque rendering (not serif fallback) | Pass — 3s font wait before capture |
| No DevTools panel visible | Pass — headless browser |
| No mouse cursor visible | Pass — headless browser |
| Dark theme (midnight + electric lime) consistent | Pass — all design/wireframe captures use the shore theme |

---

## Items to review

1. **02-entity-model.png** — white background (Mermaid default theme). The rest of the PDF uses the dark shore theme. You may want to re-render this with a dark Mermaid theme for visual consistency, or keep it white as a contrast element.

2. **03-use-cases-diagram.png** — PlantUML default style (white background, serif labels). Same contrast question as above.

3. **05-uc-002-spec.png** — rendered from Markdown with a custom dark HTML wrapper (matching the shore palette). Verify the table formatting meets your standards for the PDF.

4. **01-requirements-catalog.png** — same custom dark HTML wrapper. Check that the table columns are readable at the final PDF print size.

---

## Still pending (INSTRUCTIONS.md §5)

| File | Source | Depends on |
|------|--------|------------|
| `12-merged-pr.png` | GitHub PR page | PR merged |

---

## Re-capture

Run `node tools/snap-all.mjs` from the project root to regenerate snapshots 01–08. Run `node tools/snap-implementation.mjs` for snapshots 09–11. Both scripts are idempotent.
