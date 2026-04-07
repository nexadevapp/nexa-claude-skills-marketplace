# Sprint Refinement Proposal

**Sprint:** 2026-03-31
**Use Cases in Scope:** UC-042 (Landing Page), UC-001 (Register with Email), UC-043 (Login), UC-044 (Logout)

## Scope Summary

This sprint delivers the authentication foundation for **volunteers only**: a public landing page that introduces the platform to non-logged-in visitors, volunteer email-based registration with email confirmation, volunteer login, and logout. Together these four use cases establish the session lifecycle that every subsequent feature depends on. ONG, Company, and Admin login will be addressed in future sprints.

## BA / QA Flow Analysis

A click-by-click trace of all four user flows identified 5 issues that must be addressed to ensure a clean, zero-404 experience at sprint end.

### Flow 1: Visitor on Landing Page (`/`)

| # | User Action | Target | Status |
|---|------------|--------|--------|
| 1 | Clicks "Start Volunteering" (hero CTA) | `/register` | OK |
| 2 | Clicks "Browse Opportunities" (hero CTA) | — | **FIX: Remove or hide for sprint 1** |
| 3 | Clicks "Sign In" (nav) | `/login` | OK |
| 4 | Clicks "Get Started" (nav) | `/register` | OK |
| 5 | Clicks Home (nav logo) | `/` | OK |
| 6 | Clicks footer links | `#` anchors | OK — non-navigating placeholders |
| 7 | Clicks language switcher | — | OK |

### Flow 2: Visitor registers at `/register`

| # | User Action | Target | Status |
|---|------------|--------|--------|
| 1 | Fills form, submits | POST → system sends email | OK |
| 2 | Sees post-submit screen | `/register/check-email` | **FIX: Add check-email screen** |
| 3 | Clicks "Already have an account? Sign In" | `/login` | OK |
| 4 | Clicks confirmation link in email | `/api/auth/confirm?token=xxx` | **FIX: Add email confirmation route** |
| 5 | After confirming, lands on | `/login` with success message | **FIX: Define post-confirmation redirect** |

### Flow 3: Volunteer logs in at `/login`

| # | User Action | Target | Status |
|---|------------|--------|--------|
| 1 | Enters credentials, submits | → `/` (authenticated) | OK |
| 2 | Clicks "Forgot password?" | — | **FIX: Show "Coming soon" toast instead of navigating** |
| 3 | Clicks "Don't have an account? Register" | `/register` | OK |

### Flow 4: Authenticated volunteer on `/`

| # | User Action | Target | Status |
|---|------------|--------|--------|
| 1 | Sees hero CTAs | — | **FIX: Adapt CTAs when authenticated** |
| 2 | Clicks Logout (nav) | → `/` (unauthenticated) | OK |
| 3 | Nav shows email/initials + Logout | — | OK |

## Refined Requirements

### Existing Requirements (sprint-relevant)

| ID | Title | Priority | Mapped UCs | Refinement Depth | Notes |
|----|-------|----------|------------|------------------|-------|
| FR-AUTH-01 | Înregistrare cu Email & Parolă | must_have | UC-001 | Deep | Scoped to volunteer only — account type selector removed for this sprint |
| FR-NOTIF-01 | Confirmare înregistrare cont | must_have | UC-001 | Light-touch | Email confirmation notification — clear |

### Deferred Requirements (exist but out of sprint scope)

| ID | Title | Reason |
|----|-------|--------|
| FR-AUTH-06 | Selectare tip cont la înregistrare | Sprint 1 is volunteer-only — no account type selector needed |

### New Requirements (discovered during refinement)

| ID | Title | User Story | Priority | Mapped UCs | Rationale |
|----|-------|------------|----------|------------|-----------|
| FR-LAND-01 | Public Landing Page | As a visitor, I want to see a landing page that explains VoluntX so I can decide whether to register. | must_have | UC-042 | No existing FR covers the landing page. The wireframe defines the page (hero, how-it-works, testimonials, footer) but no requirement existed. |
| FR-LAND-02 | Navigation Bar (Public) | As a visitor, I want a top navigation bar with Home, Sign In, and Get Started so I can navigate the public site. | must_have | UC-042 | The wireframe shows a persistent nav bar. For non-logged-in users, only public links should be visible. |
| FR-AUTH-09 | Volunteer Login with Email & Password | As a registered volunteer, I want to log in with my email and password so I can access the platform. | must_have | UC-043 | No existing FR covers login. This is a critical gap — registration exists but login does not. |
| FR-AUTH-10 | Logout | As a logged-in volunteer, I want to log out so I can end my session securely. | must_have | UC-044 | No existing FR covers logout. Essential for session lifecycle. |
| FR-AUTH-11 | Navigation Bar (Authenticated) | As a logged-in volunteer, I want the navigation bar to show my identity and a logout option instead of Sign In / Get Started. | must_have | UC-043, UC-044 | The nav bar must change state based on auth status. For sprint 1, we only need the auth-state toggle — showing user identity and logout. |
| FR-AUTH-12 | Post-Registration Email Check Screen | As a new volunteer who just registered, I want to see a confirmation screen telling me to check my email so I know what to do next. | must_have | UC-001 | Identified in QA flow analysis — without this, the user sees nothing after submitting the registration form. |
| FR-AUTH-13 | Email Confirmation Handler | As a new volunteer clicking the confirmation link in my email, I want the system to activate my account and redirect me to the login page with a success message. | must_have | UC-001 | Identified in QA flow analysis — without this route, the email confirmation link leads to a 404. |

### Refinement Details

#### FR-AUTH-01: Înregistrare cu Email & Parolă (deep — scoped to volunteer)

**Assessment:** Requirements exist but were written for all account types. Sprint 1 narrows to volunteer-only.
**Refinements applied:**
- **No account type selector** — registration always creates a VOLUNTEER account. The account type selector (FR-AUTH-06) is deferred to a future sprint when ONG/Company registration is needed.
- Confirmed password confirmation field is required (visible in wireframe, not explicitly stated in requirements)
- Password strength indicator is present in wireframe — treat as UI detail, not a new FR
- Registration form must include consent checkboxes (terms, data processing, cookies) — the USER entity already has these fields but requirements don't mention them explicitly

**Decision:** Add consent checkboxes as a business rule to UC-001 spec, not a separate FR, since the entity model already accounts for it.

#### FR-LAND-01: Public Landing Page (deep refinement)

**Refined specification:**
- **Hero section:** Tagline, description, single primary CTA ("Start Volunteering" → Register), platform statistics (active volunteers, partner NGOs, hours logged), and a sample profile card visual
- **"Browse Opportunities" CTA:** Removed from sprint 1 landing page. The opportunities page does not exist yet. This button will be restored when UC-012 (Search and Apply for Volunteer Opportunities) is delivered.
- **How It Works section:** Three-step process (Create Profile → Volunteer & Get Validated → Access Career Opportunities)
- **Testimonials section:** Three testimonial cards from volunteer, NGO, and company perspectives
- **Footer:** Four-column layout with links organized by audience (Volunteers, Organizations, Companies) plus branding. All links are non-navigating `#` anchors for sprint 1 — no 404 risk.
- **Authenticated state:** When logged in, the hero CTA changes from "Start Volunteering" to "Welcome back, {email}" or similar greeting. The registration CTA is hidden since the user is already registered.
- **Responsive:** Must work on mobile and desktop
- **i18n:** Support EN and RO (wireframe has both language maps)
- **No database interaction:** This is a purely static/presentational page (except the auth-state check for CTA adaptation)

**Acceptance criteria:**
- Landing page is the default route (`/`) for all users (authenticated and non-authenticated)
- All sections render correctly on mobile (375px) and desktop (1400px)
- Non-authenticated: "Start Volunteering" button navigates to `/register`
- Authenticated: hero CTA adapts (no registration CTA shown)
- "Browse Opportunities" CTA is not present in sprint 1
- Language switcher toggles between EN and RO
- Footer links are non-navigating placeholders (no 404s)
- Page loads without requiring authentication

#### FR-AUTH-09: Volunteer Login with Email & Password (deep refinement)

**Refined specification:**
- Login page at `/login` with email and password fields
- System validates credentials against stored `password_hash`
- System checks `email_confirmed = true` before allowing login; if not confirmed, show message
- System checks `status` is not SUSPENDED; if suspended, show message
- On successful login, create a session and redirect to `/` (landing page in authenticated state)
- "Forgot password?" link visible but non-navigating — clicking it shows an inline toast/message: "Password recovery coming soon". This avoids a 404 while keeping the UI consistent with the full wireframe.
- "Don't have an account? Register" link navigates to `/register`
- Rate limiting: max 5 failed attempts per email per 15 minutes
- **Volunteer-only scope:** The login page itself is generic (email + password), but for sprint 1 only volunteer accounts exist. No special handling needed for other account types yet.

**Acceptance criteria:**
- Volunteer can log in with valid email and password
- Invalid credentials show a generic error ("Invalid email or password") — no enumeration
- Unconfirmed email shows "Please confirm your email before logging in"
- Suspended account shows "Your account has been suspended"
- Successful login creates a session and redirects to `/` (landing page, now showing authenticated nav)
- Failed login attempts are rate-limited (5 per 15 min per email)
- "Forgot password?" shows "Coming soon" toast — does not navigate
- "Don't have an account? Register" navigates to `/register`

#### FR-AUTH-10: Logout (deep refinement)

**Refined specification:**
- Logout action available from the navigation bar (user dropdown or button)
- On logout, the server-side session is invalidated
- User is redirected to the landing page (`/`)
- No confirmation dialog needed — logout is immediate

**Acceptance criteria:**
- Clicking "Logout" ends the session immediately
- After logout, the user is redirected to the landing page
- After logout, accessing protected routes redirects to the login page
- The navigation bar reverts to the non-authenticated state (Sign In / Get Started)

#### FR-AUTH-11: Navigation Bar (Authenticated) (deep refinement)

**Refined specification:**
- When authenticated, the nav bar replaces "Sign In" / "Get Started" with:
  - User avatar/initials + email (name not yet available until onboarding — out of sprint scope)
  - Logout button/link
- For sprint 1, other nav links (Dashboard, Profile, Messages, etc.) are NOT required — they belong to later use cases
- The nav bar must be a shared layout component used across all pages

**Acceptance criteria:**
- Non-authenticated: shows "Sign In" and "Get Started" buttons
- Authenticated: shows user email/initials and "Logout" button
- State change happens without full page reload (client-side session check)

#### FR-AUTH-12: Post-Registration Email Check Screen (deep refinement)

**Refined specification:**
- After successful registration form submission, redirect to `/register/check-email`
- Page displays: "We've sent a confirmation link to **{email}**. Please check your inbox."
- Include a "Resend email" button (sends a new confirmation email)
- Include a "Back to Sign In" link → `/login`
- The page does not require authentication (the user hasn't confirmed yet)

**Acceptance criteria:**
- After registration, user is redirected to `/register/check-email`
- The registered email address is displayed on the page
- "Resend email" sends a new confirmation email
- "Back to Sign In" navigates to `/login`
- Direct access to `/register/check-email` without registration context redirects to `/register`

#### FR-AUTH-13: Email Confirmation Handler (deep refinement)

**Refined specification:**
- Route: `GET /api/auth/confirm?token=xxx`
- System validates the token (exists, not expired, not already used)
- On valid token: set `email_confirmed = true` and `status = ACTIVE` on the user record, then redirect to `/login?confirmed=true`
- On `/login`, when `confirmed=true` query param is present, show a success banner: "Email confirmed! You can now log in."
- On invalid/expired token: redirect to `/login?error=invalid-token` with error message: "This confirmation link is invalid or has expired."
- Token expiry: 24 hours from registration
- Token is single-use — consumed on first successful confirmation

**Acceptance criteria:**
- Valid token activates the account and redirects to `/login` with success message
- Expired token shows an error message on `/login`
- Already-used token shows an error message on `/login`
- Invalid/malformed token shows an error message on `/login`
- Token expires after 24 hours

## Entity Model Changes

### Modified Entities

#### USER

| Change | Attribute | From | To | Rationale |
|--------|-----------|------|----|-----------|
| Modify | auth_provider | Values: EMAIL, GOOGLE, LINKEDIN | Values: EMAIL | Google and LinkedIn social login removed from scope |

### New Attributes

#### USER

| Change | Attribute | Type | Constraints | Rationale |
|--------|-----------|------|-------------|-----------|
| Add | email_confirmation_token | String | VarChar(255), Optional, Unique | Token sent via email for account activation (FR-AUTH-13) |
| Add | email_confirmation_sent_at | DateTime | Optional | Timestamp for token expiry calculation (24h TTL) (FR-AUTH-13) |

### No New Entities

The USER entity with the two new attributes has all fields needed for email registration, confirmation, login, and session management. No new entities are required.

### No New Relationships

No new relationships needed for this sprint.

## Use Case Diagram Changes

### New Use Cases

| UC ID | Name | Actor(s) | Rationale |
|-------|------|----------|-----------|
| UC-042 | View Landing Page | Visitor (anonymous) | Public landing page — no existing UC covered this |
| UC-043 | Login | Volunteer | Volunteer authentication entry point — was never modeled as a UC. Scoped to volunteer only for sprint 1; other actors will be connected in future sprints. |
| UC-044 | Logout | Volunteer | Volunteer session termination — was never modeled as a UC. Scoped to volunteer only for sprint 1; other actors will be connected in future sprints. |

### New Actor

| Actor | Rationale |
|-------|-----------|
| Visitor | Unauthenticated user browsing the public site. Needed for UC-042. Distinct from Volunteer/ONG/Company because they have no account yet. |

### Updated Relationships

| Change | Detail | Rationale |
|--------|--------|-----------|
| Add dependency | UC-043 depends on UC-001 | Must register before logging in |
| Add dependency | UC-044 depends on UC-043 | Must be logged in to log out |

### Scope Note for UC-001

UC-001 "Register with Email" currently lists Volunteer, ONG Representative, and Company Recruiter as actors in the diagram. For sprint 1, implementation is **volunteer-only**. The diagram will retain all actors for the full product vision, but the spec and design generated this sprint cover only the volunteer flow.

### No Changes to Delivered Use Cases

No use cases have been delivered, so no change requests are needed.

## Route Map (Sprint 1)

Complete list of routes that must exist at sprint end for a zero-404 experience:

| Route | Type | Auth Required | Purpose |
|-------|------|---------------|---------|
| `/` | Page | No | Landing page (adapts CTAs when authenticated) |
| `/register` | Page | No | Volunteer registration form |
| `/register/check-email` | Page | No | Post-registration "check your email" screen |
| `/api/auth/register` | API | No | POST — create account, send confirmation email |
| `/api/auth/confirm` | API | No | GET — validate token, activate account, redirect to `/login` |
| `/api/auth/resend-confirmation` | API | No | POST — resend confirmation email |
| `/login` | Page | No | Login form (shows success/error banners via query params) |
| `/api/auth/login` | API | No | POST — validate credentials, create session |
| `/api/auth/logout` | API | Yes | POST — invalidate session, redirect to `/` |

## Open Questions

No open questions — the scope is clear and self-contained. All decisions have been documented above.
