# Separating Elaboration from Delivery

## Current State

Looking at the codebase, you already have `/refine-use-cases` which does batch generation of all specs and designs followed by gap analysis. The `/deliver-use-case` pipeline marks Steps 1 and 2 (Use Case Specification and Frontend Design) as optional fallbacks, not primary paths.

## Recommended Architecture

### Phase 1 — Elaboration

Run `/refine-use-cases` **once** for the entire project.

**What it does:**
- Generates all use case specifications
- Generates all frontend designs
- Runs comprehensive gap analysis:
  - Entity coverage
  - CRUD completeness
  - Cross-use-case dependencies
  - Business rule conflicts
  - Requirements traceability
  - Reference/seed data identification

**Output:** A clean gap analysis report.

**Process:** Human reviews, resolves gaps, runs it again until clean.

### Phase 2 — Construction

Run `/deliver-use-case` **per UC**.

**Precondition:** The spec exists, the design exists, entities are modeled, migrations exist.

**What it does (only):**
- Implementation
- Unit tests
- E2E tests
- QA evaluation

**What it does NOT do:**
- Spec generation
- Design generation

---

## Benefits of This Separation

### 1. Fail Fast

Entity gaps, missing alternative flows, conflicting business rules — all discovered **before** any code is written. Not after three iterations of deliver failing.

### 2. Cross-Use-Case Coherence

When you generate all specs together, you can validate that:
- UC-003's preconditions match UC-001's postconditions
- Shared entities have consistent CRUD coverage
- Business rules don't contradict across use cases

In isolated delivery, you can't see these cross-cutting concerns.

### 3. Cleaner Separation of Concerns

| Phase | Work Type | Skills | Quality Gates |
|-------|-----------|--------|---------------|
| Elaboration | Analyst work | Specs, designs, traceability | Gap analysis clean |
| Construction | Engineering work | Code, tests, deployment | DoD checklist |

Different skills, different phases, different quality gates.

### 4. Predictable Delivery

When `/deliver-use-case` starts, you **know** the use case is ready:
- Spec exists and is complete
- Design exists
- Entities are modeled
- Migrations exist
- No surprises about missing entities or undefined flows

The Definition of Ready already exists — make it a hard gate by ensuring `/refine-use-cases` closes all gaps first.

---

## Recommendation

**Remove the "optional" labels from Steps 1 and 2 in `/deliver-use-case`.**

Make them **hard prerequisites**:

```markdown
## Prerequisites

The following must exist before running this pipeline:

- `docs/requirements.md` (from `/requirements`)
- `docs/entity_model.md` (from `/entity-model`)
- `docs/use_cases/$ARGUMENTS.md` (from `/refine-use-cases` or `/use-case-spec`)
- `docs/designs/$ARGUMENTS-design.html` (from `/refine-use-cases` or `/frontend-design`)
- Prisma migration for all entities referenced in the use case

If any prerequisite is missing, stop and tell the user to run `/refine-use-cases` first.
```

**Why:** The fallback creation during delivery is a trap — it encourages skipping the elaboration phase. When specs and designs are created in isolation (one at a time during deliver), you lose the cross-referencing benefits that `/refine-use-cases` provides.

---

## Updated Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELABORATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /requirements → /entity-model → /use-case-diagram              │
│                          ↓                                      │
│                  /refine-use-cases                              │
│                          ↓                                      │
│              Gap Analysis Report                                │
│                          ↓                                      │
│              Human Review & Resolve                             │
│                          ↓                                      │
│              Re-run until clean                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    All gaps closed
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                       CONSTRUCTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  For each UC in priority order:                                 │
│                                                                 │
│      /deliver-use-case UC-XXX                                   │
│          → Implementation                                       │
│          → Unit Tests                                           │
│          → E2E Tests                                            │
│          → QA Evaluation                                        │
│          → Done                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The idea of performing gap analysis on specs and generating all use cases at the same time is **exactly right**. It ensures that when `/deliver-use-case` starts, the use case is in a good condition — no missing entities, no undefined flows, no conflicts with other use cases.

This is disciplined software engineering: validate the design before building, not during.
