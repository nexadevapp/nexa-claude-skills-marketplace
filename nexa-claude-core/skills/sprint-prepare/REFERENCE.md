# Sprint Prepare Reference

Templates, checklists, and detailed examples for `sprint-prepare/SKILL.md`.

## Phase 1: Project Status Table Example

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

### Change Requests

| CR ID  | Title                          | References | Status      | Live Docs Synced |
|--------|--------------------------------|------------|-------------|------------------|
| CR-001 | Replace Role with Department   | UC-007     | Done        | ⚠️ UC-007 amendments missing |
| CR-002 | Add audit log to checkout      | UC-012     | Open        | —                |
```

## Phase 1: Status Table Column Definitions

- **UC IDs and names**: From `docs/use_cases.puml` (the canonical source)
- **Spec**: "Yes" if `docs/use_cases/UC-XXX.md` exists, "No" otherwise
- **Design**: "Yes" if `docs/designs/UC-XXX-design.html` exists, "No" otherwise
- **Priority**: From requirement priorities in `docs/requirements.md` if available, "—" otherwise
- **Dependencies**: From `docs/use_cases.puml` relationships; annotate whether each is delivered
- **Mapped FRs**: Functional requirements from `docs/requirements.md` that trace to this UC
- **Status**: "Ready" if all dependencies are delivered or in scope, "Blocked" otherwise
- **Live Docs Synced**: For Done CRs — ✅ if both UC amendments and requirements entry are updated; ⚠️ with detail if either is missing; — for non-Done CRs

## Phase 1: Requirements Coverage and Design Rules Status Example

```markdown
### Requirements Coverage

- **Total FRs:** 80 | **Mapped to UCs:** 72 | **Unmapped:** 8 (FR-AUTH-05, FR-MSG-07, ...)
- **Total UCs:** 15 | **Delivered:** 2 | **Remaining:** 13
- **Change Requests:** 2 total (1 Done, 1 Open) | **Live Doc Gaps:** 1 (CR-001)

### Design Rules

- **Status:** ✅ `docs/designs/DESIGN_RULES.md` exists | ⚠️ No design rules defined
```

## Phase 1: Design Rules Recommendation

> **Recommendation:** Before generating designs, consider creating `docs/designs/DESIGN_RULES.md`
> with project-wide layout rules (shared header/footer, sidebar, navigation patterns, etc.).
> These rules are enforced by `/design-screens`, `/implement`, and `/evaluate`. Without them,
> each screen is designed in isolation and may miss shared elements like headers and footers.

## Step 3c: External Dependency Checklist Questions

- **External accounts or API keys** — Does this UC integrate with a third-party service
  (OAuth provider, payment gateway, email/SMS service, maps API, etc.)? If yes: who
  provisions the developer/production credentials? Are they already available?
- **Infrastructure provisioning** — Does this UC require infrastructure that doesn't exist
  yet (message queue, object storage bucket, CDN, search index, cron scheduler)?
- **Manual configuration** — Does this UC depend on configuration that must be done in an
  external system (DNS records, webhook URLs registered with a partner, allowlist entries)?
- **Third-party contracts or approvals** — Does this UC depend on an agreement, approval,
  or sandbox access from an external party?
- **Environment variables or secrets** — Does this UC introduce new secrets that must be
  provisioned in each environment?

## Phase 3: Requirements Refinement Proposal Template

```markdown
# Requirements Refinement Proposal

| | |
|---|---|
| **Sprint** | next-sprint |
| **Use Cases in Scope** | UC-XXX, UC-YYY, UC-ZZZ |

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

## Technical Tasks (External Dependencies)

[Technical tasks discovered by the external dependency audit. If none, state "No external
dependencies detected."]

| TT ID  | Name                          | Required By | Status       | Notes |
|--------|-------------------------------|-------------|--------------|-------|
| TT-010 | Provision Google OAuth App    | UC-045      | New          | Need Google Developer Console access |
| TT-011 | Provision LinkedIn OAuth App  | UC-046      | New          | Need LinkedIn Developer account |
| TT-012 | Configure S3 Bucket for Uploads | UC-020   | Pre-satisfied | User confirmed bucket exists |

**Questions for the user:**
- [List questions about who provisions credentials, whether accounts exist, etc.]

### Change Requests for Delivered Use Cases

[If refinement reveals that a delivered UC needs behavioral changes, file a CR — do NOT create a new UC.
Run `/change-request` after this sprint preparation is complete.]

| Delivered UC | Issue | Recommended Action |
|--------------|-------|--------------------|
| UC-001       | Missing email notification | Run `/change-request` — reference UC-001, describe the missing notification delta |

## Open Questions

[Ambiguities requiring human input. If none, state "No open questions."]
```

## Phase 4d: Changelog Template

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

## Technical Tasks (External Dependencies)

| Action | TT ID  | Name                       | Required By | Status |
|--------|--------|----------------------------|-------------|--------|
| Added  | TT-010 | Provision Google OAuth App | UC-045      | Pending |
| Noted  | TT-012 | Configure S3 Bucket        | UC-020      | Pre-satisfied |

## Migration Required

[Yes/No — if entity model changed, /prisma-migration must run before delivery]
```

## Phase 5: Dependency Validation Report Template

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

### External Dependency Tasks

| TT ID  | Name                       | Required By | Status        | Blocker? |
|--------|----------------------------|-------------|---------------|----------|
| TT-010 | Provision Google OAuth App | UC-045      | Pending       | Yes — needs external access |
| TT-012 | Configure S3 Bucket        | UC-020      | Pre-satisfied | No       |

### Pre-Delivery Actions Required

| Action | Skill | Reason |
|--------|-------|--------|
| Run Prisma migration | `/prisma-migration` | Entity model changed |
| Complete TT-010 | Manual | UC-045 depends on Google OAuth credentials |
```

## Step 6b: Design Rules Missing Prompt

> No project design rules found (`docs/designs/DESIGN_RULES.md`). Design rules define shared
> layout elements (header, footer, sidebar), navigation patterns, and other constraints that
> apply to every screen. Without them, designs may be inconsistent.
>
> Would you like to define design rules now, or proceed without them?

## Step 6b: Frontend Design Agent Prompt

> You are an independent frontend designer. Read and follow the complete instructions in
> `${CLAUDE_PLUGIN_ROOT}/skills/design-screens/SKILL.md`.
> Create a screen design artifact for $UC_ID.
>
> **Your inputs (read these and nothing else):**
> - Use case specification: `docs/use_cases/$UC_ID.md`
> - Entity model: `docs/entity_model.md` (if it exists)
> - Wireframe: `docs/wireframes/index.html`
> - Design rules: `docs/designs/DESIGN_RULES.md` (if it exists)
> - Existing theme files in `docs/designs/` (if they exist)
> - Example files in the skill's `examples/` directory
>
> **Your output:** `docs/designs/$UC_ID-design.html`
>
> Do NOT read implementation code, sprint planning documents, requirements refinement
> proposals, or any file outside of the inputs listed above. Your design must be based
> solely on the use case specification and wireframe.

## Phase 7: What to Analyze Full Checklist

**Structural checks:**

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

**Content validation** (cross-references generated specs and designs against refined requirements):

9. **Requirements-to-spec fidelity** — For each selected use case, compare the refined requirements
   (from `docs/sprints/next-sprint/requirements-refinement-proposal.md`) against the generated spec
   (`docs/use_cases/UC-XXX.md`). Flag business rules, acceptance criteria, or behavioral details
   in the refined requirements that are missing or contradicted in the spec.
10. **Spec-to-design fidelity** — For each user-facing use case, compare the spec's main success
    scenario steps and alternative flows against the design (`docs/designs/UC-XXX-design.html`).
    Flag steps that have no corresponding UI element, missing form fields implied by entity
    attributes, and interaction states (loading, error, empty) not represented in the design.
11. **Entity-to-spec field coverage** — For each entity referenced in a spec, verify that the spec's
    data inputs/outputs match the entity model's attributes. Flag entity attributes that are
    referenced in the spec but missing from the entity model, and entity attributes that exist
    in the model but are never referenced in any sprint spec (warning only — may be used by
    other use cases).
12. **Alternative flow coverage** — Check each spec for missing error handling and edge cases
    implied by the refined requirements' business rules. Flag business rules that should produce
    an alternative flow but have no corresponding flow in the spec.
13. **Decision provenance** — Flag business rules, acceptance criteria, or behavioral details in
    the specs that lack clear provenance — unclear whether the decision came from explicit
    requirements or was inferred during spec generation. These are high-risk areas that may
    need stakeholder validation before implementation.
14. **Design consistency** — Across all sprint designs, check for inconsistent naming, layout
    patterns, or interaction patterns for shared concepts (e.g., the same entity displayed
    differently in two screens, inconsistent button labels for the same action).
15. **CR live-doc sync** — Scan `docs/change_requests/` for any CR with status Done. For each:
    - Check that the referenced UC file (`docs/use_cases/UC-XXX.md`) has an `## Amendments`
      section that includes an entry for this CR
    - Check that `docs/requirements.md` reflects the behavioral change described in the CR
      (the old behavior is gone or deprecated; the new behavior is stated)
    - Flag each unsynced CR as a **Blocker** — live docs that lag behind delivered CRs will
      cause the next sprint's specs and designs to be generated from stale requirements

## Phase 7: Sprint Readiness Report Template

```markdown
# Sprint Readiness Report

| | |
|---|---|
| **Sprint** | next-sprint |
| **Use Cases** | UC-XXX, UC-YYY, UC-ZZZ |

## Verdict: READY FOR DELIVERY | BLOCKERS REMAIN

[1-2 sentence summary]

## Changes Applied This Sprint

| Document | Changes | See |
|----------|---------|-----|
| docs/requirements.md | 2 added, 3 refined | changelog.md |
| docs/entity_model.md | 1 entity added, 2 attributes added | changelog.md |
| docs/use_cases.puml | 1 UC split, 1 UC added | changelog.md |

## Design Rules

[✅ `docs/designs/DESIGN_RULES.md` exists — [N] rules defined | ⚠️ No design rules — designs may lack shared layout elements]

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

## Technical Tasks (External Dependencies)

| TT ID  | Name                       | Required By | Status        |
|--------|----------------------------|-------------|---------------|
[List all TTs from the external dependency audit, or "No external dependencies."]

## Pre-Delivery Actions

| # | Action | Command | Status |
|---|--------|---------|--------|
| 1 | Run Prisma migration for entity changes | `/prisma-migration` | Required |
| 2 | Provision Google OAuth credentials | TT-010 (manual) | Required before UC-045 |

## Gaps

[Gaps found, or "No gaps identified."]

### GAP-001: [Short title]

- **Type:** [Entity Gap | Spec Inconsistency | Design Missing | Business Rule Conflict | Traceability Gap | Requirements Fidelity Gap | Spec-Design Mismatch | Missing Alternative Flow | Decision Provenance Gap | Design Consistency Issue | CR Live-Doc Sync Gap]
- **Severity:** Blocker | Warning
- **Affected:** [use case IDs]
- **Description:** [What is missing or inconsistent]
- **Recommendation:** [Specific actionable next step]

## Sprint Artifacts

- `docs/sprints/next-sprint/requirements-refinement-proposal.md`
- `docs/sprints/next-sprint/changelog.md`
- `docs/sprints/next-sprint/readiness-report.md` (this file)

## Next Steps

[If READY: list the /deliver-use-case commands in order, preceded by any required pre-delivery actions]
[If BLOCKERS: list what must be resolved and which skills to use]
```

## Manifest Skeleton JSON

```json
{
  "project": "<project name from docs/requirements.md or repo name>",
  "currentSprint": null,
  "sprints": [],
  "useCases": [],
  "documents": [
    { "id": "requirements", "name": "Requirements", "file": "../../requirements.md" },
    { "id": "entity-model", "name": "Entity Model", "file": "../../entity_model.md" },
    { "id": "use-case-diagram", "name": "Use Case Diagram", "file": "../../use_cases.puml" }
  ],
  "wireframe": "../../wireframes/index.html"
}
```

## Step 8a: Dashboard and md-viewer Requirements

`docs/sprints/sprints-overview/index.html` — the dashboard SPA that reads `manifest.json` and
renders sprint overviews, use case details, and document viewers. Use the reference
implementation from the skill's project repository as the template. The dashboard must:

- Have a sidebar with Sprints, Use Cases, and Documents sections
- Show sprint cards with use case grids
- Embed markdown files via an iframe using `md-viewer.html`
- Embed HTML design files directly in iframes
- Display PlantUML source inline for `.puml` files
- Be responsive (mobile sidebar toggle)
- Use a clean, professional design suitable for stakeholder presentations

`docs/sprints/sprints-overview/md-viewer.html` — a markdown renderer page that:

- Accepts a `?file=path/to/doc.md` query parameter
- Fetches and renders the markdown using the `marked` library (CDN)
- Renders Mermaid diagrams using the `mermaid` library (CDN)
- Posts its height to the parent frame for auto-resize
- Has clean typography suitable for embedded viewing

## Redirect Page HTML

`docs/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=sprints/sprints-overview/">
  <title>Redirecting to Project Dashboard...</title>
</head>
<body>
  <p>Redirecting to <a href="sprints/sprints-overview/">Project Dashboard</a>...</p>
</body>
</html>
```

## Sprint Entry JSON

Add to the `sprints` array in `manifest.json`:

```json
{
  "id": "sprint-N",
  "name": "Sprint N — <theme from scope summary>",
  "date": "<today's date>",
  "status": "in-progress",
  "useCases": ["UC-XXX", "UC-YYY", "UC-ZZZ"],
  "files": {
    "readiness": "../next-sprint/readiness-report.md",
    "changelog": "../next-sprint/changelog.md",
    "refinement": "../next-sprint/refinement-proposal.md"
  }
}
```

## Use Case Entry JSON

Add to the `useCases` array in `manifest.json`:

```json
{
  "id": "UC-XXX",
  "name": "<use case name>",
  "spec": "../../use_cases/UC-XXX.md",
  "design": "../../designs/UC-XXX-design.html",
  "delivery": "../../delivery/UC-XXX-iterations.md"
}
```

Skip the `design` field for use cases with no user-facing UI. Skip the `delivery` field — it
will be populated once the UC is delivered.
