# Bounded Context Sprint Model

## Problem with Current Approach

The full `/elaborate` → `/deliver-all` approach has issues:

1. **Too monolithic** — Elaborating 20+ use cases before any delivery is slow and risky
2. **No parallelization** — Human waits for elaboration, then agents wait for human review
3. **Big bang delivery** — All-or-nothing approach; can't ship incremental value
4. **Long feedback loops** — Issues discovered late affect everything

---

## Proposed Model: Bounded Context Sprints

### Core Concept

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│   │  Context A  │   │  Context B  │   │  Context C  │   │  Context D  │    │
│   │  (Auth)     │   │  (Catalog)  │   │  (Orders)   │   │  (Reports)  │    │
│   │  4 UCs      │   │  5 UCs      │   │  7 UCs      │   │  3 UCs      │    │
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘    │
│         │                 │                 │                 │            │
│         ▼                 ▼                 ▼                 ▼            │
│      Sprint 1          Sprint 2          Sprint 3          Sprint 4        │
│      (Day 1)           (Day 2)           (Day 3)           (Day 4)         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each **bounded context** = one **sprint** = one **day** max.

---

## Phase 0: Context Discovery (One-Time Setup)

**Input:** `docs/vision.md`, `docs/requirements.md`, `docs/use_cases.puml`

**Output:** `docs/contexts.md` — bounded context map

### Automatic Context Detection

Analyze use cases to identify natural clusters based on:

| Signal | Weight | Example |
|--------|--------|---------|
| Shared entities | High | UC-001, UC-002, UC-003 all touch `User` entity |
| Same primary actor | Medium | All "Admin" use cases cluster together |
| Sequential dependencies | High | UC-005 requires UC-004's postcondition |
| Business domain | Medium | "Authentication", "Ordering", "Inventory" |
| Shared screens | Low | Multiple UCs use the same dashboard |

### Context Map Output

```markdown
# Bounded Context Map

## Context: user-management
- **Domain:** User registration, authentication, profile management
- **Entities:** User, Session, Role
- **Use Cases:** UC-001, UC-002, UC-003, UC-004
- **Dependencies:** None (foundational)
- **Estimated Complexity:** Medium (4 UCs, 2 TTs)

## Context: product-catalog  
- **Domain:** Product listing, categories, search
- **Entities:** Product, Category, Brand
- **Use Cases:** UC-005, UC-006, UC-007, UC-008, UC-009
- **Dependencies:** user-management (needs authenticated user)
- **Estimated Complexity:** Medium (5 UCs, 1 TT)

## Context: order-processing
- **Domain:** Cart, checkout, payment, order history
- **Entities:** Order, OrderItem, Cart, Payment
- **Use Cases:** UC-010, UC-011, UC-012, UC-013, UC-014, UC-015, UC-016
- **Dependencies:** user-management, product-catalog
- **Estimated Complexity:** High (7 UCs, 2 TTs)

## Suggested Sprint Order
1. user-management (no dependencies)
2. product-catalog (depends on 1)
3. order-processing (depends on 1, 2)
```

### Human Checkpoint (5 minutes)

- Review context boundaries
- Adjust if needed (move UC between contexts)
- Approve sprint order
- **Then hands-off until sprint completion**

---

## Sprint Execution Model

Each sprint has two parallel tracks:

```
                    SPRINT N                          SPRINT N+1
         ┌────────────────────────────┐    ┌────────────────────────────┐
         │                            │    │                            │
Track 1: │  [Elaborate Context N]     │    │  [Elaborate Context N+1]   │
(Human   │         │                  │    │         │                  │
 + AI)   │         ▼                  │    │         ▼                  │
         │  [Human Review: 10 min]    │    │  [Human Review: 10 min]    │
         │         │                  │    │         │                  │
         │         ▼                  │    │         ▼                  │
         │  [Approve → Hand to T2]────┼────┼──►[Start when T2 free]     │
         │                            │    │                            │
         └────────────────────────────┘    └────────────────────────────┘
                                      
         ┌────────────────────────────┐    ┌────────────────────────────┐
         │                            │    │                            │
Track 2: │  [Deliver UC-001]          │    │  [Deliver UC-005]          │
(Agents  │  [Deliver UC-002]          │    │  [Deliver UC-006]          │
 only)   │  [Deliver UC-003]          │    │  [Deliver UC-007]          │
         │  [Deliver UC-004]          │    │  ...                       │
         │         │                  │    │                            │
         │         ▼                  │    │                            │
         │  [Sprint Review: 10 min]   │    │  [Sprint Review: 10 min]   │
         │                            │    │                            │
         └────────────────────────────┘    └────────────────────────────┘

Timeline:  ├─── Morning ───┼─── Afternoon ───┤─── Next Day ───┤
```

### Parallelization

While **agents deliver Context A**, **human + AI elaborate Context B**.

Human involvement per sprint: ~20 minutes total
- 10 min: Review elaboration output, approve for delivery
- 10 min: Review delivery output, accept or file bugs

---

## Skill: `/sprint`

A new skill that orchestrates one bounded context through elaboration and delivery.

### Usage

```
/sprint user-management
```

### Pipeline

```markdown
## /sprint <context-name>

### Phase 1: Elaborate (automated)

1. Read context definition from `docs/contexts.md`
2. Check dependencies:
   - If dependent context not delivered → STOP, report blocker
3. For each UC in context:
   - Generate spec if missing (with entity validation)
   - Generate design if missing
4. Generate context-specific technical tasks
5. Run GAP analysis (context-scoped only)
6. Output: `docs/sprints/<context>/elaboration-report.md`

### Human Checkpoint (target: 10 minutes)

- Review elaboration report
- If gaps: AI proposes fixes, human approves
- If clean: Approve for delivery

### Phase 2: Deliver (automated, parallel agents)

7. For each TT in context (in dependency order):
   - /deliver-use-case TT-XXX
8. For each UC in context (in priority order):
   - /deliver-use-case UC-XXX
   - Run in parallel where no dependencies exist
9. Output: `docs/sprints/<context>/delivery-report.md`

### Human Checkpoint (target: 10 minutes)

- Review delivery report
- Run smoke test (optional)
- Accept or file bugs for next iteration
```

---

## Directory Structure

```
docs/
├── vision.md
├── requirements.md
├── entity_model.md
├── use_cases.puml
├── contexts.md                    # Bounded context map
│
├── use_cases/
│   ├── UC-001.md
│   └── ...
│
├── designs/
│   ├── UC-001-design.html
│   └── ...
│
├── technical_tasks/
│   ├── TT-001.md
│   └── ...
│
└── sprints/                       # Sprint artifacts
    ├── user-management/
    │   ├── elaboration-report.md
    │   ├── delivery-report.md
    │   └── retrospective.md       # Lessons learned
    │
    ├── product-catalog/
    │   ├── elaboration-report.md
    │   └── ...
    │
    └── order-processing/
        └── ...
```

---

## Minimizing Human-in-the-Loop

### Auto-Approve Rules

Configure thresholds for automatic progression without human review:

```yaml
# docs/sprint-config.yaml

auto_approve:
  elaboration:
    # Auto-approve if gap analysis is clean
    max_gaps: 0
    # Or if gaps are only low severity
    max_high_severity_gaps: 0
    max_medium_severity_gaps: 2
    
  delivery:
    # Auto-approve if all tests pass
    require_all_tests_pass: true
    # And no evaluation failures
    max_evaluation_failures: 0
```

With auto-approve enabled:

```
/sprint user-management --auto

Sprint: user-management
├─ Elaborate: ✓ (0 gaps)
├─ Auto-approved for delivery
├─ Deliver UC-001: ✓
├─ Deliver UC-002: ✓
├─ Deliver UC-003: ✓
├─ Deliver UC-004: ✓
└─ Sprint complete: ✓ (auto-approved)

Human intervention: 0 minutes
```

### Escalation Only

Human is notified only when:
1. Gap analysis finds issues that can't be auto-fixed
2. Tests fail after 3 retry iterations
3. Cross-context dependency conflict detected

---

## Parallel Agent Execution

Within a sprint, UCs without mutual dependencies run in parallel:

```
Context: product-catalog
├── UC-005: List Products      ─┐
├── UC-006: Search Products     ├── Parallel (no dependencies)
├── UC-007: View Product Detail ─┘
│
├── UC-008: Add to Favorites ──── Waits for UC-007 (needs product detail)
└── UC-009: Compare Products ──── Waits for UC-005 (needs product list)
```

Dependency detection from:
- Preconditions referencing other UC postconditions
- Shared entity state requirements
- UI flow dependencies (screen A leads to screen B)

---

## Sprint Sizing Guidelines

| Context Size | UCs | Estimated Duration | Risk |
|--------------|-----|-------------------|------|
| Small | 2-3 | 2-4 hours | Low |
| Medium | 4-6 | 4-8 hours | Medium |
| Large | 7-10 | 8-12 hours | High — consider splitting |
| Too Large | 10+ | > 1 day | Split required |

**Rule:** If a context has > 7 UCs, look for natural sub-boundaries.

---

## Example: Full Project Timeline

```
Day 1 Morning:   /discover-contexts → Human approves (15 min)
Day 1 Afternoon: /sprint user-management --auto
                 Human reviews at EOD (10 min)

Day 2 Morning:   /sprint product-catalog --auto  
                 (parallel: human can do other work)
Day 2 Afternoon: Human reviews (10 min)

Day 3:           /sprint order-processing --auto
                 Larger context, may need full day
                 Human reviews at EOD (15 min)

Day 4 Morning:   /sprint reports --auto
                 Small context, done by lunch
                 Human reviews (10 min)

Day 4 Afternoon: Integration testing, deployment prep

─────────────────────────────────────────────────────────
Total human time: ~60 minutes across 4 days
Total calendar time: 4 days
Delivered: 19 use cases, fully tested
```

---

## New Skills Summary

| Skill | Purpose | Human Time |
|-------|---------|------------|
| `/discover-contexts` | Analyze UCs, propose bounded contexts | 15 min review |
| `/sprint <context>` | Elaborate + deliver one context | 20 min review |
| `/sprint <context> --auto` | Same, with auto-approve | 0 min (unless escalation) |
| `/project-status` | Dashboard of all contexts and their status | 0 min |

---

## Comparison

| Aspect | Monolithic `/elaborate` | Bounded Context Sprints |
|--------|------------------------|------------------------|
| Batch size | All UCs at once | 3-7 UCs per sprint |
| Parallelization | None | Elaboration N+1 while delivering N |
| Human checkpoints | 2 (after elaborate, after deliver) | 2 per sprint, but smaller scope |
| Time to first delivery | Days (all elaboration first) | Hours (first context) |
| Risk isolation | All-or-nothing | Failure in one context doesn't block others |
| Feedback loops | Long | Short (daily) |

---

## Migration Path

1. Keep existing skills as building blocks
2. Add `/discover-contexts` for context mapping
3. Add `/sprint` as orchestrator
4. `/elaborate` becomes optional "do everything" fallback
5. `/deliver-use-case` unchanged, called by `/sprint`

The bounded context model layers on top of existing infrastructure without replacing it.
