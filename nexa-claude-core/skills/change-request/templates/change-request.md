# Change Request: [Title]

## Overview

| | |
|---|---|
| **CR ID** | CR-XXX |
| **Title** | [Short descriptive title] |
| **Status** | Open |
| **References** | [UC-XXX: Use Case Name] |
| **Requested By** | [Stakeholder, team, or source of the request] |
| **Origin** | [Full GitHub issue URL when filed from an issue, or `human-in-the-loop` when reported directly] |
| **GitHub Issue** | [link to the tracking issue] |

## Context

[2–4 sentences describing the current behavior as specified in the referenced use case. Do not
reproduce the full spec — orient the reader to what exists today so the delta is clear.]

## Requested Change

[Precise description of what must change. Describe the delta only — what is added, removed, or
modified. Do not restate unchanged behavior.]

## Affected Layers

- [ ] UI (components, pages, forms)
- [ ] API (route handlers, server actions)
- [ ] Database (schema, migrations, seed data)
- [ ] Business Logic (validation rules, domain logic)
- [ ] Tests (E2E, integration, unit)

## Acceptance Criteria

- [ ] [Concrete, verifiable condition — one observable outcome per item]

## E2E Test Impact

| Test File | Test Name | Action Required |
|-----------|-----------|-----------------|
| [path/to/test.spec.ts] | [test name] | Update \| Add \| Remove |

**Annotation:** All updated and new E2E tests must carry both the original UC annotation
(e.g., `@UC-XXX`) and the CR annotation (e.g., `@CR-XXX`).

> If no E2E tests are affected, replace the table with: **None.**

## Related Artifacts

- **Use Case:** [UC-XXX (Name) — path to spec file]
- **Affected Files:** [list of files expected to change]

---

## Reference

### Status Values

| Status      | Description                                                        |
|-------------|--------------------------------------------------------------------|
| Open        | Documented, awaiting implementation.                               |
| Implemented | Implementation complete, pending evaluation.                       |
| Done        | Implemented, evaluated, and accepted.                              |
| Rejected    | Reviewed and decided against; reason documented in Related Artifacts. |
