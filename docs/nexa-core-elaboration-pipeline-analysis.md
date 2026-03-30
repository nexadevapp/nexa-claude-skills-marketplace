# Nexa Claude Core Plugin Analysis

## Purpose

Analysis of the skills in `nexa-claude-core` with a plan to create a unified **Elaboration Pipeline** skill that prepares all artifacts for the Construction/Delivery phase.

---

## Current Skills Inventory

| Skill | Phase | Input | Output | Purpose |
|-------|-------|-------|--------|---------|
| `/requirements` | Inception | `docs/vision.md` | `docs/requirements.md` | Extract FR, NFR, Constraints from vision |
| `/entity-model` | Elaboration | `docs/requirements.md` | `docs/entity_model.md` | ER diagram + attribute tables |
| `/use-case-diagram` | Elaboration | `docs/requirements.md` | `docs/use_cases.puml` | PlantUML actors & use cases |
| `/use-case-spec` | Elaboration | Use case ID | `docs/use_cases/UC-XXX.md` | Detailed use case specification |
| `/frontend-design` | Elaboration | UC spec + wireframe | `docs/designs/UC-XXX-design.html` | Screen designs with states |
| `/technical-task` | Elaboration | Task description | `docs/technical_tasks/TT-XXX.md` | Non-UC engineering work |
| `/prioritize` | Elaboration | All specs | `docs/priority.md` | Recommended implementation order |
| `/refine-use-cases` | Elaboration | All above | `docs/gap_analysis_*.md` | Batch specs + designs + gap analysis |
| `/report-bug` | Any | Bug description | `docs/bugs/BUG-XXX.md` | Structured bug reports |
| `/code-review` | Construction | Code changes | Review report | Independent code review |
| `/evaluate` | Construction | Implementation | Evaluation report | Spec conformance check |

---

## Current Dependencies

```
vision.md
    │
    ▼
/requirements ──────► requirements.md
    │                      │
    │                      ├──────────────────┐
    ▼                      ▼                  ▼
/entity-model         /use-case-diagram   (human creates wireframe)
    │                      │                  │
    ▼                      ▼                  ▼
entity_model.md       use_cases.puml      wireframes/index.html
    │                      │                  │
    └──────────┬───────────┘                  │
               │                              │
               ▼                              │
         /use-case-spec  ◄────────────────────┘
               │         (needs wireframe for context)
               ▼
         UC-XXX.md
               │
               ├─────────────────────────────┐
               ▼                             ▼
         /frontend-design              /technical-task
               │                             │
               ▼                             ▼
         UC-XXX-design.html            TT-XXX.md
               │                             │
               └──────────┬──────────────────┘
                          │
                          ▼
                    /prioritize
                          │
                          ▼
                    priority.md
                          │
                          ▼
               /refine-use-cases (GAP analysis)
                          │
                          ▼
                gap_analysis_YYYY-MM-DD.md
```

---

## Problem Statement

Currently, there are multiple entry points and no single "run this to prepare for delivery" command. The `/refine-use-cases` skill comes closest but:

1. **Assumes prerequisites exist** — If `requirements.md`, `entity_model.md`, or `use_cases.puml` don't exist, it stops and asks the user to run other commands
2. **Doesn't include `/prioritize`** — Implementation order is a separate concern
3. **Doesn't handle technical tasks** — Infrastructure setup (TT-XXX) often needs to happen before UC delivery
4. **No entity validation at spec creation** — Entity gaps discovered late

---

## Proposed Solution: `/elaborate` Unified Pipeline

A single skill that orchestrates all Elaboration phase work, producing a complete artifact set ready for `/deliver-use-case`.

### Pipeline Steps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          /elaborate                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: Requirements (if missing)                                          │
│  ──────────────────────────────────                                          │
│  • Check if docs/requirements.md exists                                     │
│  • If missing, run /requirements from docs/vision.md                        │
│  • Gate: requirements.md must exist                                         │
│                                                                             │
│  Step 2: Entity Model (if missing)                                          │
│  ────────────────────────────────                                           │
│  • Check if docs/entity_model.md exists                                     │
│  • If missing, run /entity-model from requirements                          │
│  • Gate: entity_model.md must exist                                         │
│                                                                             │
│  Step 3: Use Case Diagram (if missing)                                      │
│  ─────────────────────────────────────                                       │
│  • Check if docs/use_cases.puml exists                                      │
│  • If missing, run /use-case-diagram from requirements                      │
│  • Gate: use_cases.puml must exist                                          │
│                                                                             │
│  Step 4: Wireframe Check                                                    │
│  ───────────────────────                                                     │
│  • Check if docs/wireframes/index.html exists                               │
│  • If missing, STOP and ask user to provide wireframe                       │
│  • Gate: wireframe must exist (human artifact)                              │
│                                                                             │
│  Step 5: All Use Case Specifications                                        │
│  ───────────────────────────────────                                         │
│  • Parse use_cases.puml for all UC-XXX                                      │
│  • For each UC: generate spec if missing                                    │
│  • Entity validation at spec creation (fail fast)                           │
│  • Gate: all UC specs must exist                                            │
│                                                                             │
│  Step 6: All Frontend Designs                                               │
│  ────────────────────────────                                                │
│  • For each UC with user-facing interaction: generate design if missing     │
│  • Skip system-only UCs (log reason)                                        │
│  • Gate: all applicable designs must exist                                  │
│                                                                             │
│  Step 7: Technical Tasks Identification                                     │
│  ──────────────────────────────────────                                      │
│  • Scan specs for infrastructure needs:                                     │
│    - Database setup / profiles                                              │
│    - Auth / RBAC setup                                                      │
│    - Seed data requirements                                                 │
│    - Third-party integrations                                               │
│  • For each need: check if TT exists, create if missing                     │
│  • Gate: foundational TTs must exist                                        │
│                                                                             │
│  Step 8: Prioritization                                                     │
│  ──────────────────────                                                      │
│  • Run /prioritize to generate implementation order                         │
│  • Output: docs/priority.md                                                 │
│                                                                             │
│  Step 9: Cross-Reference GAP Analysis                                       │
│  ────────────────────────────────────                                        │
│  • Entity coverage (all referenced entities exist)                          │
│  • CRUD completeness                                                        │
│  • Requirements traceability (FR → UC mapping)                              │
│  • Cross-UC dependencies (preconditions match postconditions)               │
│  • Business rule conflicts                                                  │
│  • Seed data identification                                                 │
│  • Output: docs/gap_analysis_YYYY-MM-DD.md                                  │
│                                                                             │
│  Step 10: Elaboration Report                                                │
│  ──────────────────────────                                                  │
│  • Summary of all artifacts generated                                       │
│  • Gap analysis results                                                     │
│  • Recommended next steps                                                   │
│  • If gaps exist: STOP, ask user to resolve                                 │
│  • If clean: "Ready for /deliver-use-case"                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Improvements Over Current State

### 1. Single Entry Point

**Before:** User must know the sequence: `/requirements` → `/entity-model` → `/use-case-diagram` → `/use-case-spec` (for each) → `/frontend-design` (for each) → `/prioritize` → `/refine-use-cases`

**After:** User runs `/elaborate` once. Pipeline handles dependencies automatically.

### 2. Fail-Fast Entity Validation

**Before:** Entity gaps discovered at `/deliver-use-case` Entity Gate — after specs and designs are written.

**After:** Entity validation happens at Step 5 (spec creation). If a spec references a missing entity:
1. Stop spec generation
2. Report: "UC-003 references entity `Order` which is not in entity_model.md"
3. User updates entity model
4. Resume `/elaborate`

### 3. Technical Tasks Automated Discovery

**Before:** User manually identifies infrastructure needs and runs `/technical-task` for each.

**After:** Pipeline scans use case specs and identifies common patterns:

| Pattern in Specs | Auto-Generated TT |
|------------------|-------------------|
| "User is logged in" precondition | TT: Auth/session setup |
| Multiple environment references | TT: Environment profiles |
| Reference data assumed (countries, categories) | TT: Seed data migration |
| File upload mentioned | TT: File storage setup |

### 4. Wireframe as Hard Gate

**Before:** `/frontend-design` fails if wireframe missing, but user discovers this per-UC.

**After:** Wireframe existence checked early (Step 4). Clear message: "Provide wireframe before continuing."

### 5. Clean Handoff to Delivery

**After `/elaborate` completes with no gaps:**

```markdown
## Elaboration Complete ✓

### Artifacts Generated
- ✓ docs/requirements.md
- ✓ docs/entity_model.md  
- ✓ docs/use_cases.puml
- ✓ docs/use_cases/ (8 specifications)
- ✓ docs/designs/ (6 HTML designs)
- ✓ docs/technical_tasks/ (3 tasks)
- ✓ docs/priority.md

### GAP Analysis
No gaps identified.

### Ready for Delivery
Run in this order (per priority.md):
1. /deliver-use-case TT-001 (Environment Setup)
2. /deliver-use-case TT-002 (Auth Setup)  
3. /deliver-use-case UC-001
4. /deliver-use-case UC-002
...
```

---

## Artifacts Produced by `/elaborate`

| Artifact | Location | Produced By |
|----------|----------|-------------|
| Requirements catalog | `docs/requirements.md` | Step 1 |
| Entity model | `docs/entity_model.md` | Step 2 |
| Use case diagram | `docs/use_cases.puml` | Step 3 |
| Use case specs | `docs/use_cases/UC-XXX.md` | Step 5 |
| Frontend designs | `docs/designs/UC-XXX-design.html` | Step 6 |
| Wireframe snapshots | `docs/snapshots/UC-XXX-*.png` | Step 6 |
| Technical tasks | `docs/technical_tasks/TT-XXX.md` | Step 7 |
| Priority order | `docs/priority.md` | Step 8 |
| Gap analysis | `docs/gap_analysis_YYYY-MM-DD.md` | Step 9 |
| Elaboration report | `docs/elaboration_report.md` | Step 10 |

---

## Prerequisites for `/elaborate`

| Artifact | Required | Notes |
|----------|----------|-------|
| `docs/vision.md` | Yes | Source for requirements; must exist before running |
| `docs/wireframes/index.html` | Yes | Human-created; pipeline stops at Step 4 if missing |

Everything else is generated by the pipeline.

---

## Iteration Model

`/elaborate` is idempotent and incremental:

1. **First run:** Generates everything from scratch
2. **Subsequent runs:** Skips existing artifacts, only generates missing ones
3. **After changes:** Re-run to update gap analysis
4. **Gap resolution:** User fixes gaps (updates entity model, adds missing UC), re-runs `/elaborate`

```
vision.md + wireframe
        │
        ▼
   /elaborate  ─────► Gaps found?
        │                  │
        │                  ▼ Yes
        │             User fixes
        │                  │
        │                  ▼
        │             /elaborate (re-run)
        │                  │
        ▼ No               │
   Ready for Delivery ◄────┘
        │
        ▼
   /deliver-use-case (per UC/TT in priority order)
```

---

## Skills Excluded from Pipeline

These skills are **not** part of `/elaborate` because they belong to Construction/Delivery:

| Skill | Phase | Reason |
|-------|-------|--------|
| `/code-review` | Construction | Runs on implementation code |
| `/evaluate` | Construction | Runs on implementation code |
| `/report-bug` | Any | Reactive, not part of forward pipeline |

---

## Implementation Recommendation

### Option A: New Skill File

Create `nexa-claude-core/skills/elaborate/SKILL.md` that:
- Imports and orchestrates existing skills
- Adds entity validation at spec creation
- Adds technical task auto-discovery
- Produces final elaboration report

### Option B: Extend `/refine-use-cases`

Rename and extend `/refine-use-cases` to:
- Include prerequisite generation (Steps 1-4)
- Add technical task discovery (Step 7)
- Add prioritization (Step 8)
- Rename to `/elaborate`

**Recommendation:** Option A (new skill) — cleaner separation, `/refine-use-cases` can remain as a lightweight "gap analysis only" tool for projects that already have all artifacts.

---

## Summary

| Current State | Proposed State |
|---------------|----------------|
| Multiple manual steps | Single `/elaborate` command |
| Prerequisites must exist | Auto-generates missing artifacts |
| Entity gaps found late | Entity validation at spec creation |
| Technical tasks manual | Auto-discovered from spec patterns |
| Wireframe failure per-UC | Early gate with clear message |
| No clear "ready" signal | Elaboration report with handoff |

The `/elaborate` skill transforms the Elaboration phase into a deterministic pipeline that either produces a complete, validated artifact set or stops with clear guidance on what needs human attention.
