# Definition of Ready

## Instructions

Before implementing a use case, validate its specification against the checklist below.
Read the use case file from `docs/use_cases/` and check every item. If any item fails,
report all failures to the user and **stop** — do not begin implementation until the user
either fixes the spec or explicitly waives the failing items.

## Checklist

### Structural Completeness

- [ ] **UC ID** — Use Case ID is present in `UC-XXX` format (zero-padded, 3 digits)
- [ ] **UC Name** — Use Case Name is defined
- [ ] **Primary Actor** — Primary Actor is identified
- [ ] **Goal** — Goal statement is present
- [ ] **Status Approved** — Status is `Approved` (not Draft, Review, or any other value)
- [ ] **Preconditions** — At least one precondition is listed
- [ ] **Main Success Scenario** — Numbered steps are present (minimum 3 steps)
- [ ] **Alternative Flows** — At least one alternative flow exists, each with a Trigger referencing a Main Success Scenario step number and numbered flow steps
- [ ] **Success Postconditions** — At least one success postcondition is defined
- [ ] **Failure Postconditions** — At least one failure postcondition is defined
- [ ] **Business Rules** — At least one business rule is documented

### Content Quality

- [ ] **No implementation details in steps** — Main Success Scenario and Alternative Flow steps use actor/system language (e.g., "User clicks Save"), not technical details (e.g., "System calls POST /api/orders")
- [ ] **Alternative flow triggers reference Main Success Scenario steps** — Each trigger specifies which Main Success Scenario step number it branches from
- [ ] **Preconditions are verifiable** — Each precondition describes a concrete, observable state (e.g., "User is logged in"), not a vague condition (e.g., "System is ready")

### Dependencies

- [ ] **Entity model exists** — `docs/entity_model.md` exists and covers the entities referenced in the use case
- [ ] **Database migration exists** — A corresponding database migration exists for the entities used in this use case
