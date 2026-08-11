# Definition of Ready — Technical Task

## Instructions

Before implementing a technical task, validate its specification against the checklist below.
Read the technical task file from `docs/technical_tasks/` and check every item. If any item fails,
report all failures to the user and **stop** — do not begin implementation until the user
either fixes the spec or explicitly waives the failing items.

## Checklist

### Structural Completeness

- [ ] **TT ID** — Task ID is present in `TT-XXX` format (zero-padded, 3 digits)
- [ ] **TT Name** — Task Name is defined
- [ ] **Category** — Category is one of: Configuration, Cleanup, Dependency, Infrastructure, DevEx
- [ ] **Goal** — Goal statement is present and explains both what and why
- [ ] **Status Approved** — Status is `Approved` (not Draft, Review, or any other value)
- [ ] **Acceptance Criteria** — At least one concrete, verifiable acceptance criterion is listed
- [ ] **Affected Areas** — At least one affected area is identified

### Content Quality

- [ ] **Acceptance criteria are verifiable** — Each criterion describes a concrete, observable outcome (e.g., "application starts with dev profile"), not a vague condition (e.g., "setup works")
- [ ] **No use-case-level behavior** — The task does not describe user-facing actor-system interactions (those belong in a use case)

### Dependencies

- [ ] **Dependencies listed or explicitly none** — Dependencies on other TTs or UCs are listed, or "None" is stated explicitly
