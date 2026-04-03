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

If any prerequisite is missing, stop and tell the user which `/command` to run first.

**The use case diagram is the structural backbone.** It provides the canonical UC IDs, actor
assignments, and dependency relationships (includes/extends) that this skill operates on. The
requirements file provides the substance — functional requirements, NFRs, business rules, and
acceptance criteria. Both are required inputs and are read together.

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
behavioral change), that change MUST be documented as a **new use case** — a change request:

- Create a new use case ID (e.g., `UC-XXX` where XXX is the next available number)
- In the new spec, reference the original delivered UC: `"Change request for UC-YYY"`
- The new UC describes only the delta — what changes from the delivered behavior
- Add the new UC to `docs/use_cases.puml` with a dependency on the original

This rule exists because the delivered use case spec is the **as-built contract**. The implementation,
tests, and evaluation all reference it. Changing it retroactively invalidates the entire delivery chain.

## Living Documents

These project artifacts evolve with each sprint:

- **`docs/requirements.md`** — Updated with refined, added, or deprecated requirements.
  Keep the file clean — no inline provenance tags. The sprint changelog records what
  changed and why; `git blame` provides the history.
- **`docs/entity_model.md`** — Updated with new entities, attributes, or relationships
  discovered during refinement. Entity changes must be reflected in a Prisma migration.
- **`docs/use_cases.puml`** — Updated when use cases are added, split, or merged.
  Only undelivered use cases may be structurally changed. Delivered entries are frozen.

All changes to living documents are proposed in Phase 3, reviewed by the user, and applied in
Phase 4. The sprint changelog records every change for traceability.

## DO NOT

- Skip Phase 1 status assessment — always show the current state before proceeding
- Proceed past Phase 3 without user review and approval
- Modify any delivered use case spec, design, or diagram entry (see Immutability Rule)
- Select delivered use cases for sprint inclusion
- Apply changes to living documents without user approval
- Generate specs or designs using broad requirements — always use refined requirements
- Invent use cases that have no basis in requirements or the use case diagram
- Add inline provenance tags to `docs/requirements.md` — use the changelog instead

## Sprint Directory

All sprint-scoped artifacts go in:

```
docs/sprints/next-sprint/
```

This is always the upcoming or in-progress sprint. When a sprint is completed, the user
renames it to `sprint-N/` (e.g., `sprint-1/`, `sprint-2/`). This skill always writes to
`next-sprint/`.

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
4. Read `docs/priority.md` if it exists.
5. Scan `docs/use_cases/` for existing specification files.
6. Scan `docs/designs/` for existing design files.
7. Scan `docs/delivery/` for iteration logs (indicating a use case has been delivered).

Print a status table with delivered use cases clearly separated:

```markdown
## Project Status

### Delivered (immutable)

| UC ID  | Name               | Delivered In      | Dependencies |
|--------|--------------------|-------------------|--------------|
| UC-001 | Register with Email | sprint-1          | None        |
| UC-001A| Verify Email       | sprint-1          | UC-001       |

### Undelivered (available for sprint)

| UC ID  | Name                | Spec | Design | Priority | Dependencies          | Mapped FRs          | Status  |
|--------|---------------------|------|--------|----------|-----------------------|---------------------|---------|
| UC-001B| Login               | No   | No     | P2       | UC-001A (delivered)   | FR-AUTH-01..04      | Ready   |
| UC-003 | Onboarding Wizard   | No   | No     | P3       | UC-001A (delivered)   | FR-ONB-01..09       | Ready   |
| UC-005 | Volunteer Profile   | No   | No     | P4       | UC-003                | FR-PROF-01..09      | Blocked |
```

- **UC IDs and names**: From `docs/use_cases.puml` (the canonical source)
- **Spec**: "Yes" if `docs/use_cases/UC-XXX.md` exists, "No" otherwise
- **Design**: "Yes" if `docs/designs/UC-XXX-design.html` exists, "No" otherwise
- **Priority**: From `docs/priority.md` if available, "—" otherwise
- **Dependencies**: From `docs/use_cases.puml` relationships; annotate whether each is delivered
- **Mapped FRs**: Functional requirements from `docs/requirements.md` that trace to this UC
- **Status**: "Ready" if all dependencies are delivered or in scope, "Blocked" otherwise

Also print a brief requirements coverage summary:

```markdown
### Requirements Coverage

- **Total FRs:** 80 | **Mapped to UCs:** 72 | **Unmapped:** 8 (FR-AUTH-05, FR-MSG-07, ...)
- **Total UCs:** 15 | **Delivered:** 2 | **Remaining:** 13
```

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
4. Assess the **refinement depth needed** for each UC:
   - **Light-touch** (UC already has detailed flows, business rules, entity mapping in requirements):
     Verify completeness, flag ambiguities or contradictions, confirm acceptance criteria are testable
   - **Deep refinement** (UC has skeletal description, missing business rules, no entity mapping):
     Resolve ambiguities, add business rules, detail acceptance criteria, identify missing
     alternative flows, specify entity interactions
5. The refinement process must:
   - Resolve ambiguities by making explicit decisions (document the decision and rationale)
   - Add missing business rules implied by the use case relationships
   - Ensure acceptance criteria are specific and testable
   - Identify new requirements implied by the selected use cases but missing from requirements.md
   - Flag open questions that require human input

**Decision Provenance:** Every decision made during refinement must be classified as either:
- **EXPLICIT** — Directly stated in the requirements, refinement documents, or user input. Quote the source.
- **INFERRED** — Deduced by the agent based on context, patterns, or common sense. State the reasoning.

This distinction must be documented in the refinement proposal and carried through to implementation tickets.

#### Step 3b: Propose Entity Model Changes

1. Read `docs/entity_model.md`.
2. For each entity referenced in the refined requirements and in `docs/use_cases.puml`:
   - Check if it exists in the entity model
   - Check if all needed attributes exist
   - Check if relationships are correctly modeled
3. Produce a change proposal listing:
   - **New entities** to add (with attributes, types, relationships)
   - **New attributes** to add to existing entities
   - **New relationships** between existing entities
   - **Modified attributes** (type changes, new constraints)

#### Step 3c: Propose Use Case Diagram Changes

1. Read `docs/use_cases.puml`.
2. Based on the refined requirements, determine if:
   - Any selected (undelivered) use case should be **split** into multiple use cases
   - Any selected (undelivered) use cases should be **merged**
   - New use cases are needed that were not in the original diagram
   - Use case relationships (includes/extends) need updating
   - **Remember:** delivered use cases in the diagram are untouchable
3. Produce a change proposal listing each modification with rationale.

#### Output

Produce `docs/sprints/next-sprint/refinement-proposal.md`:

```markdown
# Sprint Refinement Proposal

**Sprint:** next-sprint
**Use Cases in Scope:** UC-XXX, UC-YYY, UC-ZZZ

## Scope Summary

[2-3 sentences describing what this sprint delivers]

## Refined Requirements

### Existing Requirements (sprint-relevant)

| ID     | Title        | Priority | Mapped UCs | Refinement Depth | Notes |
|--------|--------------|----------|------------|------------------|-------|
| FR-001 | Create Task  | High     | UC-003     | Light-touch      | Already detailed |
| FR-015 | ONG Verify   | High     | UC-007     | Deep             | Missing business rules |

### New Requirements (discovered during refinement)

| ID     | Title        | User Story | Priority | Mapped UCs | Rationale |
|--------|--------------|------------|----------|------------|-----------|
| FR-020 | Audit Trail  | As a ...   | Medium   | UC-003     | [Why needed] |

### Refinement Details

#### FR-001: Create Task (light-touch)

**Assessment:** Already well-specified in requirements.md. No changes needed.
**Ambiguities found:** None.

#### FR-015: ONG Verify (deep refinement)

**Original:** [quote from requirements.md — skeletal description]

**Refined:**
- [Resolved ambiguity: what documents must the ONG upload?]
- [Added business rule: Admin must respond within 48 hours]
- [Added alternative flow: incomplete submission handling]
- [Acceptance criteria: list specific testable criteria]

**Decisions:**
| Decision | Provenance | Source/Reasoning |
|----------|------------|------------------|
| ONG must upload registration certificate | EXPLICIT | FR-015: "valid registration documents" |
| 48-hour admin response SLA | INFERRED | Industry standard; no explicit SLA in requirements |
| Incomplete submissions trigger email reminder | INFERRED | UX best practice; requirements silent on handling |

## Entity Model Changes

### No changes needed
[Or list changes:]

### New Entities

#### PaymentMethod
| Attribute | Type | Constraints | Rationale |
|-----------|------|-------------|-----------|
| id        | UUID | PK          | Standard  |
| name      | String | Required  | Referenced by UC-003 step 4 |

### Modified Entities

#### User
| Change | Attribute   | From | To         | Rationale |
|--------|-------------|------|------------|-----------|
| Add    | cancelledAt | —    | DateTime?  | Needed for UC-003 cancellation flow |

### New Relationships

| From | To | Type | Rationale |
|------|----|------|-----------|
| Reservation | PaymentMethod | Many-to-One | UC-003 refund routing |

## Use Case Diagram Changes

### No changes needed
[Or list changes:]

### Split Use Cases

| Original (undelivered) | Split Into | Rationale |
|------------------------|------------|-----------|
| UC-010 | UC-010a: Basic Import, UC-010b: Bulk Validation | Too complex |

### New Use Cases

| UC ID  | Name         | Actor   | Rationale |
|--------|--------------|---------|-----------|
| UC-015 | Audit Trail  | System  | Discovered during refinement |

### Updated Relationships

| Change | Detail | Rationale |
|--------|--------|-----------|
| Add include | UC-003 includes UC-015 | Triggers audit |

### Change Requests for Delivered Use Cases

[If refinement reveals that a delivered UC needs changes, they become new UCs:]

| Delivered UC | Issue | New UC (change request) | Description |
|--------------|-------|-------------------------|-------------|
| UC-001       | Missing email notification | UC-016: Registration Email | Add email trigger |

## Open Questions

[Ambiguities requiring human input. If none, state "No open questions."]
```

**Present the refinement proposal to the user for review.**

**Step gate:** User must review and approve the refinement proposal before proceeding. The user may:
- Approve as-is
- Request changes (update the proposal and re-present)
- Remove proposed changes they disagree with
- Add use cases to the sprint scope if new ones were proposed

---

### Phase 4: Apply Approved Changes

Apply the user-approved changes from Phase 3 to the living documents.

#### Step 4a: Update Requirements

1. Open `docs/requirements.md`.
2. For each **new requirement** approved by the user:
   - Add it to the appropriate section following the existing format and structure
3. For each **refined requirement** with deep changes:
   - Update the requirement text in place with the refined content
4. Do NOT remove existing requirements. Deprecated requirements are marked
   `[Deprecated — replaced by FR-XXX]`.
5. Keep `docs/requirements.md` clean — no inline sprint provenance tags. The changelog
   in the sprint directory records what changed.

#### Step 4b: Update Entity Model

1. Open `docs/entity_model.md`.
2. Apply approved entity changes:
   - Add new entities with their attributes and relationships
   - Add new attributes to existing entities
   - Add new relationships
   - Update the Mermaid ER diagram
3. **Flag for migration:** After updating the entity model, note that `/prisma-migration`
   must be run before `/deliver-use-case` to keep the database schema in sync. Record this
   in the sprint readiness report.

#### Step 4c: Update Use Case Diagram

1. Open `docs/use_cases.puml`.
2. Apply approved diagram changes:
   - Add new use cases
   - Split undelivered use cases (remove original, add new IDs)
   - Add/update relationships
   - **NEVER modify entries for delivered use cases** — only add new relationships pointing to them
3. If use cases were split or renumbered:
   - Delete old (undelivered) spec files that no longer apply
   - Delete old (undelivered) design files that no longer apply
   - Old specs/designs for undelivered UCs are safe to remove because they haven't been
     implemented against

#### Step 4d: Save Change Log

Produce `docs/sprints/next-sprint/changelog.md`:

```markdown
# Sprint Change Log

**Sprint:** next-sprint

## Requirements Changes

| Action      | ID     | Title       | Detail |
|-------------|--------|-------------|--------|
| Added       | FR-020 | Audit Trail | New requirement discovered during refinement |
| Refined     | FR-015 | ONG Verify  | Added business rules, alternative flows, acceptance criteria |
| Deprecated  | FR-003 | Legacy Auth | Replaced by FR-020 |

## Entity Model Changes

| Action           | Entity/Relationship     | Detail |
|------------------|-------------------------|--------|
| Added entity     | PaymentMethod           | New entity with id, name |
| Added attribute  | User.cancelledAt        | DateTime?, for cancellation flow |
| Added relationship | Reservation → PaymentMethod | Many-to-One |

## Use Case Diagram Changes

| Action   | UC ID  | Detail |
|----------|--------|--------|
| Split    | UC-010 → UC-010a, UC-010b | Basic Import + Bulk Validation |
| Added    | UC-015 | Audit Trail (system-triggered) |
| Added    | UC-016 | Registration Email (change request for delivered UC-001) |

## Migration Required

[Yes/No — if entity model changed, /prisma-migration must run before delivery]
```

---

### Phase 5: Validate Dependencies

Check that the sprint is viable after all changes have been applied.

1. **Entity validation:** For each entity referenced in the refined requirements, verify it exists
   in the **updated** `docs/entity_model.md`. All entity gaps should have been resolved in Phase 4.
   If any remain, report as blockers.

2. **Prerequisite use case validation:** For each selected use case, check its dependencies
   (from the **updated** `docs/use_cases.puml`):
   - If a prerequisite is delivered: OK
   - If a prerequisite is in this sprint: OK (note ordering constraint)
   - If a prerequisite is neither delivered nor in this sprint: report as blocker

3. **Requirements traceability:** Verify every selected use case maps to at least one functional
   requirement in `docs/requirements.md`. Flag gaps as warnings.

4. **Migration check:** If entity model was changed in Phase 4, flag that `/prisma-migration`
   must be run before delivery.

Print the validation report:

```markdown
## Dependency Validation

### Blockers (must resolve before proceeding)

| Issue | Type | Affected | Resolution |
|-------|------|----------|------------|

### Warnings (can proceed but note risks)

| Issue | Type | Affected | Notes |
|-------|------|----------|-------|

### Ordering Constraints

| Use Case | Must Come After | Reason |
|----------|-----------------|--------|

### Pre-Delivery Actions Required

| Action | Skill | Reason |
|--------|-------|--------|
| Run Prisma migration | `/prisma-migration` | Entity model changed |
```

**Step gate:** If blockers exist, stop and present them to the user. The user must resolve blockers
before the pipeline can continue.

---

### Phase 6: Generate Specs and Designs

For each selected use case, generate the specification and frontend design using the
REFINED requirements from Phase 3.

#### Step 6a: Generate Use Case Specifications

For each selected use case, in dependency order:

1. **If** `docs/use_cases/UC-XXX.md` already exists AND the use case was not split or
   renumbered in Phase 4, **skip** but log for the readiness report.
2. **Otherwise**, read and follow:
   `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/use-case-spec/SKILL.md`
   with the use case ID as the argument.
   **Important:** When generating the spec, use the refined requirements from
   `docs/sprints/next-sprint/refinement-proposal.md` as the primary source of business
   rules, acceptance criteria, and behavioral details — not the broad `docs/requirements.md`.
   Also read `docs/use_cases.puml` for the UC's actor, relationships, and structural context.
3. **Verify:** The file exists and contains Overview, Main Success Scenario, Alternative Flows,
   Postconditions, and Business Rules sections.

**Step gate:** All selected use case specification files must exist before proceeding.

#### Step 6b: Generate Frontend Designs

For each selected use case, in dependency order:

1. **If** `docs/designs/UC-XXX-design.html` already exists AND the use case was not changed
   in Phase 4, **skip**.
2. **Skip if** the use case has no user-facing interaction (e.g., background jobs, system-triggered
   processes with no UI). Log the skip reason.
3. **Otherwise**, read and follow:
   `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/design-screens/SKILL.md`
   with the use case ID as the argument.
4. **Verify:** The file exists and contains at least one screen definition.

**Step gate:** All applicable frontend design files must exist before proceeding.

---

### Phase 7: Sprint Readiness Report

Run a focused analysis on only the sprint-scoped use cases and produce the readiness report.

#### What to analyze

1. **Spec completeness** — Every selected use case has a specification with all required sections.
2. **Design completeness** — Every user-facing selected use case has a design artifact.
3. **Entity coverage** — All entities referenced in sprint use case specs exist in `docs/entity_model.md`.
4. **Migration readiness** — If entity model changed, has `/prisma-migration` been run? If not, flag.
5. **Cross-use-case consistency** — Use cases that depend on each other have compatible
   postconditions/preconditions. Delivery order is clear.
6. **Business rule consistency** — No conflicting business rules across the sprint use cases.
7. **Requirements traceability** — Every sprint FR maps to a use case; every sprint use case maps
   to at least one FR.
8. **Pre-existing spec warning** — Use cases that had pre-existing specs (not generated from refined
   requirements) are flagged. Their specs may not reflect the refined business rules.

#### Output

Produce `docs/sprints/next-sprint/readiness-report.md`:

```markdown
# Sprint Readiness Report

**Sprint:** next-sprint
**Use Cases:** UC-XXX, UC-YYY, UC-ZZZ
## Verdict: READY FOR DELIVERY | BLOCKERS REMAIN

[1-2 sentence summary]

## Changes Applied This Sprint

| Document | Changes | See |
|----------|---------|-----|
| docs/requirements.md | 2 added, 3 refined | changelog.md |
| docs/entity_model.md | 1 entity added, 2 attributes added | changelog.md |
| docs/use_cases.puml | 1 UC split, 1 UC added | changelog.md |

## Artifact Status

| UC ID  | Name               | Spec       | Design     | Notes                          |
|--------|--------------------|------------|------------|--------------------------------|
| UC-003 | Cancel Reservation | Generated  | Generated  |                                |
| UC-004 | Generate Report    | Pre-existing | Generated | Spec predates refined requirements |
| UC-005a| Basic Import       | Generated  | Generated  | Split from UC-005              |

## Delivery Order

Recommended order for running `/deliver-use-case` on each selected use case:

| # | UC ID  | Name               | Rationale                                  |
|---|--------|--------------------|--------------------------------------------|
| 1 | UC-003 | Cancel Reservation | Dependencies all delivered                 |
| 2 | UC-005a| Basic Import       | No dependency on UC-004                    |
| 3 | UC-004 | Generate Report    | Depends on delivered UC-002                |

## Pre-Delivery Actions

| # | Action | Command | Status |
|---|--------|---------|--------|
| 1 | Run Prisma migration for entity changes | `/prisma-migration` | Required |

## Gaps

[Gaps found, or "No gaps identified."]

### GAP-001: [Short title]

- **Type:** [Entity Gap | Spec Inconsistency | Design Missing | Business Rule Conflict | Traceability Gap]
- **Severity:** Blocker | Warning
- **Affected:** [use case IDs]
- **Description:** [What is missing or inconsistent]
- **Recommendation:** [Specific actionable next step]

## Sprint Artifacts

- `docs/sprints/next-sprint/refinement-proposal.md`
- `docs/sprints/next-sprint/changelog.md`
- `docs/sprints/next-sprint/readiness-report.md` (this file)

## Next Steps

[If READY: list the /deliver-use-case commands in order, preceded by any required pre-delivery actions]
[If BLOCKERS: list what must be resolved and which skills to use]
```

#### Verdict logic

- **READY FOR DELIVERY**: No blocker-severity gaps. All specs and designs exist. Pre-delivery
  actions are listed. Delivery order is clear. The user can proceed to run pre-delivery actions
  followed by `/deliver-use-case` for each use case in the recommended order.
- **BLOCKERS REMAIN**: At least one blocker-severity gap exists. List what must be resolved before
  delivery can begin.
