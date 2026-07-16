# Engineer Requirements Reference

Templates and detailed technique guidance for `engineer-requirements/SKILL.md`.

## Technique 8: Granularity Signs and Merge Action

**Signs of over-granularity (merge candidates):**

- Multiple UCs that are always performed together in sequence by the same actor (e.g., "Enter Data",
  "Validate Data", "Submit Data" → single "Submit Data" UC)
- UCs that describe validation or error handling for another UC (e.g., "Validate Input" is a step
  inside the parent UC, not a standalone UC)
- UCs that describe UI behavior rather than a user goal (e.g., "Clear Form", "Show Confirmation
  Dialog" are interaction details, not use cases)
- UCs where one cannot deliver user value without the others — they form a single atomic journey

**Signs of correct granularity:**

- The UC can be performed independently and delivers standalone value to the actor
- The UC has a distinct trigger (the actor consciously decides to start it)
- The UC has a meaningful postcondition that changes system state or delivers information
- Different actors or different contexts may need the UC in isolation

**Action when over-granularity is detected:**

1. Propose merging the fine-grained UCs into a single use case named after the user goal
2. The merged UC's main success scenario absorbs the individual UCs as steps
3. Validation and error handling become alternative/exception flows
4. Update the traceability: the merged UC covers all FRs that the individual UCs covered
5. Flag the merge as a proposed change in the cluster analysis (HIGH CONFIDENCE unless
   the boundary between UCs is genuinely ambiguous)

## Initial Progress Manifest Template

```markdown
# Requirements Engineering Progress

| | |
|---|---|
| **Started** | YYYY-MM-DD |
| **Status** | In Progress |

## Clusters

| # | Cluster Name       | Use Cases                      | Status      | Completed  |
|---|--------------------|--------------------------------|-------------|------------|
| 1 | Authentication     | UC-001, UC-002, UC-003, UC-004 | Not Started | —          |
| 2 | Project Management | UC-010..UC-014                 | Not Started | —          |
| 3 | Reporting          | UC-020..UC-022                 | Not Started | —          |

## Cross-Cutting Analysis

- **Status:** Not Started
```

## Step 2b Cluster Analysis Template

```markdown
# Cluster N: [Cluster Name] — Analysis

| | |
|---|---|
| **Use Cases** | UC-XXX, UC-YYY, UC-ZZZ |
| **Entities** | [entities referenced by this cluster] |
| **Actors** | [actors in this cluster] |

## CRUD Matrix

| Entity       | Create | Read   | Update | Delete | Gaps                        |
|--------------|--------|--------|--------|--------|-----------------------------|
| Project      | UC-010 | UC-011 | UC-012 | —      | No delete/archive use case  |
| Task         | UC-013 | UC-011 | UC-014 | UC-014 | —                           |

## Actor-Goal Coverage

| Actor   | Use Cases                | Coverage Notes                          |
|---------|--------------------------|----------------------------------------|
| Manager | UC-010, UC-011, UC-012   | Well covered                           |
| Member  | UC-013, UC-014           | No read-only view — uses UC-011 (OK)   |

## Exception Paths Identified

| UC     | Step/Area                 | Exception                              | Status          |
|--------|---------------------------|----------------------------------------|-----------------|
| UC-010 | Step 5: assign members    | Member does not exist in system        | HIGH CONFIDENCE — add alternative flow |
| UC-012 | Step 3: change deadline   | New deadline is in the past            | HIGH CONFIDENCE — add validation |
| UC-014 | Step 2: delete task       | Task has active dependencies           | CRITICAL AMBIGUITY — see Q2 below |

## Boundary Analysis

[Findings about system boundaries, external dependencies, manual processes]

## Traceability

| Issue                          | Type              | Affected     |
|--------------------------------|-------------------|--------------|
| FR-045 has no matching UC      | Orphan Requirement | FR-045       |
| UC-013 has no mapped FR        | Orphan Use Case    | UC-013       |

## Entity Lifecycle

| Entity  | Created By | Read By    | Updated By | Archived/Deleted By | Gaps          |
|---------|------------|------------|------------|---------------------|---------------|
| Project | UC-010     | UC-011     | UC-012     | —                   | No archive UC |

## MoSCoW Classification

| FR ID    | Title              | Current Priority | MoSCoW | Rationale                                          | Confidence        |
|----------|--------------------|------------------|--------|----------------------------------------------------|--------------------|
| FR-010   | Create Project     | High             | M      | CRUD: only Create path for Project entity          | HIGH CONFIDENCE    |
| FR-011   | View Project List  | High             | M      | Actor-goal: Manager's primary read operation       | HIGH CONFIDENCE    |
| FR-012   | Edit Project       | Medium           | S      | Workaround exists (delete + recreate)              | HIGH CONFIDENCE    |
| FR-013   | Project Analytics  | Low              | C      | Secondary actor convenience; no dependency on it   | HIGH CONFIDENCE    |
| FR-014   | Bulk Project Import| Low              | W      | Depends on unbuilt integration infrastructure      | CRITICAL AMBIGUITY |

**Distribution:** M: 2 (40%) · S: 1 (20%) · C: 1 (20%) · W: 1 (20%)

## Proposed Changes

### Requirements Changes

| Action  | ID/Target  | Detail                                          | Confidence      | Nexa PO Verdict |
|---------|------------|--------------------------------------------------|-----------------|------------|
| Add     | FR-NEW-01  | "As a Manager, I want to archive projects..."   | HIGH CONFIDENCE | _(filled after Nexa PO review)_ |
| Refine  | FR-045     | Clarify scope — currently too vague              | HIGH CONFIDENCE | |
| Add     | FR-NEW-02  | "As a Member, I want to see task dependencies..." | CRITICAL AMBIGUITY — see Q3 | |

### Entity Model Changes

| Action         | Target              | Detail                              | Confidence      | Nexa PO Verdict |
|----------------|---------------------|--------------------------------------|-----------------|------------|
| Add attribute  | Project.archivedAt  | DateTime?, for archive flow         | HIGH CONFIDENCE | _(filled after Nexa PO review)_ |
| Add entity     | TaskDependency      | Many-to-many between Task and Task  | CRITICAL AMBIGUITY — see Q2 | |

### Use Case Diagram Changes

| Action   | Target | Detail                                    | Confidence      | Nexa PO Verdict |
|----------|--------|--------------------------------------------|-----------------|------------|
| Add UC   | UC-NEW | Archive Project (Manager)                 | HIGH CONFIDENCE | _(filled after Nexa PO review)_ |
| Add rel  | UC-014 | includes new UC for dependency check      | CRITICAL AMBIGUITY — see Q2 | |

## Critical Questions (max 5)

| #  | Question | Context | Options | Nexa PO Answer |
|----|----------|---------|---------|-----------|
| Q1 | [Question about a genuine ambiguity — what the skill cannot decide alone] | [Why this matters, what depends on the answer] | a) [option] · b) [option] · c) [option] | _(filled after Nexa PO review)_ [Option chosen] — [rationale] `CONFIDENT` / `NEEDS_HUMAN` |
| Q2 | UC-014 allows deleting tasks. Should tasks with active dependencies be blocked from deletion, or should deletion cascade and remove the dependencies too? | This affects whether we need a TaskDependency entity and a pre-delete check flow. | a) Block deletion · b) Cascade · c) Soft-delete only (archive) | _(filled after Nexa PO review)_ [Option chosen] — [rationale] `CONFIDENT` / `NEEDS_HUMAN` |
| ... | up to Q5 | | | |

## High-Confidence Decisions (pre-approved)

These decisions are based on explicit requirements or strong patterns. They will be applied
unless you override any of them.

| # | Decision                                      | Rationale                                  | Nexa PO Verdict |
|---|-----------------------------------------------|--------------------------------------------|------------|
| 1 | Add "Archive Project" use case (UC-NEW)       | CRUD gap: no way to remove/archive projects | _(filled after Nexa PO review)_ AGREE / CHALLENGE — [rationale] |
| 2 | Add Project.archivedAt attribute              | Required by the archive use case           | |
| 3 | Add alternative flow to UC-010 for invalid members | Exception path: member not in system  | |
| 4 | Map FR-045 to UC-011                          | Traceability gap: FR-045 describes project viewing | |
```

## Step 2c Nexa PO Agent Prompt

> You are a **Nexa Product Owner agent** reviewing a requirements engineering analysis.
>
> **Your persona:**
> - Optimize for MVP scope — when in doubt, choose the simpler option and defer the rest
> - Protect user value — justify every decision by concrete user benefit
> - Avoid gold-plating — if a feature can be deferred without blocking others, defer it
> - Decide based on evidence — reference specific requirements, not intuition
> - Admit uncertainty — tag answers as `NEEDS_HUMAN` when the decision involves business strategy,
>   legal/compliance, stakeholder politics, or when the requirements are genuinely silent
>
> **Your inputs:**
> - Cluster analysis: `docs/engineering/cluster-N-analysis.md`
> - Requirements: `docs/requirements.md`
> - Entity model: `docs/entity_model.md`
> - Use case diagram: `docs/use_cases.puml`
> - Wireframe: `docs/wireframes/index.html`
>
> **Your task:**
>
> 1. Read all input files.
> 2. For each **Critical Question** in the analysis:
>    - **Duplicate the full question verbatim** in your review (question text, context, and options)
>      so the review document is self-contained and readable without the analysis file
>    - Choose an option and provide a one-sentence rationale
>    - Tag your answer as `CONFIDENT` or `NEEDS_HUMAN`
>    - Use `NEEDS_HUMAN` when: the requirements are silent, multiple options have equal merit,
>      the decision has significant cost/scope implications, or it touches business strategy
> 3. For each **High-Confidence Decision** in the analysis:
>    - Include the decision's full description (not just a number reference)
>    - Mark as `AGREE` or `CHALLENGE` with a one-sentence rationale
>    - Only challenge if the decision contradicts explicit requirements or adds unnecessary scope
> 4. For each **MoSCoW Classification** in the analysis:
>    - Review the assigned category and rationale
>    - Mark as `AGREE` or `RECLASSIFY` with the suggested category and a one-sentence rationale
>    - Apply your MVP-optimization lens: when in doubt, push non-blocking requirements toward
>      Should/Could rather than Must; push gold-plating toward Won't
>    - Flag any classification as `NEEDS_HUMAN` if it involves business strategy or stakeholder priority
> 5. For each **Proposed Change** (requirements, entity model, use case diagram):
>    - Include the change's full detail (not just an ID reference)
>    - Mark as `APPROVE` or `DEFER` with rationale
>    - Defer changes that are not essential for the current cluster's use cases to function
>
> **Output format:**
>
> The Nexa PO review document must be **self-contained** — a reader must be able to understand every
> question and answer without opening the analysis file. Each critical question is duplicated
> in full (question text, context, and options) as a table row with the Nexa PO answer in the last column.
>
> ```markdown
> # Nexa PO Review: Cluster N — [Cluster Name]
>
> ## Critical Question Answers
>
> | #  | Question | Context | Options | Nexa PO Answer |
> |----|----------|---------|---------|-----------|
> | Q1 | [Full question text — copied verbatim from the analysis] | [Full context — copied verbatim] | a) [option] · b) [option] · c) [option] | Option b — [one-sentence rationale referencing specific requirement] `CONFIDENT` |
> | Q2 | [Full question text — copied verbatim from the analysis] | [Full context — copied verbatim] | a) [option] · b) [option] · c) [option] | Option c — [one-sentence rationale explaining why this needs human input] `NEEDS_HUMAN` |
>
> ## High-Confidence Decision Review
>
> Each decision is listed with its full description so the review is readable standalone.
>
> | # | Decision | Verdict | Rationale |
> |---|----------|---------|-----------|
> | 1 | Add "Archive Project" use case (UC-NEW) — CRUD gap: no way to remove/archive projects | AGREE | [rationale] |
> | 2 | Add Project.archivedAt attribute — Required by the archive use case | CHALLENGE | [rationale — what's wrong and what to do instead] |
>
> ## MoSCoW Review
>
> | FR ID  | Title             | RE Category | Nexa PO Verdict | Rationale |
> |--------|-------------------|-------------|-----------------|-----------|
> | FR-010 | Create Project    | M           | AGREE           | Core entity creation — non-negotiable |
> | FR-012 | Edit Project      | S           | RECLASSIFY → C  | Delete+recreate is acceptable for MVP; upgrade post-launch |
> | FR-014 | Bulk Project Import | W         | AGREE `NEEDS_HUMAN` | Business may want this for launch data migration |
>
> ## Proposed Changes Review
>
> | Change | Detail | Verdict | Rationale |
> |--------|--------|---------|-----------|
> | Add FR-NEW-01 | "As a Manager, I want to archive projects..." | APPROVE | [rationale] |
> | Add TaskDependency entity | Many-to-many between Task and Task | DEFER | [rationale — not needed for MVP] |
>
> ## Summary
>
> - **Confident decisions:** [count]
> - **Needs human input:** [count]
> - **Challenges:** [count]
> - **Deferred changes:** [count]
> - **MoSCoW reclassifications:** [count]
> ```

## Phase 3 Cross-Cutting Analysis Template

```markdown
# Cross-Cutting Analysis

| | |
|---|---|
| **Date** | YYYY-MM-DD |
| **Clusters processed** | [count] |
| **Total use cases analyzed** | [count] |

## Global CRUD Matrix

| Entity          | Create | Read       | Update     | Delete/Archive | Coverage |
|-----------------|--------|------------|------------|----------------|----------|
| User            | UC-001 | UC-005     | UC-006     | UC-007         | Full     |
| Project         | UC-010 | UC-011     | UC-012     | UC-NEW-01      | Full     |
| Report          | UC-020 | UC-021     | —          | —              | Partial  |

## Cross-Cutting Findings

### FINDING-001: [Short title]

- **Type:** Entity Conflict | Dependency Gap | Traceability Gap | Business Rule Conflict |
           Duplicate UC | Missing Seed Data | Actor Overload | MoSCoW Inversion
- **Severity:** High | Medium | Low
- **Affected:** [UC IDs, entity names, FR IDs]
- **Description:** [What is wrong or missing]
- **Recommendation:** [Specific action]
- **Confidence:** HIGH CONFIDENCE | CRITICAL AMBIGUITY

[Repeat for each finding]

## Critical Questions

[Questions that emerged from cross-cutting analysis, max 5]

## Global MoSCoW Distribution

| Category              | Count | % of Total | FRs |
|-----------------------|-------|------------|-----|
| Must have (M)         |       |            | FR-001, FR-002, ... |
| Should have (S)       |       |            | FR-003, ... |
| Could have (C)        |       |            | FR-010, ... |
| Won't have (W)        |       |            | FR-014, ... |
| Unclassified          |       |            | [if any remain] |

**Priority inversions:** [list any Must-have FRs that depend on Could/Won't-have FRs, or "None"]

## Summary

| Metric                  | Count |
|-------------------------|-------|
| Total entities          |       |
| Full CRUD coverage      |       |
| Partial CRUD coverage   |       |
| Total FRs               |       |
| Mapped FRs              |       |
| Orphan FRs              |       |
| Total UCs (undelivered) |       |
| Mapped UCs              |       |
| Orphan UCs              |       |
| Cross-cutting findings  |       |
| MoSCoW inversions       |       |
```

## Phase 4 Final Progress Manifest Template

```markdown
# Requirements Engineering Progress

| | |
|---|---|
| **Started** | YYYY-MM-DD |
| **Completed** | YYYY-MM-DD |
| **Status** | Complete |

## Summary

- **Clusters processed:** [count]
- **Use cases analyzed:** [count]
- **Requirements added:** [count]
- **Requirements refined:** [count]
- **Requirements MoSCoW-classified:** [count] (M: [n] · S: [n] · C: [n] · W: [n])
- **Entities added:** [count]
- **Attributes added:** [count]
- **Use cases added:** [count]
- **Cross-cutting findings resolved:** [count]

## Clusters

| # | Cluster Name       | Use Cases                      | Status   | Completed  |
|---|--------------------|--------------------------------|----------|------------|
| 1 | Authentication     | UC-001, UC-002, UC-003, UC-004 | Complete | YYYY-MM-DD |
| 2 | Project Management | UC-010..UC-014, UC-NEW-01      | Complete | YYYY-MM-DD |
| 3 | Reporting          | UC-020..UC-022                 | Complete | YYYY-MM-DD |

## Cross-Cutting Analysis

- **Status:** Complete
- **Findings:** [count] ([count] resolved, [count] deferred)

## Next Steps

The project is ready for `/sprint-prepare`.
```

## Phase 4 Final Summary Template

```markdown
## Requirements Engineering Complete

**[X] clusters processed, [Y] use cases analyzed**

| Change Type              | Count |
|--------------------------|-------|
| Requirements added       |       |
| Requirements refined     |       |
| MoSCoW: Must have        |       |
| MoSCoW: Should have      |       |
| MoSCoW: Could have       |       |
| MoSCoW: Won't have       |       |
| Entities added           |       |
| Attributes added         |       |
| Use cases added          |       |
| Relationships added      |       |

**Living documents updated:**
- `docs/requirements.md`
- `docs/entity_model.md`
- `docs/use_cases.puml`

**Engineering artifacts:**
- `docs/engineering/progress.md`
- `docs/engineering/cluster-*-analysis.md`
- `docs/engineering/cluster-*-po-review.md`
- `docs/engineering/cross-cutting-analysis.md`
- `docs/engineering/cross-cutting-po-review.md`

**Recommended next step:** `/sprint-prepare` to scope your first sprint.
```
