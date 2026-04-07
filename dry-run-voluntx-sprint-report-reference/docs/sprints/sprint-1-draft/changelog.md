# Sprint Change Log

**Sprint:** 2026-03-31
**Date:** 2026-03-31

## Requirements Changes

| Action | ID | Title | Detail |
|--------|-----|-------|--------|
| Added | FR-AUTH-09 | Volunteer Login with Email & Password | Volunteer login with rate limiting, error handling, session creation |
| Added | FR-AUTH-10 | Logout | Immediate session termination with redirect to landing page |
| Added | FR-AUTH-11 | Navigation Bar (Authenticated) | Auth-state nav bar toggle: Sign In/Get Started vs user identity/Logout |
| Added | FR-AUTH-12 | Post-Registration Email Check Screen | Check-email screen at `/register/check-email` with resend button |
| Added | FR-AUTH-13 | Email Confirmation Handler | Token-based email confirmation route with 24h expiry |
| Added | FR-LAND-01 | Public Landing Page | Landing page with hero, how-it-works, testimonials, footer |
| Added | FR-LAND-02 | Navigation Bar (Public) | Public nav bar with Home, Sign In, Get Started, language switcher |
| Refined | FR-AUTH-01 | Înregistrare cu Email & Parolă | Scoped to volunteer-only for sprint 1; no account type selector |
| Deferred | FR-AUTH-06 | Selectare tip cont la înregistrare | Deferred — sprint 1 is volunteer-only |

## Entity Model Changes

| Action | Entity/Attribute | Detail |
|--------|-----------------|--------|
| Modified attribute | USER.auth_provider | Values narrowed from EMAIL, GOOGLE, LINKEDIN to EMAIL only |
| Added attribute | USER.email_confirmation_token | String, VarChar(255), Optional, Unique — for account activation |
| Added attribute | USER.email_confirmation_sent_at | DateTime, Optional — for 24h token expiry calculation |

## Use Case Diagram Changes

| Action | UC ID | Detail |
|--------|-------|--------|
| Added actor | Visitor | Unauthenticated user for public pages |
| Added rectangle | Public | Contains UC-042 |
| Added | UC-042 | View Landing Page — Visitor actor |
| Added | UC-043 | Login — Volunteer actor, depends on UC-001 |
| Added | UC-044 | Logout — Volunteer actor, depends on UC-043 |
| Added dependency | UC-043 → UC-001 | Must register before logging in |
| Added dependency | UC-044 → UC-043 | Must be logged in to log out |
| Added connections | volunteer → UC-043, UC-044 | Volunteer can login and logout |

## Migration Required

**Yes** — Entity model changed (2 new attributes on USER, auth_provider values narrowed). `/prisma-migration` must run before delivery.
