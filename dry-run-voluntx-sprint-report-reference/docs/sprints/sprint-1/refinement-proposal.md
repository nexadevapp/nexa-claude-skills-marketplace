# Sprint Refinement Proposal

**Sprint:** 2026-04-01
**Use Cases in Scope:** UC-043, UC-044, UC-004

## Scope Summary

This sprint completes the authentication lifecycle: login, logout (carried over from sprint 1 with specs and designs ready), and password reset. Together with the delivered UC-001 (Register) and UC-042 (Landing Page), this delivers a full-featured authentication system with account recovery. UC-005 (2FA) was considered but deferred due to `could_have` priority and significant complexity.

## Refined Requirements

### Existing Requirements (sprint-relevant)

| ID | Title | Priority | Mapped UCs | Refinement Depth | Notes |
|----|-------|----------|------------|------------------|-------|
| FR-AUTH-09 | Volunteer Login with Email & Password | must_have | UC-043 | Light-touch | Well-specified; update needed: "Forgot password?" link must navigate to `/forgot-password` instead of showing toast (UC-004 now in scope) |
| FR-AUTH-10 | Logout | must_have | UC-044 | Light-touch | Already detailed, no changes needed |
| FR-AUTH-11 | Navigation Bar (Authenticated) | must_have | UC-043, UC-044 | Light-touch | Already detailed, no changes needed |
| FR-AUTH-04 | Recuperare parolă | must_have | UC-004 | Deep | Skeletal — only 2 acceptance criteria in Romanian, no flow details, no entity mapping, no business rules |

### New Requirements (discovered during refinement)

| ID | Title | User Story | Priority | Mapped UCs | Rationale |
|----|-------|------------|----------|------------|-----------|
| FR-AUTH-14 | Password Reset Token Handler | As a volunteer, I want to click a link in my email to reset my password so I can regain access to my account | must_have | UC-004 | FR-AUTH-04 only mentions "email reset flow" but doesn't specify the token-based reset route, analogous to FR-AUTH-13 for email confirmation |

### Refinement Details

#### FR-AUTH-09: Volunteer Login (light-touch)

**Assessment:** Well-specified in requirements.md and UC-043 spec. One change needed.

**Change required:** BR-043-06 ("Forgot password?" shows "Coming soon" toast) must be updated now that UC-004 is in scope. The "Forgot password?" link should navigate to `/forgot-password` instead.

**Impact on UC-043 spec:** Alternative flow A7 must change from "displays toast 'Coming soon'" to "navigates to `/forgot-password`". Business rule BR-043-06 must be removed.

#### FR-AUTH-10: Logout (light-touch)

**Assessment:** Already well-specified in requirements.md and UC-044 spec. No changes needed.

#### FR-AUTH-11: Navigation Bar (light-touch)

**Assessment:** Already well-specified. No changes needed.

#### FR-AUTH-04: Recuperare parolă (deep refinement)

**Original:** "Flux complet de resetare parolă prin email. Utilizatorul primește un link de resetare valid prin email."

**Refined:**

Full password recovery flow with two phases:

**Phase 1 — Request Reset:**
- Route: `/forgot-password`
- Volunteer enters their registered email address
- System sends a password reset email with a tokenized link (regardless of whether the email exists — no enumeration)
- Redirect to `/forgot-password/check-email` with instructions
- Rate limiting: max 3 reset requests per email per hour
- Token stored as `password_reset_token` on USER, with `password_reset_sent_at` for expiry

**Phase 2 — Reset Password:**
- Route: `GET /api/auth/reset-password?token=xxx` validates token, redirects to `/reset-password?token=xxx`
- Route: `/reset-password?token=xxx` renders new password form (password + confirm password)
- Password validation: same rules as registration (min 8 chars, complexity)
- On success: token is consumed, password_hash updated, redirect to `/login?password-reset=true` with success banner
- On invalid/expired token: redirect to `/forgot-password?error=invalid-token`
- Token expiry: 1 hour (shorter than email confirmation's 24h for security)
- Token is single-use

**Business rules:**
- BR-004-01: No email enumeration — "If an account with that email exists, we've sent a reset link" regardless of whether email is found
- BR-004-02: Token expiry — 1 hour from `password_reset_sent_at`
- BR-004-03: Single-use token — consumed on successful reset
- BR-004-04: Rate limiting — max 3 requests per email per hour
- BR-004-05: Volunteer-only scope — same as login (sprint 2 scope)
- BR-004-06: Active session invalidation — all existing sessions for the user are invalidated when password is reset

**Acceptance criteria (refined):**
- Volunteer can request a password reset from `/forgot-password`
- Email with reset link is sent (or appears to be sent for non-existent emails)
- Valid token allows setting a new password at `/reset-password`
- Expired token (>1 hour) shows error and redirects to `/forgot-password`
- Already-used token shows error
- After reset, volunteer can log in with the new password
- After reset, previous sessions are invalidated
- Rate limiting prevents more than 3 requests per email per hour

## Entity Model Changes

### New Attributes

#### USER

| Change | Attribute | From | To | Rationale |
|--------|-----------|------|----|-----------|
| Add | password_reset_token | — | String, VarChar(255), Optional, Unique | Token for password reset flow (UC-004), analogous to email_confirmation_token |
| Add | password_reset_sent_at | — | DateTime, Optional | Expiry calculation for password reset token (1h TTL) |

### No New Entities

No new entities needed. All changes are additions to the existing USER entity.

### No New Relationships

No new relationships needed.

## Use Case Diagram Changes

### Updated Relationships

| Change | Detail | Rationale |
|--------|--------|-----------|
| Add dependency | UC-004 ..> UC-001 : <<depends>> | Must have a registered account to recover password |
| Add connection | volunteer --> UC-004 | Volunteer actor can recover password (already exists in diagram) |

### No Split/Merge/New Use Cases

All 3 use cases map cleanly to their requirements. No splits or additions needed.

### Change Requests for Delivered Use Cases

None. UC-043's "Forgot password? Coming soon" behavior is changed, but UC-043 is **not delivered** (no iteration log exists), so it can be modified directly.

## GAP Analysis

### GAP-001: UC-043 spec references deferred password recovery

- **Type:** Spec Inconsistency
- **Severity:** Warning (auto-resolved by this sprint)
- **Affected:** UC-043
- **Description:** UC-043 alternative flow A7 and business rule BR-043-06 say "Forgot password?" shows "Coming soon" toast. With UC-004 now in scope, this must be updated to navigate to `/forgot-password`.
- **Resolution:** Update UC-043 spec — change A7 flow and remove BR-043-06.

### GAP-002: FR-AUTH-04 has no entity mapping

- **Type:** Entity Gap
- **Severity:** Warning (resolved by entity model changes above)
- **Affected:** UC-004
- **Description:** FR-AUTH-04 references password reset via email but the USER entity has no `password_reset_token` or `password_reset_sent_at` attributes.
- **Resolution:** Add 2 attributes to USER entity.

### GAP-003: FR-AUTH-04 requirement is skeletal

- **Type:** Traceability Gap
- **Severity:** Warning (resolved by refinement above)
- **Affected:** UC-004
- **Description:** FR-AUTH-04 has only 2 acceptance criteria in Romanian, with no flow details, no business rules, and no entity mapping. The refined version above provides the necessary detail.
- **Resolution:** Update requirements.md with refined content during Phase 4.

### GAP-004: UC-043 needs new alternative flow for password-reset success banner

- **Type:** Spec Gap
- **Severity:** Warning (resolved during Phase 6)
- **Affected:** UC-043
- **Description:** UC-004 redirects to `/login?password-reset=true` after successful password reset. UC-043 needs a new alternative flow (A9) to display a success banner for this query parameter, analogous to A5 (`?confirmed=true`).
- **Resolution:** Add A9 to UC-043 spec during Phase 6.

## Open Questions

No open questions. All decisions have been made:
1. UC-005 (2FA) is deferred.
2. Sprint scope is UC-043, UC-044, UC-004.
3. Entity model changes are limited to 2 new USER attributes.
