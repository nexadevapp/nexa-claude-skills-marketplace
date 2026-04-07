# Sprint Readiness Report

**Sprint:** 2026-04-01
**Use Cases:** UC-043, UC-044, UC-004
**Date:** 2026-04-01

## Verdict: READY FOR DELIVERY

This sprint delivers the complete authentication lifecycle: login, logout, and password recovery. All specifications and designs are complete. One pre-delivery action is required (Prisma migration for 2 new USER attributes).

## Changes Applied This Sprint

| Document | Changes | See |
|----------|---------|-----|
| docs/requirements.md | 1 added (FR-AUTH-14), 2 refined (FR-AUTH-04, FR-AUTH-09) | changelog.md |
| docs/entity_model.md | 2 attributes added to USER (password_reset_token, password_reset_sent_at) | changelog.md |
| docs/use_cases.puml | 1 dependency added (UC-004 → UC-001) | changelog.md |

## Artifact Status

| UC ID | Name | Spec | Design | Notes |
|-------|------|------|--------|-------|
| UC-043 | Login | Updated | Pre-existing | A7 updated (forgot-password navigation), BR-043-06 removed, A9 added (password-reset banner) |
| UC-044 | Logout | Pre-existing | Pre-existing | No changes needed |
| UC-004 | Recover Password | Generated | Generated | 8 sections: forgot-password form, error banner, rate limit, check-email, reset form, validation errors, loading, success banner |

## Delivery Order

Recommended order for running `/deliver-use-case` on each selected use case:

| # | UC ID | Name | Rationale |
|---|-------|------|-----------|
| 1 | UC-043 | Login | Dependencies all delivered (UC-001). Establishes authenticated state needed by UC-044. |
| 2 | UC-044 | Logout | Depends on UC-043 (must be logged in to log out). |
| 3 | UC-004 | Recover Password | Depends on delivered UC-001. Links from login page (UC-043 A7). Delivered last because it extends the login flow. |

## Pre-Delivery Actions

| # | Action | Command | Status |
|---|--------|---------|--------|
| 1 | Run Prisma migration for entity changes | `/prisma-migration` | **Required** |

## Gaps

No gaps identified. All gaps from the refinement proposal have been resolved:
- GAP-001: UC-043 A7 updated, BR-043-06 removed
- GAP-002: Entity model updated with 2 new USER attributes
- GAP-003: FR-AUTH-04 refined with full flow details
- GAP-004: UC-043 A9 added for password-reset success banner

## Route Coverage Verification

All routes from UC-004 are covered by specs and designs:

| Route | Type | Covered By |
|-------|------|-----------|
| `/forgot-password` | Page | UC-004 spec + design (sections 1-3) |
| `/forgot-password?error=invalid-token` | Page | UC-004 spec (A8) + design (section 2) |
| `/forgot-password/check-email` | Page | UC-004 spec (MSS-10, A1) + design (section 4) |
| `/api/auth/reset-password?token=xxx` | API | UC-004 spec (MSS-12) |
| `/reset-password?token=xxx` | Page | UC-004 spec (MSS-13-17) + design (sections 5-7) |
| `/login?password-reset=true` | Page | UC-043 spec (A9) + UC-004 design (section 8) |

Previously covered routes (from sprint 1):

| Route | Type | Covered By |
|-------|------|-----------|
| `/login` | Page | UC-043 spec + design |
| `/api/auth/login` | API | UC-043 spec |
| `/api/auth/logout` | API | UC-044 spec |

## Cross-Use-Case Consistency

| Check | Status |
|-------|--------|
| UC-043 A7 (Forgot password?) → UC-004 precondition (volunteer on /forgot-password) | Compatible — link navigates to `/forgot-password` |
| UC-004 postcondition (redirects to /login?password-reset=true) → UC-043 A9 (success banner) | Compatible — UC-043 displays "Your password has been reset" banner |
| UC-004 BR-004-06 (session invalidation) → UC-044 (logout behavior) | Compatible — sessions invalidated server-side, same mechanism |
| UC-043 postcondition (session created) → UC-044 precondition (volunteer is logged in) | Compatible — authenticated nav includes Logout button |
| UC-044 postcondition (session invalidated, redirected to /) → UC-042 (landing in non-auth state) | Compatible — nav reverts to Sign In / Get Started |

## Sprint Artifacts

- `docs/sprints/sprint-1/refinement-proposal.md`
- `docs/sprints/sprint-1/changelog.md`
- `docs/sprints/sprint-1/readiness-report.md` (this file)
- `docs/use_cases/UC-043.md` (updated)
- `docs/use_cases/UC-044.md` (unchanged)
- `docs/use_cases/UC-004.md` (new)
- `docs/designs/UC-043-design.html` (unchanged)
- `docs/designs/UC-044-design.html` (unchanged)
- `docs/designs/UC-004-design.html` (new)

## Next Steps

1. Run `/prisma-migration` to add `password_reset_token` and `password_reset_sent_at` to USER
2. Run `/deliver-use-case UC-043` — Login
3. Run `/deliver-use-case UC-044` — Logout
4. Run `/deliver-use-case UC-004` — Recover Password
