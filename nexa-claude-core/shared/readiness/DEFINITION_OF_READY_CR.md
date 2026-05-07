# Definition of Ready — Change Request

## Instructions

Before implementing a change request, validate the CR document against the checklist below.
Read the CR from `docs/change_requests/` and check every item. If any item fails,
report all failures to the user and **stop** — do not begin implementation until the user
either fixes the document or explicitly waives the failing items.

## Checklist

### Structural Completeness

- [ ] **CR ID** — CR ID is present in `CR-XXX` format (zero-padded, 3 digits)
- [ ] **Title** — Title describes the change, not the symptom or the ticket
- [ ] **Status Open** — Status is `Open`
- [ ] **References** — References exactly one `UC-XXX` with the use case name
- [ ] **Context** — Context section describes the current behavior anchored in the referenced UC
- [ ] **Requested Change** — Requested Change is specific, complete, and describes the delta only
- [ ] **Affected Layers** — At least one layer is checked
- [ ] **Acceptance Criteria** — At least one concrete, verifiable criterion is listed

### E2E Test Impact

- [ ] **Enumerated or explicitly None** — E2E Test Impact lists specific test files and test names
  with required actions, or explicitly states "None"
- [ ] **Annotation rule stated** — The dual-annotation requirement (`@UC-XXX` + `@CR-XXX`) is present

### Content Quality

- [ ] **Delta only** — Requested Change does not reproduce unchanged behavior from the use case
- [ ] **Single UC reference** — The CR references exactly one use case (not multiple)
- [ ] **Not a duplicate** — No other open CR in `docs/change_requests/` addresses the same change
- [ ] **Not a bug** — The change is intentional and stakeholder-approved, not an unintended deviation
