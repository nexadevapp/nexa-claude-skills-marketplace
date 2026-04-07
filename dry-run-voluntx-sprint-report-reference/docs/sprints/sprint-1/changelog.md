# Sprint Change Log

**Sprint:** 2026-04-01
**Date:** 2026-04-01

## Requirements Changes

| Action | ID | Title | Detail |
|--------|----|-------|--------|
| Refined | FR-AUTH-04 | Recuperare parolă (Password Recovery) | Deep refinement: added 2-phase flow (request + reset), 6 business rules, 8 acceptance criteria, entity mapping |
| Refined | FR-AUTH-09 | Volunteer Login with Email & Password | "Forgot password?" link changed from "Coming soon" toast to navigation to `/forgot-password` |
| Added | FR-AUTH-14 | Password Reset Token Handler | New requirement for token validation route `GET /api/auth/reset-password?token=xxx` |

## Entity Model Changes

| Action | Entity/Relationship | Detail |
|--------|---------------------|--------|
| Added attribute | USER.password_reset_token | String(255), Optional, Unique — token for password reset flow |
| Added attribute | USER.password_reset_sent_at | DateTime, Optional — expiry calculation (1h TTL) |

## Use Case Diagram Changes

| Action | UC ID | Detail |
|--------|-------|--------|
| Added dependency | UC-004 ..> UC-001 | Password recovery depends on having a registered account |

## Migration Required

Yes — `/prisma-migration` must run before delivery to add `password_reset_token` and `password_reset_sent_at` to USER.
