# Technical Task: [Task Name]

## Overview

| | |
|---|---|
| **Task ID** | TT-XXX |
| **Task Name** | [Descriptive Name] |
| **Category** | Configuration \| Cleanup \| Dependency \| Infrastructure \| DevEx |
| **Goal** | [What this task achieves and why it is needed] |
| **Scope** | Cluster: [cluster name] \| Umbrella |
| **Status** | Draft \| Reviewed \| Approved \| Implemented \| Tested \| Done \| Obsolete |

## Acceptance Criteria

- [ ] [Concrete, verifiable condition for done]

## Affected Areas

- [Files, modules, or system areas impacted]

## Dependencies

- [Other TT-XXX or UC-XXX that must be completed first, or "None"]

## Decisions

| Decision | Provenance | Source/Reasoning |
|----------|------------|------------------|
| [Technical or design decision made] | EXPLICIT / INFERRED | [Quote source or state reasoning] |

**Provenance Legend:**
- **EXPLICIT** — Directly stated in requirements, refinement docs, or stakeholder input
- **INFERRED** — Deduced by the implementer; requires review if challenged

---

## Reference

### Scope Values

| Scope | Description |
|-------|-------------|
| `Cluster: <name>` | The task supports one cluster only. It is listed under that cluster and must be `Done` before any of the cluster's use cases are delivered. |
| `Umbrella` | The task is cross-cutting and supports the whole system. It is listed in the Umbrella section and is not tied to any one cluster. |

### Status Values

| Status      | Description                                      |
|-------------|--------------------------------------------------|
| Draft       | Initial version, still being written.            |
| Review      | Complete, awaiting stakeholder review.           |
| Approved    | Reviewed and approved for implementation.        |
| Implemented | Implementation complete, pending testing.        |
| Tested      | All tests pass, pending final acceptance.        |
| Done        | Fully implemented, tested, and accepted.         |
| Obsolete    | No longer valid, superseded by another task.     |

### Category Descriptions

| Category       | Description                                                    |
|----------------|----------------------------------------------------------------|
| Configuration  | Environment setup, profiles, config files                      |
| Cleanup        | Code cleanup, dead code removal, refactoring                   |
| Dependency     | Adding, removing, or updating dependencies                     |
| Infrastructure | CI/CD, deployment, database setup, tooling                     |
| DevEx          | Developer experience improvements (linting, formatting, etc.)  |
