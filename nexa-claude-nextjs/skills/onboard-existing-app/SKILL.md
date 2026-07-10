---
name: onboard-existing-app
description: >
  Retrofits an existing Next.js codebase into the Nexa Agentic Engineering methodology by
  reverse-engineering a requirements catalog, entity model, use case diagram, and use case
  specs from the live code (and from BMAD-method artifacts under `_bmad/`, when present), then
  auditing cross-cutting infrastructure and creating thin-pointer GitHub issues for
  already-shipped work. Use when the user asks to "onboard this codebase", "onboard an
  existing app", "retrofit Nexa onto my project", "adopt the Nexa pipeline for an existing
  Next.js app", "reverse-engineer requirements from code", or mentions bringing a brownfield
  or already-built Next.js project under Nexa/`/deliver-use-case`/`/resolve-bug` for future
  work.
---

# Onboard Existing App

## Instructions

Run the onboarding pipeline for the current project — an existing Next.js codebase with no
(or partial) Nexa artifacts. Optional `$ARGUMENTS`: `quick` or `full` to preselect scan depth
(see Step 0.4); otherwise ask.

This produces the artifacts every other Nexa skill assumes already exist (`docs/requirements.md`,
`docs/entity_model.md`, `docs/use_cases.puml`, `docs/use_cases/UC-XXX.md`) *from the existing
code*, marks already-shipped features as such rather than queuing them for re-implementation,
and reports infrastructure gaps without touching anything that already works.

## Prerequisites

- An existing Next.js App Router codebase (`app/` directory).
- `gh` CLI authenticated, for Step 5 tracking.
- Nothing else is required — `prisma/schema.prisma` and `_bmad/` are both optional inputs
  this skill detects and uses if present (Steps 0.1 and 2).

## DO NOT

- Modify or refactor any existing application code/behavior — this is a documentation and
  detection pass only
- Overwrite existing Nexa docs without going through the Step 0.2 three-way prompt
- Auto-run any `setup-*` skill in Step 4, ever — report the gap and recommend the command
- Assert a UC as `Status: Done` when its behavior is ambiguous in the code — use `Review`
- Trust a BMAD story's `Status: done` without independently verifying it against the live
  route/code — BMAD's record can drift from what's actually deployed
- Let parallel `use-case-archaeologist` agents write to any file except their own assigned
  `UC-XXX.md` — the orchestrator (this skill, main context) does the one sequential append
  into `docs/requirements.md` and `docs/use_cases.puml`
- Attempt entity-model reverse-engineering against a non-Prisma stack — flag and skip instead
- Generate wireframes or design specs for existing screens — `/generate-wireframe` and
  `/design-screens` are prospective planning tools; reverse-capturing a live app's rendered UI
  as a design artifact is a distinct capability this skill deliberately doesn't attempt.
  `/evaluate`'s Design Conformance and `/audit`'s Screen Fidelity lens will simply skip for
  onboarded UCs until a design doc exists via the normal flow on future work
- Auto-generate `BUG-XXX`/`TT-XXX` docs from BMAD's `deferred-work.md` — mention counts/severity
  in the Step 6 report and point at `/report-bug` instead; that needs `resolve-bug`'s own
  reproduction rigor, not a doc-mapping pass

## Gates

- **No Nexa Rules Gate section here** — Step 5 of this skill is what establishes that gate's
  `<!-- NEXA_RULES_CONFIGURED -->` marker via `/setup-project-rules`. Requiring it upfront
  would be circular, the same reason `setup-project-rules` itself doesn't gate on it.
- **No Sprint Branch Gate** — this skill runs on `main`, not a sprint branch (documentation
  and read-only detection, not application feature code). It's listed in
  `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`'s Exceptions section.
- **`PROJECT_READINESS.md` is audited, not gated on** — Step 4 walks its checklist and reports
  gaps; it does not block this skill from completing (it blocks *implementation* work later,
  which is exactly what Step 4's report exists to prepare the user for).

## Pipeline

---

### Step 0: Discovery + Mode Selection

#### 0.1 BMAD seed check

If `_bmad/` exists, resolve its config for artifact paths — don't hardcode `_bmad-output/`,
it's user-configurable:

```
cat _bmad/bmm/config.yaml 2>/dev/null || cat _bmad/core/config.yaml 2>/dev/null
```

Extract `planning_artifacts:` and `implementation_artifacts:` values. When found, treat as a
**primary seed**, not a nice-to-have:

- `<planning_artifacts>/prd.md` — `#### FR-N: <title>` sections, already near 1:1 with Nexa's
  `FR-XXX`.
- `<planning_artifacts>/epics.md` — `### Epic N` / `### Story N.M: <title>` — BMAD has already
  clustered work; each Story is roughly one candidate UC/TT, so Step 0.6's clustering only
  needs to run for routes no story covers.
- `<implementation_artifacts>/<epic>-<story>-<slug>.md` — per-story `Status:
  done|review|in-progress|deferred`, a `## Story` block already in `As a X, I want Y, so that
  Z` form, and `## Acceptance Criteria` in Given/When/Then referencing the same `FR-N` tags.
  `Status: done` is direct evidence for `Status: Done` on the matching UC — more reliable than
  inferring completeness from code alone — but still gets verified against the live route in
  Step 3, never transcribed blind.
- `<implementation_artifacts>/deferred-work.md` — severity-tagged, file:line-cited past review
  findings. Note the count/severity in the Step 6 report; do not act on it here (see DO NOT).

Build a match list: `{cluster candidate → BMAD story path | none}`.

#### 0.2 Existing-docs check (expect hybrid state)

A real project can have partial/full Nexa docs layered on top of an earlier BMAD phase, or
neither, or both — never assume `docs/` is empty or fully-Nexa. If `docs/requirements.md`,
`docs/entity_model.md`, `docs/use_cases.puml`, or `docs/onboarding/` already exist, stop and
present:

```
ONBOARDING: existing Nexa artifacts found

[list what exists]

How should I proceed?
1. Rescan — re-run discovery; skip clusters that already have a UC doc, only process newly
   discovered ones (no diffing/merging of existing docs in this version).
2. Deep-dive one area — name a specific cluster or infra concern to redo.
3. Cancel — make no changes.
```

Wait for a reply before continuing.

#### 0.3 Resumability

Check for `docs/onboarding/scan-state.json`:

```json
{ "mode": "quick|full", "clusters": [{"id": "UC-001", "status": "pending|done", "source": "bmad|code"}], "completed_steps": ["0","1"] }
```

If present and incomplete, resume from the last unfinished cluster/step instead of
restarting. Write/update this file after every completed step and every completed cluster —
a killed or multi-session Full run should not have to start over.

#### 0.4 Scan depth

If not given via `$ARGUMENTS`, ask:

```
ONBOARDING: choose scan depth

1. Quick — full skeleton (requirements catalog, entity model, use case diagram, infra gap
   report, GitHub issues) but UC specs are cheap Draft stubs (name, primary actor, one-line
   goal) for /engineer-requirements to flesh out later. Fast, good first look or a very large
   app.
2. Full — Quick's output plus fully grounded UC specs (MSS, alt-flows, business rules cited
   to file:line), BMAD-seeded where available. The complete pipeline.
```

#### 0.5 Crawl the codebase (read-only)

`app/**/page.tsx` routes, `app/api/**/route.ts` handlers, `prisma/schema.prisma`,
`package.json` dependencies, existing tests. If `prisma/schema.prisma` does not exist but the
app clearly uses a database (a different ORM, raw SQL client, etc.), flag this prominently and
skip Step 2 entirely — this plugin's DoD/`implement` conventions are Prisma-specific, and
guessing at a foreign schema is out of scope.

#### 0.6 Cluster

For every route/handler not already matched to a BMAD story (0.1), group into candidate use
cases by user-facing goal, not by file — e.g. `/checkout` page + `/api/checkout` +
`/api/discount-codes` → one "Checkout with Discount" cluster. Inspired by how
`engineer-requirements` clusters *existing* UC docs; here the input is raw code.

---

### Step 1: Reverse Requirements

Compile one consolidated, code-derived summary across every cluster (each cluster contributes
one candidate FR: title, user story reconstructed as `As a [actor], I want [goal] so that
[benefit]`, grounded in its BMAD `FR-N` when matched, otherwise in the code). Author
`docs/requirements.md` directly, following its documented table format exactly:

```
| ID | Title | User Story | Priority | Status |
```

Status for every discovered FR is **Verified** — the correct terminal value for an
already-shipped requirement (`docs/requirements.md`'s status vocabulary has no "Done"). Do not
pause per-cluster to ask clarifying questions the way a fresh requirements-gathering pass
would — ground ambiguity in a note for the Step 6 report instead; this pipeline may process
many clusters and per-item interactive dialogue doesn't scale.

---

### Step 2: Entity Model

Skip entirely if no `prisma/schema.prisma` (Step 0.5). Otherwise parse every `model` block and
author `docs/entity_model.md` directly, following its documented format exactly: a Mermaid
`erDiagram` block (relationships only, no attributes inside entity nodes) plus one `###
ENTITY_NAME` section per model with a 5-column attribute table (Attribute, Description, Data
Type, Length/Precision, Validation Rules). Map Prisma scalar types to the fixed vocabulary
(Long/String/Integer/Decimal/Boolean/Date/DateTime), `@id`/`@unique`/required-ness to
Validation Rules, and `@relation` to Mermaid cardinality. Every entity must trace to a real
`model` block — never invented.

---

### Step 3: Use Case Diagram + Specs

Author `docs/use_cases.puml` directly for all clusters together, following its documented
PlantUML format (`@startuml`, actors, one `rectangle` containing `usecase "UC-XXX\nDescription"
as UCXXX` per cluster).

**Quick mode:** write minimal `Draft`-status stub UC docs directly (no subagents) — name,
primary actor, one-line goal, `Provenance: reverse-engineered, not yet elaborated` — for
`/engineer-requirements` to flesh out later.

**Full mode:** spawn one **typed `use-case-archaeologist` subagent** per cluster, batched in
parallel (single message, N `Agent` tool calls — same pattern `resolve-bug` uses for its
Step 2 parallel pair). Invoke via the Agent tool with `subagent_type: "use-case-archaeologist"`.
Prompt per agent:

> Write the use case spec for cluster "[name]" — primary actor [actor], implemented in
> [file list]. [If matched: BMAD story at [path], FR-N [n], claimed Status [status] — verify,
> don't transcribe.]
>
> Follow your operating manual (`onboard-existing-app/SKILL.md` Step 3, loaded as your
> identity) to the letter. Write only `docs/use_cases/UC-XXX.md`. Report the file path, the
> Status you assigned and why, a draft FR-XXX table row, any BR-XXX beyond what's in the UC
> file, and any BMAD/code discrepancy you found.

After all agents in a batch return, do **one sequential pass**: append each returned FR-XXX
row into `docs/requirements.md` (replacing the earlier per-cluster draft from Step 1 if it
was a placeholder) and cross-reference each UC in `docs/use_cases.puml`. This is the only
point that writes to those shared files, avoiding the concurrent-write race parallel agents
would otherwise hit.

Update `docs/onboarding/scan-state.json` after each batch (Step 0.3).

---

### Step 4: Infra Gap Audit (stop-and-list only — never auto-run)

For each concern, check its own CLAUDE.md marker first (every `setup-*` skill already writes
and self-checks one, so this reuses that instead of inventing new detection):
`NEXA_ENV_PROFILES_CONFIGURED`, `NEXA_I18N_CONFIGURED`, `NEXA_WEB_MIDDLEWARE_CONFIGURED`,
`NEXA_ARCH_UNIT_CONFIGURED`, `NEXA_PLAYWRIGHT_CI_CONFIGURED`, `NEXA_QUALITY_CI_CONFIGURED`,
plus every item in `${CLAUDE_PLUGIN_ROOT}/shared/readiness/PROJECT_READINESS.md`.

- **Marker present:** document as configured.
- **Marker absent but functionally equivalent infra clearly exists** (e.g. i18n via a
  different pattern than next-intl): flag as a **mismatch** for human review — never stamp
  the marker on unverified equivalence.
- **Genuinely missing:** list as a recommended follow-up (e.g. "Run `/setup-i18n` — no i18n
  detected"). **Never auto-run any `setup-*` skill** — each one makes opinionated decisions
  (auth provider, locale list, RBAC model) that could conflict with how this specific existing
  app already does things. This is the one place in the pipeline where "onboard" stops short
  of acting, by design.

---

### Step 5: Nexa Rules + Tracking

Run `/setup-project-rules` (Skill tool) if `<!-- NEXA_RULES_CONFIGURED -->` is missing from
`CLAUDE.md` — idempotent, no judgment calls, safe to always run.

Then, per `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md` conventions, for every UC:

```
gh issue create --title "UC-XXX: <name>" --body "<one-line summary>

**Spec:** [\`docs/use_cases/UC-XXX.md\`](<SPEC_URL>)"
```

- **Status: Done** → `gh issue close <number>` immediately after creating — same as any other
  already-shipped, DoD-satisfying work.
- **Status: Review or Draft** → leave **open** — not confirmed-complete, so it shouldn't read
  as closed/done in the tracker.

---

### Step 6: Onboarding Report

Write `docs/onboarding/ONBOARDING_REPORT.md`:

```markdown
# Onboarding Report

## Summary
[scan depth used, cluster count, BMAD seed used: yes/no]

## Use Cases
| UC | Name | Status | Source | Notes |
|----|------|--------|--------|-------|
| UC-001 | ... | Done | BMAD story 1.2, verified | ... |
| UC-002 | ... | Review | Code archaeology | [what couldn't be confirmed] |

## Entity Model
[coverage: N models mapped, or "skipped — no prisma/schema.prisma"]

## Infrastructure Gaps
| Concern | Status | Recommended Action |
|---------|--------|---------------------|
| i18n | Missing | Run /setup-i18n |
| Web Middleware | Configured | — |

## Deferred Work (BMAD, informational only)
[N items found in deferred-work.md, by severity — consider /report-bug for High severity]

## Before You Run /implement or /deliver-use-case
[prioritized list: Review-status UCs to confirm, infra gaps to close, entity model gaps]
```

Optionally draft an informal `docs/vision.md` retrospective summary — no template exists for
it anywhere in this repo, so keep it best-effort and clearly labeled as reconstructed, not
authoritative.

---

## Verification

- Confirm the Nexa Rules Gate (`<!-- NEXA_RULES_CONFIGURED -->`) now passes.
- Spot-check at least one generated `UC-XXX.md` against the live route/component it claims to
  describe — MSS steps should match actual code behavior, not paraphrase intent.
- Confirm `docs/delivery/UC-XXX-iterations.md` exists **only** for `Status: Done` UCs. This is
  what makes `/sprint-prepare`'s "Delivered (immutable)" detection recognize them correctly —
  it keys off file existence, not the `Status` field. Write one with a single entry noting
  `Reverse-engineered from existing code, not delivered via the Nexa pipeline` for each Done
  UC, matching `deliver-use-case/SKILL.md`'s iterations-log format.
- Confirm every closed GitHub issue corresponds to a `Status: Done` UC and every open one to
  `Review`/`Draft`.
- `scripts/sync-shared.sh --check` if `SPRINT_BRANCH_GATE.md` was touched this run (it
  shouldn't be — that's a one-time repo change, not something this skill edits per-project).
