---
name: sprint-prepare
description: >
  Selects a subset of use cases for a sprint, refines requirements, evolves the
  entity model and use case diagram, generates specs and designs, and produces a
  sprint readiness report. Treats requirements, entity model, and use case diagram
  as living documents that evolve per sprint while protecting delivered use cases
  as immutable. Use when the user asks to "prepare a sprint", "scope a sprint",
  "refine for sprint", "get use cases ready for delivery", "sprint planning", or
  mentions sprint preparation, sprint scoping, or delivery readiness.
---

# Prepare Sprint

## Instructions

Select, refine, and validate a subset of use cases for sprint-scoped delivery. Accepts use case IDs
as $ARGUMENTS (e.g., `UC-001 UC-002 UC-003`). If no arguments are provided, display the status
table from Phase 1 and ask the user which use cases to include.

This skill produces sprint-scoped artifacts in `docs/sprints/next-sprint/` and ensures every
selected use case has a complete specification and frontend design derived from refined
requirements before delivery begins.

## Prerequisites

The following must exist before running this skill:

- `docs/requirements.md` — the broad requirements (from `/requirements` or human-authored)
- `docs/use_cases.puml` — the use case diagram with UC IDs, actors, and relationships (from `/use-case-diagram`)
- `docs/entity_model.md` — the entity model with Mermaid ER diagram (from `/entity-model`)
- `docs/wireframes/index.html` — the project wireframe (from `/generate-wireframe`)

If any prerequisite is missing, stop and tell the user which `/command` to run first.

**The use case diagram is the structural backbone.** It provides the canonical UC IDs, actor
assignments, and dependency relationships (includes/extends) that this skill operates on. The
requirements file provides the substance — functional requirements, NFRs, business rules, and
acceptance criteria. Both are required inputs and are read together.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Immutability Rule — Delivered Use Cases

**Delivered use cases are immutable.** A use case is delivered if `docs/delivery/UC-XXX-iterations.md`
exists and the use case has passed evaluation.

The following rules apply to delivered use cases:

- **NEVER** modify a delivered use case specification (`docs/use_cases/UC-XXX.md`)
- **NEVER** modify a delivered use case design (`docs/designs/UC-XXX-design.html`)
- **NEVER** rename, renumber, split, or merge a delivered use case
- **NEVER** select a delivered use case for inclusion in a sprint
- **NEVER** modify the delivered use case's entry in `docs/use_cases.puml` (except adding new
  relationships that point TO it from new use cases)
- **NEVER** modify the delivered use case's mapped requirements in `docs/requirements.md`

If sprint refinement reveals that a delivered use case needs changes (bug fix, enhancement,
behavioral change), that change MUST be documented as a **change request** using the
`/change-request` skill instead: it references the delivered UC and describes only the delta,
and is tracked and delivered as a separate work item — never as a new UC.

This rule exists because the delivered use case spec is the **as-built contract**: implementation, tests, and evaluation all reference it, so changing it retroactively invalidates the entire delivery chain.

## Living Documents

These project artifacts evolve with each sprint:

- **`docs/requirements.md`** — Updated with refined, added, or deprecated requirements. Keep the file clean — no inline provenance tags; the sprint changelog records what changed and why (`git blame` provides the history).
- **`docs/entity_model.md`** — Updated with new entities, attributes, or relationships discovered during refinement. Entity changes must be reflected in a Prisma migration.
- **`docs/use_cases.puml`** — Updated when use cases are added, split, or merged. Only undelivered use cases may be structurally changed; delivered entries are frozen.

All changes to living documents are proposed in Phase 3, reviewed by the user, and applied in
Phase 4. The sprint changelog records every change for traceability.

## DO NOT

- Skip Phase 1 status assessment — always show the current state before proceeding
- Proceed past Phase 3 without user review and approval
- Modify any delivered use case spec, design, or diagram entry (see Immutability Rule)
- Select delivered use cases for sprint inclusion
- Create new use cases to represent behavioral changes to delivered use cases — use `/change-request` instead
- Apply changes to living documents without user approval
- Generate specs or designs using broad requirements — always use refined requirements
- Invent use cases that have no basis in requirements or the use case diagram
- Add inline provenance tags to `docs/requirements.md` — use the changelog instead
- Skip the external dependency audit — every selected UC must be checked for third-party accounts, API keys, infrastructure, manual configuration, and secrets before proceeding
- Include a use case that depends on a technical task (TT-XXX) unless that TT is resolved or included in the sprint

## Sprint Directory

All sprint-scoped artifacts go in:

```
docs/sprints/next-sprint/
```

This is always the upcoming or in-progress sprint. When a sprint is completed,
`/sprint-complete` archives it to `sprint-N/` (e.g., `sprint-1/`, `sprint-2/`).
This skill always writes to `next-sprint/`.

If `docs/sprints/next-sprint/` already exists and contains a `readiness-report.md`, warn
the user that a previous sprint preparation exists and ask whether to overwrite or abort.

## Pipeline

Execute these phases in order.

---

### Phase 1: Print Scope

Assess the current state of all use cases in the project using BOTH the requirements and the
use case diagram as input.

1. Read `docs/use_cases.puml` — extract all UC IDs, names, actors, and relationships
   (includes/extends/dependencies). **This is the canonical list of use cases.**
2. Read `docs/requirements.md` — identify the functional requirements (FR-XXX), their priorities,
   and their mapped use cases. Cross-reference FRs to UC IDs from the diagram.
3. Read `docs/entity_model.md` — note the current set of entities for later validation.
4. Scan `docs/use_cases/` for existing specification files.
5. Scan `docs/designs/` for existing design files.
6. Check if `docs/designs/DESIGN_RULES.md` exists.
7. Scan `docs/delivery/` for iteration logs (indicating a use case has been delivered).
8. Scan `docs/change_requests/` for existing CR documents — note each CR's ID, title, status
   (Open / Implemented / Done), and referenced UC. For Done CRs, check whether the UC file has
   an `## Amendments` section listing the CR and whether `docs/requirements.md` reflects the change.

Print a status table with delivered use cases clearly separated: a **Delivered (immutable)**
table (UC ID, Name, Delivered In, Dependencies), an **Undelivered (available for sprint)**
table (UC ID, Name, Spec, Design, Priority, Dependencies, Mapped FRs, Status), and — if
`docs/change_requests/` exists — a **Change Requests** table (CR ID, Title, References, Status,
Live Docs Synced). See [REFERENCE.md](REFERENCE.md#phase-1-project-status-table-example) for
the full example.

See [REFERENCE.md](REFERENCE.md#phase-1-status-table-column-definitions) for how to derive
each column (UC IDs/names, Spec, Design, Priority, Dependencies, Mapped FRs, Status, Live Docs
Synced).

If `docs/change_requests/` does not exist or is empty, omit the Change Requests section.

Also print a brief requirements coverage summary (total/mapped/unmapped FRs, total/delivered/
remaining UCs, change request counts and live-doc gaps) and a design rules status line — see
[REFERENCE.md](REFERENCE.md#phase-1-requirements-coverage-and-design-rules-status-example)
for the example format.

If design rules do not exist, print a recommendation to create `docs/designs/DESIGN_RULES.md`
before generating designs (enforced by `/design-screens`, `/implement`, and `/evaluate` —
without it, each screen risks missing shared elements like headers and footers). See
[REFERENCE.md](REFERENCE.md#phase-1-design-rules-recommendation) for the exact wording.

---

### Phase 2: Select Use Cases

1. If $ARGUMENTS contains use case IDs: use those as the selected set.
2. If $ARGUMENTS is empty: ask the user which use cases to include in the sprint.
3. **Reject any delivered use case IDs** — remind the user of the immutability rule and that
   changes to delivered UCs must be new use cases.
4. Display the selected set with their current status (subset of the Phase 1 undelivered table).
5. Confirm with the user before proceeding.

**Step gate:** User must confirm the selected use case set before proceeding.

---

### Phase 3: Refine Requirements and Propose Changes

This is the core refinement phase. It produces three outputs:
1. Refined requirements for the sprint scope
2. Proposed changes to the entity model
3. Proposed changes to the use case diagram

**Refinement depth is proportional.** Use cases that already have detailed flows, business rules,
and entity mappings in `docs/requirements.md` get a light-touch review (verify completeness, flag
ambiguities). Use cases with skeletal descriptions get deep refinement (resolve ambiguities, add
business rules, detail acceptance criteria, flesh out alternative flows).

#### Step 3a: Refine Requirements

1. Read `docs/requirements.md` in full.
2. Read `docs/use_cases.puml` for the selected use cases' actor assignments, relationships, and
   structural context.
3. For each selected use case, identify the functional requirements (FR-XXX) that map to it:
   - Match by name, user story content, and entity references
   - Cross-reference with `docs/use_cases.puml` actor-to-use-case mappings
   - Include NFRs and constraints that apply to the selected scope
4. Assess the **refinement depth needed** for each UC: **Light-touch** (already has detailed
   flows/business rules/entity mapping — verify completeness, flag ambiguities, confirm
   acceptance criteria are testable) vs. **Deep refinement** (skeletal description — resolve
   ambiguities, add business rules, detail acceptance criteria, identify missing alternative
   flows, specify entity interactions).
5. The refinement process must resolve ambiguities via explicit documented decisions, add
   missing business rules implied by use case relationships, ensure acceptance criteria are
   specific and testable, identify new requirements implied by the selected use cases but
   missing from requirements.md, and flag open questions needing human input.

**Decision Provenance:** Classify every decision made during refinement as **EXPLICIT**
(directly stated in requirements/refinement docs/user input — quote the source) or
**INFERRED** (deduced from context/patterns/common sense — state the reasoning). Document this
in the refinement proposal and carry it through to implementation tickets.

#### Step 3b: Propose Entity Model Changes

1. Read `docs/entity_model.md`.
2. For each entity referenced in the refined requirements and in `docs/use_cases.puml`, check
   whether it exists in the entity model, whether all needed attributes exist, and whether
   relationships are correctly modeled.
3. Produce a change proposal listing new entities (with attributes, types, relationships),
   new attributes on existing entities, new relationships between existing entities, and
   modified attributes (type changes, new constraints).

#### Step 3c: External Dependency Audit

For each selected use case, run through a checklist to detect dependencies that require
provisioning, configuration, or human action outside the codebase — external accounts/API
keys, infrastructure provisioning, manual configuration in an external system, third-party
contracts/approvals, and new environment variables/secrets. See
[REFERENCE.md](REFERENCE.md#step-3c-external-dependency-checklist-questions) for the full
checklist with the guiding question for each category.

For every "yes" answer:

1. Create a **technical task** (TT-XXX) that describes the provisioning/configuration work.
2. Add the technical task as a **dependency** of the use case in the diagram changes (Step 3d).
3. **Ask the user** whether the prerequisite is already satisfied. If the user confirms it's
   done, mark the TT as pre-satisfied in the proposal rather than creating a new task.

This audit prevents discovering missing credentials or infrastructure mid-implementation.

#### Step 3d: Propose Use Case Diagram Changes

1. Read `docs/use_cases.puml`.
2. Based on the refined requirements, determine whether any selected (undelivered) use case
   should be **split** or **merged**, whether new use cases are needed that weren't in the
   original diagram, and whether relationships (includes/extends) need updating. **Remember:**
   delivered use cases in the diagram are untouchable.
3. Produce a change proposal listing each modification with rationale.

#### Output

Produce `docs/sprints/next-sprint/requirements-refinement-proposal.md` containing, in order:
a header table (Sprint, Use Cases in Scope), Scope Summary, Refined Requirements (Existing
sprint-relevant requirements with refinement depth, New requirements discovered during
refinement, and per-requirement Refinement Details with a Decisions provenance table), Entity
Model Changes (New Entities / Modified Entities / New Relationships, or "No changes needed"),
Use Case Diagram Changes (Split / New / Updated Relationships, or "No changes needed"),
Technical Tasks from the external dependency audit, Change Requests recommended for delivered
use cases, and Open Questions. See
[REFERENCE.md](REFERENCE.md#phase-3-requirements-refinement-proposal-template) for the full
annotated template with example rows for every section.

**Present the requirements refinement proposal to the user for review.**

**Step gate:** User must review and approve the requirements refinement proposal before
proceeding. The user may approve as-is, request changes (update the proposal and re-present),
remove proposed changes they disagree with, or add use cases to the sprint scope if new ones
were proposed.

---

### Phase 4: Apply Approved Changes

Apply the user-approved changes from Phase 3 to the living documents.

#### Step 4a: Update Requirements

1. Open `docs/requirements.md`.
2. Add each **new requirement** approved by the user to the appropriate section, following
   the existing format and structure.
3. Update each **refined requirement** with deep changes in place with the refined content.
4. Do NOT remove existing requirements — mark deprecated ones `[Deprecated — replaced by FR-XXX]`.
5. Keep `docs/requirements.md` clean — no inline sprint provenance tags. The changelog
   in the sprint directory records what changed.

#### Step 4b: Update Entity Model

1. Open `docs/entity_model.md`.
2. Apply approved entity changes: add new entities with their attributes and relationships,
   add new attributes to existing entities, add new relationships, and update the Mermaid ER
   diagram.
3. **Flag for migration:** After updating the entity model, note that `/prisma-migration`
   must be run before `/deliver-use-case` to keep the database schema in sync. Record this
   in the sprint readiness report.

#### Step 4c: Update Use Case Diagram

1. Open `docs/use_cases.puml`.
2. Apply approved diagram changes: add new use cases, split undelivered use cases (remove
   original, add new IDs), and add/update relationships. **NEVER modify entries for delivered
   use cases** — only add new relationships pointing to them.
3. If use cases were split or renumbered, delete old (undelivered) spec and design files that
   no longer apply — they're safe to remove because they haven't been implemented against.

#### Step 4d: Save Change Log

Produce `docs/sprints/next-sprint/changelog.md` with a Requirements Changes table (Action, ID,
Title, Detail), an Entity Model Changes table, a Use Case Diagram Changes table, a Technical
Tasks (External Dependencies) table, and a Migration Required line. See
[REFERENCE.md](REFERENCE.md#phase-4d-changelog-template) for the full template with example
rows.

---

### Phase 5: Validate Dependencies

Check that the sprint is viable after all changes have been applied.

1. **Entity validation:** For each entity referenced in the refined requirements, verify it
   exists in the **updated** `docs/entity_model.md`. All entity gaps should have been resolved
   in Phase 4; report any that remain as blockers.
2. **Prerequisite use case validation:** For each selected use case, check its dependencies
   (from the **updated** `docs/use_cases.puml`): a delivered prerequisite is OK; a prerequisite
   in this sprint is OK (note the ordering constraint); a prerequisite that is neither
   delivered nor in this sprint is a blocker.
3. **Requirements traceability:** Verify every selected use case maps to at least one
   functional requirement in `docs/requirements.md`. Flag gaps as warnings.
4. **Migration check:** If entity model was changed in Phase 4, flag that `/prisma-migration`
   must be run before delivery.
5. **External dependency check:** For each technical task (TT-XXX) from the external
   dependency audit: pre-satisfied is OK; new-but-team-doable-before-delivery is OK (note the
   ordering constraint — TT must complete before its dependent UC); new-and-requires-external-
   party-action-with-unknown-timeline is a blocker.

Print the validation report with sections for Blockers (must resolve before proceeding),
Warnings (can proceed but note risks), Ordering Constraints, External Dependency Tasks, and
Pre-Delivery Actions Required — see
[REFERENCE.md](REFERENCE.md#phase-5-dependency-validation-report-template) for the full table
formats.

**Step gate:** If blockers exist, stop and present them to the user. The user must resolve blockers
before the pipeline can continue.

---

### Phase 6: Generate Specs and Designs

For each selected use case, generate the specification and frontend design using the
REFINED requirements from Phase 3.

#### Step 6a-pre: Update Wireframe for New Use Cases

If Phase 4 added new use cases or split existing ones, the wireframe must be updated before
generating specs and designs:

1. Check if any use case IDs in the sprint scope do NOT have a corresponding screen section
   (anchor `#UC-XXX`) in `docs/wireframes/index.html`.
2. If missing screens exist, read and follow:
   `${CLAUDE_PLUGIN_ROOT}/skills/generate-wireframe/SKILL.md`
   with the missing UC IDs as arguments (e.g., `UC-015 UC-016`).
3. **Verify:** Every user-facing use case in scope has a wireframe screen section.

This ensures specs and designs are informed by the wireframe's screen structure.

#### Step 6a: Generate Use Case Specifications

For each selected use case, in dependency order:

1. **If** `docs/use_cases/UC-XXX.md` already exists AND the use case was not split or
   renumbered in Phase 4, **skip** but log for the readiness report.
2. **Otherwise**, read and follow:
   `${CLAUDE_PLUGIN_ROOT}/skills/use-case-spec/SKILL.md`
   with the use case ID as the argument.
   **Important:** When generating the spec, use the refined requirements from
   `docs/sprints/next-sprint/requirements-refinement-proposal.md` as the primary source of business
   rules, acceptance criteria, and behavioral details — not the broad `docs/requirements.md`.
   Also read `docs/use_cases.puml` for the UC's actor, relationships, and structural context.
3. **Verify:** The file exists and contains Overview, Main Success Scenario, Alternative Flows,
   Postconditions, and Business Rules sections.

**Step gate:** All selected use case specification files must exist before proceeding.

#### Step 6b: Generate Frontend Designs

**Design rules check:** Before generating any designs, check if `docs/designs/DESIGN_RULES.md`
exists. If it does NOT exist, ask the user whether to define design rules now or proceed
without them — see [REFERENCE.md](REFERENCE.md#step-6b-design-rules-missing-prompt) for the
exact prompt. If the user wants to define rules, help them create
`docs/designs/DESIGN_RULES.md` before generating designs. If they choose to proceed without,
continue and log it in the readiness report.

For each selected use case, in dependency order:

1. **If** `docs/designs/UC-XXX-design.html` already exists AND the use case was not changed
   in Phase 4, **skip**.
2. **Skip if** the use case has no user-facing interaction (e.g., background jobs, system-triggered
   processes with no UI). Log the skip reason.
3. **Otherwise**, launch an **isolated agent** (using the Agent tool) to produce the design
   from a clean context. The agent must NOT have access to sprint planning context,
   implementation details, or conversation history — it works only from the specification,
   wireframe, entity model, and design examples. Use the full prompt in
   [REFERENCE.md](REFERENCE.md#step-6b-frontend-design-agent-prompt): it points the agent at
   `design-screens/SKILL.md` as its operating manual, lists the exact input files it may read
   (spec, entity model, wireframe, design rules, existing theme files, skill examples), and
   forbids reading implementation code or sprint planning documents.

4. **Verify:** The file `docs/designs/UC-XXX-design.html` exists and contains at least one
   screen definition (check for `design-screen` class in the HTML).

**Step gate:** All applicable frontend design files must exist before proceeding.

---

### Phase 7: Sprint Readiness Report

Run a focused analysis on only the sprint-scoped use cases and produce the readiness report.

#### What to analyze

Run **structural checks** (spec completeness, design completeness, entity coverage, migration
readiness, cross-use-case consistency, business rule consistency, requirements traceability,
pre-existing spec warnings) and **content validation** that cross-references generated specs
and designs against the refined requirements (requirements-to-spec fidelity, spec-to-design
fidelity, entity-to-spec field coverage, alternative flow coverage, decision provenance,
cross-design consistency, and CR live-doc sync — an unsynced Done CR is always a **Blocker**).
See [REFERENCE.md](REFERENCE.md#phase-7-what-to-analyze-full-checklist) for the full
description of each of the 15 checks.

#### Output

Produce `docs/sprints/next-sprint/readiness-report.md` containing, in order: a header table
(Sprint, Use Cases), a Verdict (`READY FOR DELIVERY` or `BLOCKERS REMAIN`) with a 1-2 sentence
summary, Changes Applied This Sprint, Design Rules status, Artifact Status (Spec/Design per
UC), Delivery Order with rationale, Technical Tasks (External Dependencies), Pre-Delivery
Actions, Gaps (one `GAP-NNN` block per issue with Type/Severity/Affected/Description/
Recommendation), Sprint Artifacts, and Next Steps. See
[REFERENCE.md](REFERENCE.md#phase-7-sprint-readiness-report-template) for the full annotated
template.

#### Verdict logic

- **READY FOR DELIVERY**: No blocker-severity gaps. All specs and designs exist. Pre-delivery
  actions are listed. Delivery order is clear. The user can proceed to run pre-delivery actions
  followed by `/deliver-use-case` for each use case in the recommended order.
- **BLOCKERS REMAIN**: At least one blocker-severity gap exists. List what must be resolved before
  delivery can begin.

---

### Phase 8: Update Sprints Overview Dashboard

After producing the readiness report, update the project dashboard so it reflects the
sprint being prepared. The dashboard lives at `docs/sprints/sprints-overview/` and is
cumulative — it shows all sprints (past and current).

**Step 8a — Bootstrap dashboard (first sprint only).** If
`docs/sprints/sprints-overview/manifest.json` does NOT exist: create the
`docs/sprints/sprints-overview/` directory; create `manifest.json` with the project skeleton
([REFERENCE.md](REFERENCE.md#manifest-skeleton-json)); create `index.html`, the dashboard SPA
that reads `manifest.json` and renders sprint overviews, use case details, and document
viewers, using the reference implementation from the skill's project repository as the
template ([REFERENCE.md](REFERENCE.md#step-8a-dashboard-and-md-viewer-requirements) for the
full feature list); create `md-viewer.html`, a markdown renderer page (same reference section
for its required behavior); and create `docs/index.html`, a redirect page to
`sprints/sprints-overview/` ([REFERENCE.md](REFERENCE.md#redirect-page-html)).

**Step 8b — Register the sprint in the manifest.** Read `manifest.json`; determine the sprint
name from the readiness report; determine the sprint ID (count existing entries in `sprints`,
new ID = `sprint-<count + 1>`); add a new sprint entry
([REFERENCE.md](REFERENCE.md#sprint-entry-json)); set `currentSprint` to the new ID; add use
case entries to the `useCases` array for any UCs not already present
([REFERENCE.md](REFERENCE.md#use-case-entry-json) — skip `design` for use cases with no
user-facing UI, skip `delivery` until the UC is delivered); write the updated `manifest.json`.

**Step 8c — Report.** After updating the dashboard, inform the user:

> **Dashboard updated:** `docs/sprints/sprints-overview/index.html`
>
> Sprint N registered as in-progress with [N] use cases in scope.
> Open the dashboard locally to verify it renders correctly before delivery.

---

### Phase 9: Commit and Push to Main

Sprint preparation modifies living documents and produces sprint artifacts that must be on
`main` before `/sprint-kickoff` creates the sprint branch. This phase ensures that.

**This phase is mandatory. The skill is not complete until the push succeeds.**

1. **Stage** all files changed or created during sprint preparation: `git add docs/`
2. **Commit** with a message summarizing the sprint scope: `docs(sprint-<N>): prepare — <UC list summary>`,
   where `<N>` is the sprint number from the manifest and `<UC list summary>` is a brief list
   of the use case IDs in scope (e.g., `UC-003, UC-004, UC-005a`).
3. **Push** to the remote: `git push origin main`. If the push fails (e.g., due to
   divergence), stop and ask the user to resolve the issue before proceeding. Do NOT force-push.
4. **Confirm** to the user:

> **Sprint preparation committed and pushed to `main`.**
>
> Commit: `docs: prepare sprint <N> — <UC list>`
>
> You can now run `/sprint-kickoff` to create the sprint branch and begin delivery.
