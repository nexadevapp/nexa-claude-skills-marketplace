# Lead Magnet — Checkpoint

**Branch:** `lead-magnet`
**Date started:** 2026-04-26
**Working dir:** `/Users/robert/Documents/dev/nexa/nexa-claude-skills-marketplace`

---

## What we're building

A lead magnet for the Nexa Claude Skills Marketplace to attract paying clients.

**Three-part package:**
1. **"The AI Sprint Playbook"** — 18–22 page gated PDF
2. **`nexa-starter-shortener`** — public reference repo (the proof point)
3. **5-min screen recording** — hero asset embedded on the landing page

**Email capture funnel:**
- Visitor watches ungated 5-min video teaser
- Enters email → receives PDF + reference repo link
- Installs `nexa-claude-core` (free) and forks the reference repo
- Hits the delivery ceiling → upsells to `nexa-claude-nextjs` (paid)

---

## Business model framing

| Tier | Product | Value |
|------|---------|-------|
| Free | `nexa-claude-core` + reference repo | Requirements → Spec → Design |
| Paid | `nexa-claude-nextjs` | Implement → Test → Evaluate → Sprint |

The Core alone is not sufficient to ship — it stops before implementation. That gap is the natural upsell moment.

Future: additional stack plugins (Rails, Django, Laravel) all follow the same free Core / paid stack model.

---

## Reference project: `nexa-starter-shortener`

A URL shortener with three actors and six use cases. Chosen because:
- Not a cliché Todo app
- Rich enough to show a real entity model and non-trivial business rules
- Small enough to fit in a demo

**Three use cases to implement:**
- `UC-001` — List my links (Link Owner)
- `UC-002` — Shorten a URL (Anonymous Visitor) ← hero use case, spec already drafted
- `UC-003` — Redirect to destination (Anonymous Visitor)

**Entities:** `Link`, `Click`, `User`, `AbuseReport`

**Actors:** Anonymous Visitor, Link Owner, Moderator

**Pre-drafted UC-002 spec** (use this verbatim when running `/use-case-spec`):

```
# UC-002: Shorten a URL

## Actors
- Primary: Anonymous Visitor
- Secondary: Link Owner (if authenticated)

## Preconditions
- The shortener service is reachable.
- The visitor has a destination URL they want to shorten.

## Main Success Scenario
1. Visitor opens the home page.
2. Visitor pastes a destination URL into the input field.
3. Visitor optionally provides a custom slug (3–32 chars, [a-z0-9-]).
4. Visitor submits the form.
5. System validates the destination URL (RFC 3986, http/https only).
6. System checks the destination against the abuse blocklist.
7. System generates a unique 7-char slug if no custom slug was provided.
8. System persists the Link entity with `createdAt` and an optional `ownerId`.
9. System returns the shortened URL and copies it to the visitor's clipboard.

## Alternative Flows
- 5a. Invalid URL → System shows inline validation error; flow returns to step 2.
- 6a. URL on blocklist → System rejects with a generic "cannot be shortened" message; logs the attempt.
- 7a. Slug collision (custom slug taken) → System shows "slug unavailable"; flow returns to step 3.
- 7b. Slug collision (generated) → System retries up to 5 times before failing with 503.

## Postconditions
- Success: A new Link row exists; a shortened URL is returned.
- Failure: No Link row is created; the visitor sees an actionable error.

## Business Rules
- BR-01: Slugs are case-sensitive and immutable once issued.
- BR-02: Anonymous links expire after 30 days; owned links do not.
- BR-03: A single IP cannot create more than 20 links per hour.

## Non-Functional
- p95 response time < 200ms under 100 RPS.
- Slug generation must remain unique under concurrent writes (DB-level constraint, not app-level lock).

## Traceability
- FR-04 (Public link creation), FR-07 (Abuse prevention), NFR-02 (Latency)
```

---

## Reference repo structure (target)

```
nexa-starter-shortener/
├── README.md
├── CLAUDE.md                          # /setup-project-rules output
├── .claude-plugin/                    # Nexa Core preinstalled
├── docs/
│   ├── requirements.md
│   ├── entity-model.md                # Mermaid ER
│   ├── use-cases.puml                 # PlantUML diagram
│   ├── wireframe.html
│   ├── use-cases/
│   │   ├── UC-001-list-links.md
│   │   ├── UC-002-shorten-url.md      # hero spec
│   │   └── UC-003-redirect.md
│   └── designs/
│       ├── UC-001-list-links.html
│       ├── UC-002-shorten-url.html
│       └── UC-003-redirect.html
├── src/                               # Next.js app, fully working
└── tests/                             # Vitest + Playwright, all green
```

---

## Pending decision

**Where does the reference repo live?**
- Option A: inside this marketplace repo as `nexa-starter-shortener/` at the root
- Option B: separate public GitHub repo (better for forking/starring, cleaner distribution)

**Recommendation:** Option B (separate repo), but start building artifacts inside this repo under `docs/lead-magnet/nexa-starter-shortener/` to keep everything in one place during construction, then extract to a standalone repo before publishing.

This decision needs to be confirmed before scaffolding the repo.

---

## Build order (dogfooding approach)

All artifacts are generated by running the Nexa skills on the shortener project — output is authentic and screenshots are real.

- [ ] **Step 1** — Confirm reference repo location (see pending decision above)
- [ ] **Step 2** — Scaffold the repo + CLAUDE.md (`/setup-project-rules`)
- [ ] **Step 3** — Generate requirements (`/requirements`)
- [ ] **Step 4** — Generate entity model (`/entity-model`)
- [ ] **Step 5** — Generate use case diagram (`/use-case-diagram`)
- [ ] **Step 6** — Generate wireframe (`/generate-wireframe`)
- [ ] **Step 7** — Write use case specs × 3 (`/use-case-spec`)
- [ ] **Step 8** — Generate screen designs × 3 (`/design-screens`)
- [ ] **Step 9** — Draft PDF sections (using artifact screenshots from steps 3–8)
- [ ] **Step 10** — Record 5-min screen recording walkthrough
- [ ] **Step 11** — Build landing page copy
- [ ] **Step 12** — Implement Next.js app + tests (demonstrates the paid layer)

---

## PDF outline: "The AI Sprint Playbook"

**Subtitle:** How engineering teams ship production code with AI agents — without the slop.

| Section | Pages | Content |
|---------|-------|---------|
| 1. Cold open | 1 | "The 200-line PR that took 4 hours to review" — relatable failure scene |
| 2. Five failure modes | 2 | Silent assumptions, Spec amnesia, Phantom abstractions, Verification theater, Scope drift |
| 3. The method | 1 | Single diagram: Inception → Elaboration → Construction → Verification → Completion |
| 4. Walkthrough | 10–12 | `lnk.sh` shipped in one sprint — screenshots of every artifact |
| 5. Scaling | 2 | Sprint prepare → kickoff → deliver → complete |
| 6. CTA | 1 | Free: install Core / Paid: Next.js plugin / Book a call |

**§4 sub-sections** (one per skill, ~1–2 pages each with real artifact screenshots):
- `/requirements` — catalog output
- `/entity-model` — Mermaid ER
- `/use-case-diagram` — PlantUML
- `/use-case-spec` — UC-002 spec
- `/design-screens` — wireframe + screen design HTML
- `/implement` + `/vitest-test` — code + test diff
- `/evaluate` — conformance check output
- Result: link to merged PR in public repo, green CI

Each sub-section ends with a **"What just happened"** callout tying back to §2's failure modes.

---

## Context on the marketplace

- **`nexa-claude-core`** — stack-agnostic, 13 skills, covers requirements through spec/design
- **`nexa-claude-nextjs`** — Next.js stack, 16 skills, covers implementation through sprint completion
- Both live in this repo: `/Users/robert/Documents/dev/nexa/nexa-claude-skills-marketplace`
- Git user: Robert Sicoie

## Resume instructions

1. Read this file completely
2. Confirm the pending repo location decision
3. Start at the first unchecked step in the build order
4. Screenshot every skill output as you go — these become PDF figures
