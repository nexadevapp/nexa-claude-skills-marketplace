# Definition of Ready — Bug Fix

## Instructions

Before implementing a bug fix, validate the bug report against the checklist below.
Read the bug report from `docs/bugs/` and check every item. If any item fails,
report all failures to the user and **stop** — do not begin implementation until the user
either fixes the report or explicitly waives the failing items.

## Checklist

### Structural Completeness

- [ ] **BUG ID** — Bug ID is present in `BUG-XXX` format (zero-padded, 3 digits)
- [ ] **Title** — Title is defined and describes the defect
- [ ] **Severity** — Severity is one of: Critical, High, Medium, Low
- [ ] **Status Open** — Status is `Open` (not Fixed, Closed, or any other value)
- [ ] **Steps to Reproduce** — At least one numbered reproduction step is listed
- [ ] **Expected Behavior** — Expected behavior is described
- [ ] **Actual Behavior** — Actual behavior is described and differs from expected

### Content Quality

- [ ] **Steps are reproducible** — Steps are concrete and specific enough to reproduce the bug independently
- [ ] **Not a duplicate** — No other open bug in `docs/bugs/` describes the same defect

### Dependencies

- [ ] **Related artifacts listed or explicitly none** — Related use cases, technical tasks, or business rules are listed, or explicitly stated as none
