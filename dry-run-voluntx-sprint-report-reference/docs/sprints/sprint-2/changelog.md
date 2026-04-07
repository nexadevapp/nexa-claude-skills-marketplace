# Sprint Change Log

**Sprint:** 2026-04-02
**Date:** 2026-04-02

## Requirements Changes

| Action | ID | Title | Detail |
|--------|-----|-------|--------|
| Added | FR-ONB-10 | Onboarding Route Guard | Middleware redirect for incomplete onboarding — discovered during refinement |
| Refined | FR-ONB-05 | Liste predefinite pentru skill-uri | Simplified: 6 hard-coded skills, 3 hard-coded languages, no autocomplete/custom. Dynamic lists deferred to change request |
| Deferred | FR-ONB-06 | Upload CV cu preview | No file uploads this sprint — deferred to change request |

## Entity Model Changes

| Action | Entity/Relationship | Detail |
|--------|---------------------|--------|
| None | — | No entity model changes required |

## Use Case Diagram Changes

| Action | UC ID | Detail |
|--------|-------|--------|
| Added dependency | UC-003 → UC-001 | Onboarding requires registered account — made explicit |

## Migration Required

No — entity model unchanged.
