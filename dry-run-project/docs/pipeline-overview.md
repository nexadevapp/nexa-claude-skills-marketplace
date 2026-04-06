# VoluntX — Pipeline Overview

## Full Workflow Diagram

```mermaid
graph TD
    subgraph "INCEPTION — Done"
        REQ["docs/requirements.md<br/><i>3,520 lines — already exists</i>"]
    end

    subgraph "ELABORATION — One-time setup"
        EM["/entity-model<br/>→ docs/entity_model.md"]
        UCD["/use-case-diagram<br/>→ docs/use_cases.puml"]
    end

    subgraph "SPRINT N — Repeat per sprint"
        PS["/sprint-prepare UC-XXX UC-YYY<br/>→ requirements-refinement-proposal.md<br/>→ changelog.md<br/>→ readiness-report.md"]

        PM["/prisma-migration<br/>→ schema.prisma + migration SQL"]
        MW["/build-web-middleware<br/>→ middleware.ts<br/><i>(first sprint only)</i>"]

        subgraph "Per Use Case — in delivery order"
            DUC["/deliver-use-case UC-XXX<br/><i>spec → design → implement<br/>→ test → evaluate → iterate</i>"]
        end

        NEXT{"More UCs<br/>in sprint?"}
        SPRINT_DONE["Sprint Done"]
    end

    NEXT_SPRINT{"Next sprint?"}

    REQ --> EM
    REQ --> UCD
    EM --> PS
    UCD --> PS
    PS -->|"entity model changed"| PM
    PS -->|"first sprint"| MW
    PM --> DUC
    MW --> DUC
    PS -->|"no changes needed"| DUC
    DUC --> NEXT
    NEXT -->|Yes| DUC
    NEXT -->|No| SPRINT_DONE
    SPRINT_DONE --> NEXT_SPRINT
    NEXT_SPRINT -->|"Yes — pick next UCs"| PS
    NEXT_SPRINT -->|"No — project complete"| DONE["Done"]
```

## Steps Summary

### Phase A: Elaboration (one-time, project-wide)

1. **`/entity-model`** — Produce entity model with Mermaid ER diagram and attribute tables
2. **`/use-case-diagram`** — Produce PlantUML use case diagram with all actors and use cases

### Phase B: Sprint Loop (repeat per sprint)

3. **`/sprint-prepare UC-XXX UC-YYY ...`** — Select, refine, validate, generate specs and designs
4. **`/prisma-migration`** — Generate DB migration if entity model changed
5. **`/build-web-middleware`** — Set up auth/RBAC/security middleware (first sprint only)
6. **`/deliver-use-case UC-XXX`** — For each UC in delivery order: implement, test, evaluate, iterate
7. **Repeat** step 6 for each UC in the sprint
8. **Go back** to step 3 for the next sprint
