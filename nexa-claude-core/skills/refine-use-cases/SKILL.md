---
name: refine-use-cases
description: >
  Generates all use case specifications and frontend designs, then performs a
  cross-referencing GAP analysis to identify missing, incomplete, or conflicting
  use cases before implementation begins. Use when the user asks to "refine use
  cases", "run gap analysis", "check use case coverage", "find gaps", or wants
  to validate completeness across all use cases before building.
---

# Refine Use Cases

## Instructions

Refine all use cases defined in the project and produce a GAP Analysis Report that
identifies actionable gaps across specifications and designs. This skill ensures completeness
and consistency before implementation begins.

## Prerequisites

The following must exist before running this skill:

- `docs/requirements.md` (from `/requirements`)
- `docs/use_cases.puml` (from `/use-case-diagram`)
- `docs/entity_model.md` (from `/entity-model`)

If any prerequisite is missing, stop and tell the user which `/command` to run first.

## DO NOT

- Skip use cases — every use case in `docs/use_cases.puml` must be processed
- Modify existing specifications or designs during gap analysis — only report findings
- Proceed to gap analysis before all specs and designs are generated
- Invent use cases that are not in the use case diagram
- Ask the user for input between steps — run autonomously through all three steps

## Pipeline

Execute these steps in order.

---

### Step 1: Generate All Use Case Specifications

Parse `docs/use_cases.puml` to extract every use case ID (UC-XXX).

For each use case ID, in diagram order:

1. **Skip if** `docs/use_cases/UC-XXX.md` already exists.
2. Otherwise, read and follow:
   `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/use-case-spec/SKILL.md`
   with the use case ID as the argument.
3. **Verify:** The file exists and contains Overview, Main Success Scenario,
   Alternative Flows, Postconditions, and Business Rules sections.

**Step gate:** ALL use case specification files must exist before proceeding.

---

### Step 2: Generate All Frontend Designs

For each use case ID from Step 1, in diagram order:

1. **Skip if** `docs/designs/UC-XXX-design.html` already exists.
2. **Skip if** the use case has no user-facing interaction (e.g., background jobs,
   system-triggered processes with no UI). Log the skip reason.
3. Otherwise, read and follow:
   `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/skills/design-screens/SKILL.md`
   with the use case ID as the argument.
4. **Verify:** The file exists and contains at least one screen definition.

**Step gate:** All applicable frontend design files must exist before proceeding.

---

### Step 3: GAP Analysis Report

Cross-reference all use case specifications, frontend designs, the entity model,
the requirements, and the use case diagram to produce a comprehensive gap report.

**Output:** `docs/gap_analysis_YYYY-MM-DD.md` (using today's date as identifier;
if a report for today already exists, append a counter: `gap_analysis_YYYY-MM-DD_2.md`).

#### What to analyze

1. **Entity coverage** — Entities referenced in use case specs but missing from
   `docs/entity_model.md` or missing Prisma models.

2. **CRUD completeness** — For each entity, check whether Create, Read, Update,
   and Delete operations are covered. Flag missing operations.

3. **Requirements traceability** — Functional requirements in `docs/requirements.md`
   that have no corresponding use case. Use cases that don't trace to any requirement.

4. **Actor coverage** — Actors in `docs/use_cases.puml` with too few use cases,
   or use cases with no actor association.

5. **Cross-use-case dependencies** — Use cases that assume data created by another
   use case, where that source use case doesn't exist or doesn't guarantee the
   postcondition. Flag implicit ordering dependencies between use cases (e.g., UC-003
   requires an entity state that only UC-001 produces).

6. **Use case complexity** — Flag use cases that are too large or try to do too much:
   main success scenarios with more than ~15 steps, more than ~5 alternative flows,
   or multiple distinct goals mixed into one use case. These are candidates for splitting.

7. **Reference and seed data** — Identify data that use cases assume exists but that
   no use case or migration creates. Examples: country lists, city catalogs, skill
   taxonomies, language enums, category lists, status codes, role definitions. These
   need either a seed migration or a dedicated technical task.

8. **Alternative flow coverage** — Missing error handling, edge cases, or failure
   paths implied by other use cases' business rules.

9. **Design consistency** — Shared screens or components across designs that have
   inconsistent layout, naming, or interaction patterns.

10. **Business rule conflicts** — Rules in one use case that contradict rules in another.

11. **Decision provenance gaps** — Business rules, acceptance criteria, or behavioral details
    that lack clear provenance. Flag items where it's unclear whether the decision came from
    explicit requirements or was inferred by the agent. These are high-risk areas that require
    stakeholder validation before implementation.

#### Report template

```markdown
# GAP Analysis Report

**Date:** YYYY-MM-DD
**Use cases analyzed:** [count]
**Frontend designs analyzed:** [count]

## Summary

[2-3 sentence overview of findings]

## Gaps

### GAP-001: [Short title]

- **Type:** Add Use Case | Split Use Case | Modify Use Case | Add Alternative Flow | Update Entity Model | Add Seed Data | Resolve Conflict | Intentional Gap
- **Severity:** High | Medium | Low
- **Affected:** [use case IDs, entity names, or requirement IDs]
- **Description:** [What is missing or inconsistent]
- **Recommendation:** [Specific actionable next step]
- **Pending human judgment:** Yes | No

### GAP-002: ...

[Repeat for each gap found]

## Action Summary

| Type | Count |
|------|-------|
| Add Use Case | |
| Split Use Case | |
| Modify Use Case | |
| Add Alternative Flow | |
| Update Entity Model | |
| Add Seed Data | |
| Resolve Conflict | |
| Intentional Gap (pending human judgment) | |

## Next Steps

[Prioritized list of recommended actions]

## Follow-Up Reference

Use the following skills to address each gap type:

| Gap Type | Skill(s) to Use | Notes |
|----------|-----------------|-------|
| Add Use Case | `/use-case-spec` → `/use-case-diagram` | Create the new spec, then update the diagram |
| Split Use Case | `/use-case-diagram` → `/use-case-spec` | Update the diagram first, then create new specs |
| Modify Use Case | `/use-case-spec` | Re-run on the existing use case ID to update |
| Add Alternative Flow | `/use-case-spec` | Re-run on the existing use case ID to update |
| Update Entity Model | `/entity-model` → `/prisma-migration` | Update the model, then generate the migration |
| Add Seed Data | `/technical-task` → `/implement` | Spec the seed task, then implement it |
| Resolve Conflict | *(human decision first)* | Then use whichever skill applies |
| Intentional Gap | *(no action needed)* | Document the decision and move on |

After addressing gaps, re-run `/refine-use-cases` to verify all gaps are closed.
```

#### Gap types explained

- **Add Use Case** — A missing use case needs to be created (e.g., CRUD gap, missing
  flow that other use cases depend on).
- **Split Use Case** — An existing use case is too broad and should be decomposed into
  two or more focused use cases.
- **Modify Use Case** — An existing use case needs changes: missing alternative flows,
  incomplete postconditions, or undefined business rules.
- **Add Alternative Flow** — A specific error or edge case path is missing from an
  existing use case.
- **Update Entity Model** — An entity or relationship is referenced but not modeled.
- **Add Seed Data** — Reference or lookup data that use cases assume exists but no use
  case or migration creates (e.g., country lists, skill taxonomies, language enums,
  category catalogs, role definitions). Requires a seed migration or technical task.
- **Resolve Conflict** — Business rules or design patterns contradict each other across
  use cases.
- **Intentional Gap** — An identified gap that requires human judgment to resolve. The
  system cannot determine the right action — flag it for the user to decide.
- **Decision Provenance Gap** — A business rule or behavioral detail that lacks clear
  provenance (unclear if EXPLICIT from requirements or INFERRED by agent). High-risk
  for implementation — requires stakeholder validation.

---

### Step 4: (Future)

Reserved for future automation: acting on gap analysis results to create, split,
or modify use cases. For now, the user reviews the GAP Analysis Report and decides
which actions to take manually.

