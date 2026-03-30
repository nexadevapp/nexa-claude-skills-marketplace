# VoluntX — Requirements Documentation

> Generated on 3/20/2026

## Use Cases

### Use Case: View Landing Page

# UC-000: View Landing Page

**Actor:** Unauthenticated User (Visitor)

## Preconditions
- The user is not currently authenticated on the VoluntX platform.

## Main Flow
1. The visitor navigates to the VoluntX root URL.
2. The system displays the public landing page with:
   - Hero section with the platform's value proposition and a primary CTA ("Register" / "Get Started").
   - Brief explanation of how VoluntX works (e.g., Register → Build Profile → Volunteer → Grow Career).
   - Key statistics or social proof (number of volunteers, NGOs, opportunities — if available).
   - Secondary CTA to log in for existing users.
   - Footer with legal links (Terms of Service, Privacy Policy, Cookie Policy).
3. The visitor clicks the "Register" CTA.
4. The system navigates the visitor to the registration page (UC-001).

## Alternative Flows
### Visitor Chooses to Log In
1. (Steps 1-2 as above)
2. The visitor clicks the "Log In" link/button.
3. The system navigates the visitor to the login page (UC-001B).

### Visitor Is Already Authenticated
1. An authenticated user navigates to the root URL.
2. The system detects an active session.
3. The system redirects the user to their appropriate dashboard based on `account_type`:
   - VOLUNTEER → Volunteer Dashboard / Onboarding Wizard (if `onboarding_completed` is false).
   - ONG → ONG Dashboard.
   - COMPANY → Company Dashboard.
   - ADMIN → Admin Dashboard.

## Postconditions
- The visitor has been presented with the platform's value proposition.
- The visitor can proceed to registration or login.

## Business Rules
- BR-000-01: The landing page must be fully accessible without authentication.
- BR-000-02: Authenticated users must never see the landing page; they are always redirected.
- BR-000-03: The page must load within the FCP < 2s performance requirement (NFR).

## Entity Mapping
- `USER.status`, `USER.account_type`, `USER.onboarding_completed` — used for redirect logic when user is already authenticated.

---

### Use Case: Register as a New Volunteer

# UC-001: Register with Email & Password

**Actor:** New User (Volunteer, ONG Representative, or Company Recruiter)

## Preconditions
- The user is not registered on the VoluntX platform.
- The user has navigated to the registration page from the landing page (UC-000).

## Main Flow
1. The system displays the registration form with fields: Email, Password, Confirm Password, and Account Type selector (Volunteer / ONG / Company).
2. The user selects their account type (FR-AUTH-06).
3. The user enters a valid email address and a password that meets complexity rules (min. 8 characters, at least one uppercase, one lowercase, one digit, one special character).
4. The user confirms their password.
5. The user accepts the Terms of Service, Privacy Policy, and Data Processing consent (mandatory checkboxes).
6. The user optionally accepts cookie consent.
7. The user clicks "Register".
8. The system validates all fields:
   - Email format is valid and not already registered.
   - Password meets complexity rules.
   - Password and confirmation match.
   - All mandatory consents are accepted.
9. The system creates a new `USER` record with `status: PENDING`, `auth_provider: EMAIL`, `email_confirmed: false`.
10. The system sends a confirmation email containing a unique, time-limited verification link (UC-001A).
11. The system displays a "Check your email" confirmation screen with instructions and a "Resend email" option.

## Alternative Flows
### Email Already Registered
1. (Steps 1-7 as above)
2. The system detects the email is already associated with an existing account.
3. The system displays an error: "An account with this email already exists."
4. The system offers a link to the login page (UC-001B) and password recovery (UC-004).

### Validation Errors
1. (Steps 1-7 as above)
2. The system detects one or more validation errors (weak password, email format, mismatched passwords, missing consents).
3. The system highlights the offending fields with inline error messages.
4. The user corrects the errors and resubmits.

### Resend Confirmation Email
1. (Steps 1-11 as above)
2. The user clicks "Resend email" on the confirmation screen.
3. The system invalidates the previous verification token and sends a new confirmation email.
4. The system displays a success message: "A new confirmation email has been sent."

## Postconditions
- A new `USER` record exists with `status: PENDING` and `email_confirmed: false`.
- `consent_terms`, `consent_data_processing` are set to `true`; `consent_cookies` reflects user choice.
- A confirmation email has been sent to the user's email address.
- The user cannot log in until email verification is complete (UC-001A).

## Business Rules
- BR-001-01: Passwords must be stored as bcrypt hashes in `USER.password_hash`. Plaintext passwords must never be persisted or logged.
- BR-001-02: The verification token must expire after 24 hours.
- BR-001-03: The "Resend email" action is rate-limited to 3 attempts per 15 minutes.
- BR-001-04: Account type selection determines the post-onboarding flow: VOLUNTEER → Onboarding Wizard (UC-003); ONG → ONG Verification (UC-002); COMPANY → Company Verification (UC-002 variant).
- BR-001-05: All mandatory consents (`consent_terms`, `consent_data_processing`) must be `true` before account creation. This is a GDPR requirement.

## Entity Mapping
- `USER`: id, email, password_hash, account_type, status (PENDING), auth_provider (EMAIL), email_confirmed (false), consent_cookies, consent_data_processing, consent_terms, onboarding_completed (false), created_at, updated_at.

---

### Use Case: Verify Email Address

# UC-001A: Verify Email Address

**Actor:** Registered User (email unconfirmed)

## Preconditions
- The user has completed registration (UC-001) and has `email_confirmed: false`.
- The user has received a confirmation email with a verification link containing a unique token.

## Main Flow
1. The user clicks the verification link in their email.
2. The system receives the request with the verification token.
3. The system validates the token:
   - The token exists and is associated with a `USER` record.
   - The token has not expired (within 24-hour window).
   - The token has not been previously used.
4. The system sets `USER.email_confirmed` to `true`.
5. The system sets `USER.status` to `ACTIVE`.
6. The system invalidates the verification token (single-use).
7. The system displays a success page: "Your email has been verified!" with a CTA to log in (UC-001B).

## Alternative Flows
### Expired Token
1. (Steps 1-2 as above)
2. The system detects the token has expired (older than 24 hours).
3. The system displays an error page: "This verification link has expired."
4. The system offers a "Resend verification email" button.
5. The user clicks "Resend" and a new token is generated and sent.

### Invalid or Already-Used Token
1. (Steps 1-2 as above)
2. The system cannot find the token or detects it has already been used.
3. The system displays an error page: "This verification link is invalid or has already been used."
4. The system offers links to log in (UC-001B) or request a new verification email.

### User Clicks Link While Already Logged In
1. An authenticated user clicks a verification link (e.g., from an old email).
2. If the email is already confirmed, the system redirects to the dashboard with no action.
3. If the email is not yet confirmed, the system proceeds with the normal verification flow.

## Postconditions
- `USER.email_confirmed` is `true`.
- `USER.status` is `ACTIVE`.
- The verification token is invalidated and cannot be reused.
- The user can now log in (UC-001B).

## Business Rules
- BR-001A-01: Verification tokens are single-use and expire after 24 hours.
- BR-001A-02: The verification page must not reveal whether a token was expired vs. invalid (to prevent token enumeration). A generic error is acceptable.
- BR-001A-03: Resend is rate-limited to 3 attempts per 15 minutes (same limit as UC-001).

## Entity Mapping
- `USER`: email_confirmed (false → true), status (PENDING → ACTIVE), updated_at.

---

### Use Case: Login with Email & Password

# UC-001B: Login with Email & Password

**Actor:** Registered User

## Preconditions
- The user has a registered account on the VoluntX platform.
- The user has verified their email address (`email_confirmed: true`).

## Main Flow
1. The user navigates to the login page (from landing page UC-000 or direct URL).
2. The system displays the login form with fields: Email and Password.
3. The user enters their email and password.
4. The user clicks "Log In".
5. The system validates the credentials:
   - The email exists in the `USER` table.
   - The provided password matches the stored `password_hash` (bcrypt comparison).
   - `USER.email_confirmed` is `true`.
   - `USER.status` is `ACTIVE`.
6. The system creates a new authenticated session (JWT token).
7. The system redirects the user based on `account_type` and `onboarding_completed`:
   - VOLUNTEER with `onboarding_completed: false` → Onboarding Wizard (UC-003).
   - VOLUNTEER with `onboarding_completed: true` → Volunteer Dashboard.
   - ONG → ONG Dashboard.
   - COMPANY → Company Dashboard.
   - ADMIN → Admin Dashboard.

## Alternative Flows
### Invalid Credentials
1. (Steps 1-4 as above)
2. The system cannot match the email/password combination.
3. The system displays a generic error: "Invalid email or password." (does not reveal which field is wrong).
4. The system increments the failed login counter for the IP/account.

### Account Not Verified
1. (Steps 1-4 as above)
2. The system finds the account but `email_confirmed` is `false`.
3. The system displays: "Your email address has not been verified. Please check your inbox."
4. The system offers a "Resend verification email" link.

### Account Suspended
1. (Steps 1-4 as above)
2. The system finds the account but `USER.status` is `SUSPENDED`.
3. The system displays: "Your account has been suspended. Please contact support."

### Account Locked (Brute-Force Protection)
1. The system detects 5 consecutive failed login attempts for the same email within 15 minutes.
2. The system locks the account for 30 minutes.
3. The system displays: "Too many failed attempts. Your account has been temporarily locked. Try again later or reset your password."
4. The system offers a link to password recovery (UC-004).

### User Has Forgotten Password
1. (Steps 1-2 as above)
2. The user clicks "Forgot password?" link.
3. The system navigates to the password recovery flow (UC-004).

## Postconditions
- The user has an active authenticated session.
- The user has been redirected to the appropriate page based on their role and onboarding status.

## Business Rules
- BR-001B-01: Error messages must not reveal whether the email exists in the system (prevent user enumeration).
- BR-001B-02: Failed login attempts are tracked. After 5 consecutive failures within 15 minutes, the account is locked for 30 minutes.
- BR-001B-03: JWT tokens should have a reasonable expiry (e.g., 1 hour for access token, 7 days for refresh token).
- BR-001B-04: Login sessions must be secured with HttpOnly, Secure, SameSite=Strict cookies.
- BR-001B-05: Redirect after login must respect the `onboarding_completed` flag — volunteers who haven't completed onboarding are always redirected to the wizard.

## Entity Mapping
- `USER`: email, password_hash (read for comparison), email_confirmed, status, account_type, onboarding_completed — all read-only during login.

---

### Use Case: Logout

# UC-001C: Logout

**Actor:** Authenticated User (any role)

## Preconditions
- The user has an active authenticated session on the VoluntX platform.

## Main Flow
1. The user clicks the "Log Out" button/link (available in the navigation header or user menu across all pages).
2. The system invalidates the current session:
   - The server-side session or refresh token is revoked.
   - The access token cookie is cleared.
3. The system redirects the user to the landing page (UC-000).
4. The system displays a brief confirmation: "You have been successfully logged out."

## Alternative Flows
### Session Already Expired
1. The user clicks "Log Out" but their session has already expired.
2. The system detects no active session.
3. The system redirects the user to the landing page (UC-000) without error.

### Logout from All Devices (Future Enhancement)
1. The user selects "Log out from all devices" from account settings.
2. The system invalidates all active refresh tokens for `USER.id`.
3. The system redirects the user to the landing page (UC-000).

## Postconditions
- The user's session is terminated; access and refresh tokens are invalidated.
- The user is redirected to the public landing page.
- Any subsequent requests with the old tokens are rejected with 401 Unauthorized.

## Business Rules
- BR-001C-01: Logout must invalidate both access and refresh tokens to prevent session reuse.
- BR-001C-02: Logout must work even if the server-side session store is temporarily unavailable (graceful degradation — clear client cookies at minimum).
- BR-001C-03: After logout, pressing the browser back button must not restore the authenticated state.

## Entity Mapping
- No entity mutations. Session/token invalidation is handled at the infrastructure layer.

---

### Use Case: ONG Account Verification

# Use Case: ONG Account Verification

**Actor:** ONG Representative, Admin VoluntX

## Preconditions
- An ONG representative has registered an account and selected 'ONG' as the account type.

## Main Flow
1. The ONG representative completes the additional data form (ONG Name, CUI, address, contact person).
2. The system sets the ONG account status to 'Pending'.
3. An Admin VoluntX reviews the submitted documents and data.
4. The Admin VoluntX approves the ONG account.
5. The system activates the ONG account.
6. The system sends a confirmation email to the ONG representative.

## Alternative Flows
### Admin Rejects ONG Account
1. (Steps 1-3 as above)
2. The Admin VoluntX rejects the ONG account, providing a reason.
3. The system sets the ONG account status to 'Rejected'.
4. The system sends a rejection email with the reason to the ONG representative.

## Postconditions
- The ONG account is verified and active, allowing the ONG to post opportunities and manage volunteers, OR
- The ONG account is rejected, and the ONG representative is notified.

---

### Use Case: Complete Volunteer Onboarding Wizard

# Use Case: Complete Volunteer Onboarding Wizard

**Actor:** New Volunteer

## Preconditions
- The volunteer has successfully registered and confirmed their account.

## Main Flow
1. The volunteer is automatically directed to the multi-step onboarding wizard.
2. The volunteer completes Step 1: Personal Data (First Name, Last Name, Date of Birth, City, Avatar - all mandatory except phone).
3. The volunteer completes Step 2: Education (at least one entry for study level, institution, field, year).
4. The volunteer completes Step 3: Professional Experience (optional, can add multiple entries or skip).
5. The volunteer completes Step 4: Skills & Foreign Languages (at least 3 skills and 1 language mandatory).
6. The volunteer completes Step 5: Career Preferences & CV (career interests mandatory, others optional).
7. The system automatically saves data at each step.
8. Upon completing the last step, the system displays a success animation and a summary.
9. The volunteer is presented with CTAs to explore opportunities or view their profile.

## Alternative Flows
### Volunteer Skips Optional Step
1. (Steps 1-2 as above)
2. The volunteer chooses to skip Step 3 (Professional Experience) because they have none.
3. The wizard allows skipping and proceeds to Step 4.

### Volunteer Closes Session During Wizard
1. (Steps 1-X as above)
2. The volunteer closes the browser or application.
3. Upon next login, the system detects an incomplete profile.
4. A persistent banner in the dashboard prompts the volunteer to complete their profile.
5. The volunteer can resume the wizard from where they left off.

## Postconditions
- The volunteer's public profile is populated with the collected data.
- The volunteer has access to platform functionalities based on profile completeness.

---

### Use Case: Recover Password

# UC-004: Recover Password

**Actor:** Registered User (any role)

## Preconditions
- The user has a registered account with `auth_provider: EMAIL`.
- The user does not remember their current password.

## Main Flow
1. The user navigates to the login page (UC-001B) and clicks "Forgot password?".
2. The system displays the password recovery form with a single field: Email.
3. The user enters their registered email address.
4. The user clicks "Send Reset Link".
5. The system validates the email format.
6. The system generates a unique, time-limited password reset token (valid for 1 hour).
7. The system sends a password reset email containing a link with the token.
8. The system displays a confirmation: "If an account with this email exists, a password reset link has been sent." (generic message regardless of whether the email exists).
9. The user clicks the reset link in their email.
10. The system validates the token (exists, not expired, not already used).
11. The system displays the "Set New Password" form with fields: New Password, Confirm New Password.
12. The user enters a new password that meets complexity rules (min. 8 characters, at least one uppercase, one lowercase, one digit, one special character).
13. The user confirms the new password.
14. The user clicks "Reset Password".
15. The system validates the new password:
    - Meets complexity rules.
    - New Password and Confirm New Password match.
16. The system updates `USER.password_hash` with the bcrypt hash of the new password.
17. The system invalidates the reset token (single-use).
18. The system invalidates all existing sessions for this user (force logout from all devices).
19. The system displays a success message: "Your password has been reset successfully." with a CTA to log in (UC-001B).

## Alternative Flows
### Email Not Found (Silent Handling)
1. (Steps 1-5 as above)
2. The system does not find a matching email in the `USER` table.
3. The system still displays the same generic confirmation: "If an account with this email exists, a password reset link has been sent."
4. No email is sent. (Prevents user enumeration.)

### Expired Reset Token
1. (Steps 1-9 as above)
2. The system detects the token has expired (older than 1 hour).
3. The system displays: "This password reset link has expired."
4. The system offers a "Request a new reset link" button that returns to step 2.

### Invalid or Already-Used Token
1. (Steps 1-9 as above)
2. The system cannot find the token or detects it has already been used.
3. The system displays: "This password reset link is invalid or has already been used."
4. The system offers a link to request a new reset (step 2) or to log in (UC-001B).

### New Password Fails Validation
1. (Steps 1-14 as above)
2. The system detects the new password does not meet complexity rules or passwords don't match.
3. The system highlights the offending fields with inline error messages.
4. The user corrects the errors and resubmits.

### Social Login Account Attempts Password Recovery
1. (Steps 1-5 as above)
2. The email belongs to an account with `auth_provider: GOOGLE` or `auth_provider: LINKEDIN`.
3. The system still displays the generic confirmation message (step 8) but does not send a reset link.
4. Instead, the system sends an informational email: "Your account uses Google/LinkedIn sign-in. Please log in using your social account."

## Postconditions
- `USER.password_hash` is updated with the new password hash.
- The reset token is invalidated and cannot be reused.
- All previous sessions for this user are terminated.
- The user can log in with their new password (UC-001B).

## Business Rules
- BR-004-01: Password reset tokens are single-use and expire after 1 hour (shorter than verification tokens for security).
- BR-004-02: The confirmation message must never reveal whether the email exists in the system (prevent user enumeration).
- BR-004-03: Password reset requests are rate-limited to 3 per email per hour.
- BR-004-04: Upon successful password reset, all existing sessions must be invalidated (force re-authentication).
- BR-004-05: The new password must not be the same as the current password.
- BR-004-06: Reset tokens must be cryptographically random (min. 256-bit entropy) and stored hashed (not plaintext).

## Entity Mapping
- `USER`: password_hash (updated with new bcrypt hash), updated_at.

---

### Use Case: Build and Manage Volunteer Profile

# Use Case: Build and Manage Volunteer Profile

**Actor:** Volunteer

## Preconditions
- The volunteer has a registered and active account.
- The volunteer has completed the onboarding wizard or is in the process of doing so.

## Main Flow
1. The volunteer navigates to their profile page.
2. The volunteer edits their Hero Section (avatar, cover photo, name, bio, city, availability).
3. The volunteer views their Impact Statistics (Total Hours, Projects, NGOs, Validated Skills).
4. The volunteer adds a new volunteer experience to their Social Resume (Organization, Role, Period, Description, Applied Skills).
5. The volunteer requests validation for the new experience from the associated ONG.
6. The volunteer views their Skills section, noting validated skills.
7. The volunteer views their Certificates section.
8. The volunteer exports their profile as a formatted PDF.

## Alternative Flows
### ONG Validates Experience
1. (Steps 1-5 as above)
2. The associated ONG receives the validation request.
3. The ONG confirms the volunteer's participation.
4. The system updates the Social Resume entry with a 'Validated' badge.
5. The volunteer receives a notification that their experience has been validated.

### Volunteer Controls Profile Visibility
1. The volunteer navigates to profile settings.
2. The volunteer adjusts granular visibility settings for different sections (public, companies only, private).
3. The system applies the new visibility settings.

## Postconditions
- The volunteer's public profile accurately reflects their volunteer activities and skills.
- The volunteer has a credible Social Resume for NGOs and companies.

---

### Use Case: Search and Apply for Volunteer Opportunities

# Use Case: Search and Apply for Volunteer Opportunities

**Actor:** Volunteer

## Preconditions
- The volunteer has a registered and active account.

## Main Flow
1. The volunteer navigates to the volunteer opportunities feed.
2. The volunteer uses advanced filters (Category/Cause, Location, Type, Skills, Availability) to narrow down results.
3. The volunteer uses the full-text search bar to find specific opportunities.
4. The volunteer views a detailed opportunity page.
5. The volunteer clicks the 'Apply' button.
6. The volunteer optionally attaches a motivation message.
7. The system submits the application using the volunteer's VoluntX profile.
8. The volunteer receives a confirmation of their application.

## Alternative Flows
### Volunteer Saves Opportunity
1. (Steps 1-4 as above)
2. The volunteer clicks the 'Save' (Bookmark) button on an opportunity.
3. The system adds the opportunity to the volunteer's saved list.
4. The volunteer can later review saved opportunities from their dashboard.

### Personalized Recommendations
1. The volunteer views the 'Recommended for you' section.
2. The system displays opportunities based on the volunteer's skills and history.

## Postconditions
- The volunteer has successfully applied for a volunteer opportunity.
- The volunteer can track the status of their application.

---

### Use Case: Post and Manage Volunteer Opportunities

# Use Case: Post and Manage Volunteer Opportunities

**Actor:** ONG Representative

## Preconditions
- The ONG account has been registered and validated by an Admin VoluntX.

## Main Flow
1. The ONG representative logs into their dashboard.
2. The ONG representative navigates to the 'Create Opportunity' section.
3. The ONG representative fills out the complete form (Title, Description, Category, Skills, Spots, Location, Dates, Estimated Hours).
4. The ONG representative publishes the opportunity.
5. The system makes the opportunity public on the marketplace.
6. The ONG representative views and manages active opportunities from their dashboard.
7. The ONG representative receives new applications for the opportunity.
8. The ONG representative reviews applications and takes action (Accept / Reject / Waitlist).
9. The system automatically sends email notifications to volunteers about their application status.

## Alternative Flows
### Edit an Existing Opportunity
1. (Steps 1-6 as above)
2. The ONG representative selects an active opportunity to edit.
3. The ONG representative modifies details (e.g., description, number of spots).
4. The system updates the public opportunity listing.

### Close an Opportunity Early
1. (Steps 1-6 as above)
2. The ONG representative chooses to close an active opportunity prematurely.
3. The system archives the opportunity and stops accepting new applications.

## Postconditions
- A volunteer opportunity is successfully posted and managed.
- Volunteers are notified of application status changes.

---

### Use Case: Access and Apply for Career Opportunities (Walled Garden)

# Use Case: Access and Apply for Career Opportunities (Walled Garden)

**Actor:** Volunteer, Company Recruiter

## Preconditions
- The volunteer has a registered and active account.
- The volunteer has met the minimum access criterion for the Walled Garden (e.g., 1 validated volunteer experience).

## Main Flow
1. The volunteer navigates to the Walled Garden section.
2. The volunteer views the feed of job/internship opportunities.
3. The volunteer uses filters (Type, Industry, Location, Work Mode) to find relevant jobs.
4. The volunteer views a detailed job page, including the company profile.
5. The volunteer clicks the 'Apply' button.
6. The volunteer optionally adds a cover letter.
7. The system submits the application using the volunteer's VoluntX profile (Social Resume, skills, certificates).
8. The volunteer tracks the status of their application in the 'My Applications' section.

## Alternative Flows
### Volunteer is Not Eligible for Walled Garden
1. The volunteer navigates to the Walled Garden section.
2. The system displays the job feed in blur with a clear CTA: 'Complete your first validated volunteer experience to access career opportunities'.
3. The volunteer clicks the CTA and is directed to volunteer opportunities.
4. The volunteer completes the necessary activity to gain access.

### Company Recruiter Views Candidate Profile
1. A company recruiter receives a new application for a job.
2. The recruiter views the candidate's complete VoluntX profile (Social Resume, validated skills, certificates).
3. The recruiter takes action on the application (Shortlist / Reject / In evaluation).

## Postconditions
- The eligible volunteer has successfully applied for a career opportunity.
- The company recruiter can evaluate candidates based on their comprehensive VoluntX profile.

---

### Use Case: Internal Messaging between Volunteer and ONG

# Use Case: Internal Messaging between Volunteer and ONG

**Actor:** Volunteer, ONG Representative

## Preconditions
- A volunteer has applied for or been accepted into an opportunity posted by an ONG.

## Main Flow
1. The volunteer initiates a chat with the ONG from the context of a specific opportunity.
2. The ONG representative receives a new message notification (push, in-app, optional email digest).
3. The ONG representative opens the conversation in their unified inbox.
4. The ONG representative sends a text message to the volunteer.
5. The volunteer receives a new message notification.
6. Both parties can view the persistent conversation history.
7. Both parties can see read/unread indicators for messages.

## Alternative Flows
### Sending Attachments (Should Have)
1. (Steps 1-4 as above)
2. The ONG representative attaches a file (PDF, JPG, PNG, max 10MB) to the message.
3. The volunteer receives the message with the attachment and can download it.

## Postconditions
- Volunteer and ONG can communicate effectively regarding specific volunteer opportunities.

---

### Use Case: Review and Rate Volunteer/ONG

# Use Case: Review and Rate Volunteer/ONG

**Actor:** Volunteer, ONG Representative

## Preconditions
- A volunteer project has been completed.

## Main Flow
1. 24 hours after the project end date, the system automatically sends a review trigger (email + notification) to both the volunteer and the ONG.
2. The volunteer navigates to the review section for the completed project.
3. The volunteer leaves a text review and a 1-5 star rating for the ONG based on criteria (Organization, Communication, Impact, General Experience).
4. The ONG representative navigates to the review section for the completed project.
5. The ONG representative evaluates the volunteer based on criteria (Punctuality, Involvement, Work Quality, Recommendation).
6. The system displays the average rating and number of reviews on both the ONG's and the volunteer's profiles.

## Alternative Flows
### Admin Moderates Review
1. A user reports a review for violating community rules.
2. An Admin VoluntX reviews the reported content.
3. The Admin VoluntX hides the review if it violates rules.

### ONG Responds to Review (Should Have)
1. An ONG receives a review from a volunteer.
2. The ONG representative publicly responds to the review on their profile.
3. The response is visible on the ONG's profile alongside the original review.

## Postconditions
- Both volunteer and ONG have received and displayed ratings/reviews, contributing to their credibility on the platform.

---

### Use Case: Admin Manages Platform Content and Users

# Use Case: Admin Manages Platform Content and Users

**Actor:** Admin VoluntX

## Preconditions
- An Admin VoluntX is logged into the Admin Panel.

## Main Flow
1. The Admin navigates to the 'User Management' section.
2. The Admin views, edits, suspends, or deletes accounts of any type (Voluntar, ONG, Companie).
3. The Admin navigates to the 'ONG and Company Validation' section.
4. The Admin approves or rejects pending ONG/Company accounts, providing a message.
5. The Admin navigates to 'Content Moderation'.
6. The Admin reviews and moderates reported content (opportunities, reviews, profiles).
7. The Admin views platform statistics (active users, published opportunities, applications, Walled Garden conversions).
8. The Admin configures platform parameters (Walled Garden access threshold, cause categories, available skills).

## Alternative Flows
### Admin Manages System Notifications (Should Have)
1. The Admin navigates to 'System Notification Management'.
2. The Admin edits email templates for various system notifications.

### Admin Reviews Audit Log (Should Have)
1. The Admin navigates to the 'Admin Activity Log'.
2. The Admin reviews a log of all actions performed by administrators.

## Postconditions
- The platform's content and user base are managed according to VoluntX policies.
- Platform parameters are configured to ensure proper operation.

---

## Functional Requirements

### FR-AUTH-01: Înregistrare cu Email & Parolă

# FR-AUTH-01: Înregistrare cu Email & Parolă

## Description
Formular de înregistrare cu validare email (link de confirmare), parolă min. 8 caractere cu reguli de complexitate.

**Priority:** must_have

## Rationale
Essential for user onboarding and account creation.

## Acceptance Criteria
- Email de confirmare trimis.
- Contul e inactiv până la confirmare.
- Parola respectă reguli de complexitate (min. 8 caractere).
- Validare email prin link de confirmare.

---

### FR-AUTH-02: Social Login — Google

# FR-AUTH-02: Social Login — Google

## Description
Autentificare rapidă prin cont Google OAuth 2.0 pentru toate tipurile de utilizatori.

**Priority:** must_have

## Rationale
Provides a convenient and widely used alternative for quick registration and login.

## Acceptance Criteria
- Login social creează cont automat la prima utilizare.
- Funcționează pentru toate tipurile de utilizatori (Voluntar, ONG, Companie).

---

### FR-AUTH-03: Social Login — LinkedIn

# FR-AUTH-03: Social Login — LinkedIn

## Description
Autentificare prin LinkedIn (relevant în special pentru voluntari care doresc portabilitate CV).

**Priority:** should_have

## Rationale
Offers a professional social login option, particularly useful for volunteers seeking career opportunities.

## Acceptance Criteria
- Autentificarea prin LinkedIn este disponibilă.
- Permite portabilitatea datelor de CV (dacă API-ul LinkedIn o permite).

---

### FR-AUTH-04: Recuperare parolă

# FR-AUTH-04: Recuperare parolă

## Description
Flux complet de resetare parolă prin email.

**Priority:** must_have

## Rationale
Ensures users can regain access to their accounts if they forget their password, improving user experience and reducing support load.

## Acceptance Criteria
- Fluxul de resetare parolă prin email este funcțional.
- Utilizatorul primește un link de resetare valid prin email.

---

### FR-AUTH-05: Autentificare 2FA

# FR-AUTH-05: Autentificare 2FA

## Description
Cod OTP prin email sau aplicație authenticator.

**Priority:** could_have

## Rationale
Enhances account security by adding an extra layer of verification.

## Acceptance Criteria
- Opțiunea de 2FA este disponibilă.
- Suportă cod OTP prin email sau aplicație authenticator.

---

### FR-AUTH-06: Selectare tip cont la înregistrare

# FR-AUTH-06: Selectare tip cont la înregistrare

## Description
Utilizatorul alege: Voluntar / ONG / Companie. Fluxul de onboarding diferă în funcție de alegere.

**Priority:** must_have

## Rationale
Crucial for directing users to the appropriate onboarding and platform experience based on their role.

## Acceptance Criteria
- Utilizatorul poate alege tipul de cont la înregistrare.
- Fluxul de onboarding se adaptează în funcție de tipul de cont ales.

---

### FR-AUTH-07: Verificare ONG

# FR-AUTH-07: Verificare ONG

## Description
ONG-urile completează date suplimentare (CUI, documente). Contul devine activ după validare manuală de Admin.

**Priority:** must_have

## Rationale
Ensures the legitimacy of NGOs on the platform, building trust with volunteers.

## Acceptance Criteria
- Formularul include câmpuri: Denumire ONG, CUI, adresă, persoană de contact.
- Status 'În așteptare' vizibil în dashboard pentru ONG.
- Email de confirmare trimis la aprobare/respingere de către Admin.

---

### FR-AUTH-08: Verificare Companie

# FR-AUTH-08: Verificare Companie

## Description
Similar ONG: date fiscale + validare Admin înainte de acces la Walled Garden.

**Priority:** must_have

## Rationale
Ensures the legitimacy of companies on the platform, building trust with volunteers seeking career opportunities.

## Acceptance Criteria
- Formularul include câmpuri pentru date fiscale.
- Contul Companiei necesită validare manuală de către Admin înainte de acces la Walled Garden.

---

### FR-ONB-01: Progress bar vizibil

# FR-ONB-01: Progress bar vizibil

## Description
Indicator persistent în partea superioară a wizard-ului: Pasul X din 5 + bara de progres procentuală.

**Priority:** must_have

## Rationale
Provides clear feedback to the user about their progress, reducing frustration and improving completion rates.

## Acceptance Criteria
- Progress bar vizibil la fiecare pas al wizard-ului.
- Afișează 'Pasul X din 5' și o bară de progres procentuală.

---

### FR-ONB-02: Navigare inapoi fara pierdere date

# FR-ONB-02: Navigare inapoi fara pierdere date

## Description
Utilizatorul poate reveni la un pas anterior fara a pierde datele completate.

**Priority:** must_have

## Rationale
Enhances user experience by allowing corrections or review without losing previously entered information.

## Acceptance Criteria
- Utilizatorul poate naviga la pașii anteriori.
- Datele completate în pașii anteriori sunt păstrate.

---

### FR-ONB-03: Salvare automata (draft)

# FR-ONB-03: Salvare automata (draft)

## Description
Datele sunt salvate automat la fiecare pas, astfel incat daca utilizatorul inchide sesiunea, poate continua de unde a ramas.

**Priority:** must_have

## Rationale
Prevents data loss and allows users to complete the onboarding at their own pace, improving completion rates.

## Acceptance Criteria
- Datele sunt salvate automat la fiecare pas.
- Utilizatorul poate continua wizard-ul de unde a rămas după închiderea sesiunii.

---

### FR-ONB-04: Validare in timp real

# FR-ONB-04: Validare in timp real

## Description
Campurile obligatorii sunt validate inline (nu doar la submit), cu mesaje de eroare clare per camp.

**Priority:** must_have

## Rationale
Provides immediate feedback to the user, preventing submission errors and guiding them to correctly fill out the form.

## Acceptance Criteria
- Câmpurile obligatorii sunt validate inline.
- Mesaje de eroare clare sunt afișate per câmp.

---

### FR-ONB-05: Liste predefinite pentru skill-uri

# FR-ONB-05: Liste predefinite pentru skill-uri

## Description
Admin-ul poate gestiona listele de skill-uri tehnice, soft skills si domenii de cariera din Admin Panel. Utilizatorul poate adauga si valori custom.

**Priority:** must_have

## Rationale
Ensures data consistency and relevance while allowing flexibility for users to add unique skills.

## Acceptance Criteria
- Admin poate gestiona liste de skill-uri tehnice, soft skills și domenii de carieră.
- Utilizatorul poate selecta din liste predefinite și adăuga valori custom (max 15 skill-uri tehnice, max 10 soft skills).

---

### FR-ONB-06: Upload CV cu preview

# FR-ONB-06: Upload CV cu preview

## Description
La upload PDF, se afiseaza un preview al primei pagini din document. Posibilitate de inlocuire sau stergere.

**Priority:** should_have

## Rationale
Provides visual confirmation of the uploaded CV, reducing errors and improving user confidence.

## Acceptance Criteria
- La upload PDF, se afișează un preview al primei pagini.
- Utilizatorul poate înlocui sau șterge CV-ul încărcat.
- Dimensiunea maximă a fișierului este 5MB.

---

### FR-ONB-07: Completare ulterioara din profil

# FR-ONB-07: Completare ulterioara din profil

## Description
Utilizatorii care nu finalizeaza wizard-ul la inregistrare primesc un banner persistent in dashboard: Profilul tau este X% complet. Completeaza-l pentru a accesa mai multe oportunitati.

**Priority:** must_have

## Rationale
Motivates users to complete their profiles, which is crucial for platform engagement and matching.

## Acceptance Criteria
- Banner persistent în dashboard pentru profiluri incomplete.
- Mesajul include procentul de completitudine și un CTA pentru finalizare.

---

### FR-ONB-08: Indicator completitudine profil

# FR-ONB-08: Indicator completitudine profil

## Description
Scor procentual de completitudine vizibil pe profil (ex: 85% complet), cu lista campurilor lipsa.

**Priority:** should_have

## Rationale
Provides a clear visual cue and actionable steps for users to enhance their profile's completeness and effectiveness.

## Acceptance Criteria
- Scor procentual de completitudine vizibil pe profil.
- Lista câmpurilor lipsă este afișată.

---

### FR-ONB-09: Ecran de finalizare (success state)

# FR-ONB-09: Ecran de finalizare (success state)

## Description
Dupa ultimul pas: animatie de confirmare + sumar al datelor introduse + CTA: Exploreaza oportunitati / Vezi profilul tau.

**Priority:** must_have

## Rationale
Provides a positive and clear conclusion to the onboarding process, guiding users to their next steps on the platform.

## Acceptance Criteria
- Animație de confirmare după ultimul pas.
- Sumar al datelor introduse.
- CTA-uri: 'Explorează oportunități' și 'Vezi profilul tău'.

---

### FR-PROF-01: Hero Section editabil

# FR-PROF-01: Hero Section editabil

## Description
Avatar, cover photo, nume, titlu auto-generat (bazat pe cauze principale), bio scurtă (max 280 caractere), oraș, disponibilitate (toggle ON/OFF).

**Priority:** must_have

## Rationale
Allows volunteers to personalize their public profile and present key information at a glance.

## Acceptance Criteria
- Toate câmpurile din Hero Section sunt editabile.
- Titlul este auto-generat bazat pe cauze principale.
- Bio scurtă are o limită de 280 de caractere.
- Disponibilitatea poate fi setată cu un toggle ON/OFF.

---

### FR-PROF-02: Statistici Impact

# FR-PROF-02: Statistici Impact

## Description
4 metrici publice: Total Ore Voluntariat · Proiecte Finalizate · ONG-uri cu care a colaborat · Skill-uri Validate de ONG-uri.

**Priority:** must_have

## Rationale
Quantifies a volunteer's impact, providing verifiable data for NGOs and companies.

## Acceptance Criteria
- Cele 4 metrici sunt afișate public pe profil.
- Statisticile se actualizează în timp real.
- Tooltip pe fiecare metrică explică cum se calculează.

---

### FR-PROF-03: Jurnal de Activitate (Social Resume)

# FR-PROF-03: Jurnal de Activitate (Social Resume)

## Description
Cronologie a activităților de voluntariat: Organizație, Rol, Perioadă, Descriere, Skill-uri aplicate. Fiecare intrare poate fi validată de ONG.

**Priority:** must_have

## Rationale
Central to the platform's vision of transforming volunteer activity into verifiable career capital.

## Acceptance Criteria
- Formular de adăugare experiență cu toate câmpurile (Organizație, Rol, Perioadă, Descriere, Skill-uri aplicate).
- Buton 'Solicită validare' trimite cerere ONG-ului selectat.
- Badge 'Validat' apare după confirmare ONG.
- Experiențele nevalidate apar cu indicator 'Auto-declarat'.

---

### FR-PROF-04: Secțiunea Skill-uri

# FR-PROF-04: Secțiunea Skill-uri

## Description
Lista skill-urilor adăugate de voluntar. Skill-urile confirmate de un ONG primesc un badge vizual 'Validat'.

**Priority:** must_have

## Rationale
Highlights a volunteer's competencies and provides social proof through NGO validation.

## Acceptance Criteria
- Lista skill-urilor adăugate de voluntar este vizibilă.
- Skill-urile confirmate de un ONG primesc un badge vizual 'Validat'.

---

### FR-PROF-05: Certificate

# FR-PROF-05: Certificate

## Description
Certificatele eliberate de ONG-uri (generate automat prin ONG Tool sau încărcate manual) sunt vizibile în profil cu QR code verificabil.

**Priority:** must_have

## Rationale
Provides formal recognition of volunteer work and enhances the credibility of the Social Resume.

## Acceptance Criteria
- Certificatele sunt vizibile în profil.
- Fiecare certificat are un QR code verificabil.

---

### FR-PROF-06: Badges & Achievements

# FR-PROF-06: Badges & Achievements

## Description
Badge-uri automate la milestone-uri: Prima aplicare, 50h, 100h, 5 organizații, Team Leader etc.

**Priority:** should_have

## Rationale
Gamifies the volunteer experience, motivating engagement and recognizing achievements.

## Acceptance Criteria
- Badge-uri automate sunt acordate la atingerea milestone-urilor definite.
- Badge-urile sunt vizibile pe profilul voluntarului.

---

### FR-PROF-07: Activity Heatmap

# FR-PROF-07: Activity Heatmap

## Description
Vizualizare calendar (ultimele 12 luni) a frecvenței activității, inspirată din GitHub contribution graph.

**Priority:** could_have

## Rationale
Provides a visual representation of a volunteer's consistent engagement over time.

## Acceptance Criteria
- Vizualizare calendar a frecvenței activității pe ultimele 12 luni.
- Similar cu un grafic de contribuție GitHub.

---

### FR-PROF-08: Vizibilitate granulară

# FR-PROF-08: Vizibilitate granulară

## Description
Utilizatorul controlează ce secțiuni sunt publice / vizibile doar pentru companii / private.

**Priority:** should_have

## Rationale
Empowers users with control over their personal data and privacy settings.

## Acceptance Criteria
- Utilizatorul poate controla vizibilitatea secțiunilor profilului (public, companii, privat).
- Setările de vizibilitate sunt aplicate corect.

---

### FR-PROF-09: Export CV PDF

# FR-PROF-09: Export CV PDF

## Description
Export profilul ca PDF formatat, cu branding VoluntX.

**Priority:** should_have

## Rationale
Allows volunteers to easily share their VoluntX profile in a traditional CV format.

## Acceptance Criteria
- Profilul poate fi exportat ca PDF formatat.
- PDF-ul include branding VoluntX.

---

### FR-MKT-01: Creare oportunitate de voluntariat

# FR-MKT-01: Creare oportunitate de voluntariat

## Description
Formular complet: Titlu, Descriere, Categorie/Cauza, Skill-uri necesare, Nr. locuri, Locație (fizic/online/hibrid), Dată start-end, Ore estimate.

**Priority:** must_have

## Rationale
Enables NGOs to effectively post and describe their volunteer needs.

## Acceptance Criteria
- Formularul include toate câmpurile specificate.
- Câmpurile obligatorii sunt validate la submit.

---

### FR-MKT-02: Gestionare oportunități postate

# FR-MKT-02: Gestionare oportunități postate

## Description
Dashboard ONG: lista oportunităților active/arhivate, editare, închidere anticipată, duplicare oportunitate.

**Priority:** must_have

## Rationale
Provides NGOs with the necessary tools to manage their volunteer projects efficiently.

## Acceptance Criteria
- Dashboard-ul ONG afișează lista oportunităților (active/arhivate).
- ONG-ul poate edita, închide anticipat sau duplica o oportunitate.

---

### FR-MKT-03: Gestionare aplicații primite

# FR-MKT-03: Gestionare aplicații primite

## Description
Lista aplicanților per oportunitate, cu acțiuni: Acceptă / Respinge / Pune pe lista de așteptare. Email automat trimis voluntarului la fiecare schimbare de status.

**Priority:** must_have

## Rationale
Streamlines the application review process for NGOs and keeps volunteers informed.

## Acceptance Criteria
- Panou dedicat per oportunitate pentru gestionarea aplicanților.
- Acțiuni: Acceptă, Respinge, Pune pe lista de așteptare.
- Email automat trimis voluntarului la fiecare schimbare de status.
- Acțiuni bulk (acceptă/respinge multiple) sunt disponibile.

---

### FR-MKT-04: Publicare condiționată

# FR-MKT-04: Publicare condiționată

## Description
Oportunitatea devine publică doar după activarea contului ONG de către Admin VoluntX.

**Priority:** must_have

## Rationale
Ensures that only legitimate and verified NGOs can post opportunities, maintaining platform quality.

## Acceptance Criteria
- Oportunitatea devine publică doar după activarea contului ONG de către Admin.

---

### FR-MKT-05: Feed oportunități

# FR-MKT-05: Feed oportunități

## Description
Pagina principală listează oportunitățile active, sortate by default după relevanță (bazată pe skill-urile voluntarului + locație).

**Priority:** must_have

## Rationale
Provides volunteers with a personalized and relevant list of opportunities upon logging in.

## Acceptance Criteria
- Pagina principală listează oportunitățile active.
- Sortare implicită după relevanță (skill-uri voluntar + locație).

---

### FR-MKT-06: Filtrare avansată

# FR-MKT-06: Filtrare avansată

## Description
Filtre: Categorie/Cauza · Locație (oraș/online) · Tip (single-event / ongoing) · Skill-uri · Disponibilitate (date).

**Priority:** must_have

## Rationale
Enables volunteers to efficiently find opportunities that match their interests and availability.

## Acceptance Criteria
- Minim 6 filtre active simultan.
- Rezultatele se actualizează fără reload (live filtering).
- Număr de rezultate afișat dinamic.

---

### FR-MKT-07: Căutare full-text

# FR-MKT-07: Căutare full-text

## Description
Căutare în titlu + descriere oportunități cu sugestii auto-complete.

**Priority:** must_have

## Rationale
Improves discoverability of opportunities through flexible search capabilities.

## Acceptance Criteria
- Căutare full-text în titlu și descriere.
- Sugestii auto-complete sunt afișate în timpul căutării.

---

### FR-MKT-08: Pagina de detaliu oportunitate

# FR-MKT-08: Pagina de detaliu oportunitate

## Description
Prezentare completă a oportunității, profil ONG, locație pe hartă (Google Maps embed), buton Apply.

**Priority:** must_have

## Rationale
Provides all necessary information for a volunteer to make an informed decision about applying.

## Acceptance Criteria
- Prezentare completă a oportunității și profilului ONG.
- Locație afișată pe hartă (Google Maps embed).
- Buton 'Apply' este vizibil și funcțional.

---

### FR-MKT-09: Aplicare cu un click

# FR-MKT-09: Aplicare cu un click

## Description
Voluntarul aplică direct cu profilul său VoluntX. Poate atașa un mesaj de motivație opțional.

**Priority:** must_have

## Rationale
Simplifies the application process, encouraging more volunteers to apply.

## Acceptance Criteria
- Aplicarea se face direct cu profilul VoluntX.
- Opțiune de a atașa un mesaj de motivație.

---

### FR-MKT-10: Salvare oportunități (Bookmark)

# FR-MKT-10: Salvare oportunități (Bookmark)

## Description
Voluntarul poate salva oportunități pentru a le revizui ulterior.

**Priority:** should_have

## Rationale
Allows volunteers to keep track of interesting opportunities without applying immediately.

## Acceptance Criteria
- Voluntarul poate salva oportunități.
- Oportunitățile salvate sunt accesibile pentru revizuire ulterioară.

---

### FR-MKT-11: Recomandări personalizate

# FR-MKT-11: Recomandări personalizate

## Description
Secțiune 'Recomandate pentru tine' bazată pe skill-urile și istoricul voluntarului.

**Priority:** could_have

## Rationale
Enhances user engagement by proactively suggesting relevant opportunities.

## Acceptance Criteria
- Secțiune 'Recomandate pentru tine' este afișată.
- Recomandările sunt bazate pe skill-urile și istoricul voluntarului.

---

### FR-WG-01: Creare profil Companie

# FR-WG-01: Creare profil Companie

## Description
Pagina publică a companiei: Logo, Descriere, Industrie, Dimensiune, Website, Valori, Poze echipă/birou (galerie media).

**Priority:** must_have

## Rationale
Allows companies to present their brand and culture to potential candidates.

## Acceptance Criteria
- Pagina publică a companiei include toate câmpurile specificate.
- Galerie media pentru poze echipă/birou.

---

### FR-WG-02: Postare oportunitate de carieră

# FR-WG-02: Postare oportunitate de carieră

## Description
Formular: Titlu job, Tip (full-time/internship/part-time), Departament, Descriere, Cerințe, Skill-uri, Locație, Mod (remote/on-site/hibrid), Data limită aplicare.

**Priority:** must_have

## Rationale
Enables companies to effectively advertise their career opportunities to eligible volunteers.

## Acceptance Criteria
- Formularul include toate câmpurile specificate pentru postarea unui job.
- Câmpurile obligatorii sunt validate la submit.

---

### FR-WG-03: Gestionare joburi postate

# FR-WG-03: Gestionare joburi postate

## Description
Dashboard companie: joburi active/arhivate, editare, dezactivare, statistici per job (nr. vizualizări, nr. aplicații).

**Priority:** must_have

## Rationale
Provides companies with the necessary tools to manage their recruitment efforts efficiently.

## Acceptance Criteria
- Dashboard-ul companiei afișează joburile active/arhivate.
- Compania poate edita, dezactiva joburi și vedea statistici per job.

---

### FR-WG-04: Vizualizare candidați

# FR-WG-04: Vizualizare candidați

## Description
Lista voluntarilor care au aplicat: profil complet VoluntX vizibil (Social Resume, skill-uri, certificate), acțiuni: Shortlist / Respins / În evaluare.

**Priority:** must_have

## Rationale
Allows companies to thoroughly evaluate candidates based on their comprehensive VoluntX profile.

## Acceptance Criteria
- Lista candidaților per job este vizibilă.
- Profilul complet VoluntX al candidatului este accesibil (Social Resume, skill-uri, certificate).
- Acțiuni: Shortlist, Respins, În evaluare.
- Posibilitate de a lăsa note interne per candidat.

---

### FR-WG-05: Notificare la aplicații noi

# FR-WG-05: Notificare la aplicații noi

## Description
Email + notificare in-app la fiecare aplicație nouă.

**Priority:** must_have

## Rationale
Ensures companies are promptly informed of new applications, facilitating timely review.

## Acceptance Criteria
- Email și notificare in-app trimise la fiecare aplicație nouă.

---

### FR-WG-06: Export candidați

# FR-WG-06: Export candidați

## Description
Export lista candidaților shortlistați în CSV/Excel.

**Priority:** should_have

## Rationale
Allows companies to integrate candidate data into their internal systems or for offline review.

## Acceptance Criteria
- Lista candidaților shortlistați poate fi exportată în CSV/Excel.

---

### FR-WG-08: Acces condiționat

# FR-WG-08: Acces condiționat

## Description
Voluntarii fără criteriul minim văd feed-ul Walled Garden în blur cu CTA: 'Completează primul voluntariat validat pentru a accesa oportunități de carieră'.

**Priority:** must_have

## Rationale
Enforces the platform's value proposition by requiring demonstrated volunteer activity for career access.

## Acceptance Criteria
- Feed-ul Walled Garden este blurat pentru voluntarii neeligibili.
- Mesaj clar cu criteriul neîndeplinit și un CTA direct către oportunități de voluntariat.
- Progress indicator vizual pentru îndeplinirea criteriului.

---

### FR-WG-09: Feed joburi/internship-uri

# FR-WG-09: Feed joburi/internship-uri

## Description
Lista oportunităților active, cu filtre: Tip / Industrie / Locație / Mod de lucru.

**Priority:** must_have

## Rationale
Provides eligible volunteers with a structured and searchable list of career opportunities.

## Acceptance Criteria
- Lista oportunităților active este afișată.
- Filtre disponibile: Tip, Industrie, Locație, Mod de lucru.

---

### FR-WG-10: Pagina de detaliu job

# FR-WG-10: Pagina de detaliu job

## Description
Prezentare completă job + profilul companiei, buton Apply cu VoluntX Profile.

**Priority:** must_have

## Rationale
Provides all necessary information for a volunteer to make an informed decision about applying for a job.

## Acceptance Criteria
- Prezentare completă a jobului și profilului companiei.
- Buton 'Apply' este vizibil și funcțional, utilizând profilul VoluntX.

---

### FR-WG-11: Aplicare la job

# FR-WG-11: Aplicare la job

## Description
Aplicarea se face cu profilul VoluntX. Voluntarul poate adăuga un cover letter. Compania vede Social Resume complet.

**Priority:** must_have

## Rationale
Leverages the Social Resume as a primary application tool, simplifying the process for volunteers and providing rich data for companies.

## Acceptance Criteria
- Aplicarea nu necesită upload CV separat.
- Compania vede Social Resume, skill-uri validate, certificate.
- Confirmarea aplicării este trimisă pe email voluntarului.
- Voluntarul poate adăuga un cover letter.

---

### FR-WG-12: Tracking aplicații

# FR-WG-12: Tracking aplicații

## Description
Secțiune 'Aplicările mele' cu statusul fiecărei aplicații: Trimisă / În evaluare / Shortlist / Respinsă.

**Priority:** must_have

## Rationale
Keeps volunteers informed about the progress of their job applications.

## Acceptance Criteria
- Secțiunea 'Aplicările mele' listează toate aplicațiile.
- Statusul fiecărei aplicații este vizibil (Trimisă, În evaluare, Shortlist, Respinsă).

---

### FR-WG-13: Notificare schimbare status

# FR-WG-13: Notificare schimbare status

## Description
Email + push notification la fiecare actualizare de status a aplicației.

**Priority:** must_have

## Rationale
Ensures volunteers are promptly informed of any changes to their application status.

## Acceptance Criteria
- Email și push notification trimise la fiecare actualizare de status a aplicației.

---

### FR-WG-14: Profil vizibil companiei

# FR-WG-14: Profil vizibil companiei

## Description
Voluntarul controlează care informații din profil sunt vizibile companiilor (toggle per secțiune).

**Priority:** should_have

## Rationale
Provides volunteers with control over their privacy when applying for jobs.

## Acceptance Criteria
- Voluntarul poate controla vizibilitatea informațiilor din profil pentru companii (toggle per secțiune).

---

### FR-MSG-01: Conversație 1:1 Voluntar ↔ ONG

# FR-MSG-01: Conversație 1:1 Voluntar ↔ ONG

## Description
Chat text în timp real asociat unei oportunități specifice. Istoricul conversației persisă.

**Priority:** must_have

## Rationale
Facilitates direct and contextual communication between volunteers and NGOs.

## Acceptance Criteria
- Chat text în timp real între voluntar și ONG.
- Conversația este asociată unei oportunități specifice.
- Istoricul conversației este persistent.

---

### FR-MSG-02: Notificări mesaje noi

# FR-MSG-02: Notificări mesaje noi

## Description
Push notification (mobil) + badge in-app + email digest (opțional, frecvență configurabilă).

**Priority:** must_have

## Rationale
Ensures users are promptly alerted to new messages, promoting timely responses.

## Acceptance Criteria
- Push notification (mobil) și badge in-app pentru mesaje noi.
- Email digest opțional cu frecvență configurabilă.

---

### FR-MSG-03: Status citit/necitit

# FR-MSG-03: Status citit/necitit

## Description
Indicator vizual pentru mesaje necitite.

**Priority:** must_have

## Rationale
Helps users quickly identify unread messages and prioritize their responses.

## Acceptance Criteria
- Indicator vizual pentru mesaje necitite.

---

### FR-MSG-04: Inbox unificat

# FR-MSG-04: Inbox unificat

## Description
Toate conversațiile accesibile dintr-un inbox central cu căutare după ONG/oportunitate.

**Priority:** must_have

## Rationale
Provides a centralized hub for managing all communications, improving user efficiency.

## Acceptance Criteria
- Toate conversațiile sunt accesibile dintr-un inbox central.
- Căutare după ONG/oportunitate este disponibilă.

---

### FR-MSG-05: Trimitere fișiere/imagini

# FR-MSG-05: Trimitere fișiere/imagini

## Description
Atașamente în conversație (max 10MB per fișier, tipuri: PDF, JPG, PNG).

**Priority:** should_have

## Rationale
Enables richer communication by allowing users to share documents and images.

## Acceptance Criteria
- Posibilitatea de a trimite atașamente (PDF, JPG, PNG).
- Dimensiune maximă de 10MB per fișier.

---

### FR-MSG-06: Mesagerie Companie ↔ Candidat

# FR-MSG-06: Mesagerie Companie ↔ Candidat

## Description
Chat între companie și voluntar care a aplicat la un job (Walled Garden).

**Priority:** should_have

## Rationale
Facilitates direct communication between recruiters and job applicants within the Walled Garden.

## Acceptance Criteria
- Chat disponibil între companie și voluntar care a aplicat la un job.

---

### FR-MSG-07: Broadcast (ONG → toți voluntarii unui proiect)

# FR-MSG-07: Broadcast (ONG → toți voluntarii unui proiect)

## Description
Mesaj trimis simultan tuturor voluntarilor acceptați într-un proiect.

**Priority:** could_have

## Rationale
Enables NGOs to efficiently communicate important updates to all volunteers on a project.

## Acceptance Criteria
- ONG-ul poate trimite un mesaj simultan tuturor voluntarilor acceptați într-un proiect.

---

### FR-RAT-01: Rating Voluntar → ONG

# FR-RAT-01: Rating Voluntar → ONG

## Description
La finalizarea unui proiect, voluntarul poate lăsa o recenzie textică + rating 1-5 stele pe criterii: Organizare, Comunicare, Impact, Experiență generală.

**Priority:** must_have

## Rationale
Provides valuable feedback for NGOs and helps other volunteers choose projects.

## Acceptance Criteria
- Voluntarul poate lăsa o recenzie textică și rating 1-5 stele pentru ONG.
- Criterii de rating: Organizare, Comunicare, Impact, Experiență generală.

---

### FR-RAT-02: Rating ONG → Voluntar

# FR-RAT-02: Rating ONG → Voluntar

## Description
La finalizarea proiectului, ONG-ul evaluează voluntarul pe criterii: Punctualitate, Implicare, Calitate muncă, Recomandare (Da/Nu).

**Priority:** must_have

## Rationale
Provides verifiable feedback for volunteers, enhancing their Social Resume and credibility.

## Acceptance Criteria
- ONG-ul poate evalua voluntarul pe criterii: Punctualitate, Implicare, Calitate muncă, Recomandare (Da/Nu).

---

### FR-RAT-03: Afișare rating pe profil

# FR-RAT-03: Afișare rating pe profil

## Description
Rating-ul mediu și nr. de recenzii afișate pe profilul ONG-ului și voluntarului.

**Priority:** must_have

## Rationale
Publicly displays credibility metrics for both NGOs and volunteers.

## Acceptance Criteria
- Rating-ul mediu și numărul de recenzii sunt afișate pe profilul ONG-ului și voluntarului.

---

### FR-RAT-04: Moderare recenzii

# FR-RAT-04: Moderare recenzii

## Description
Admin VoluntX poate ascunde recenziile care încalcă regulile comunității.

**Priority:** must_have

## Rationale
Ensures the quality and appropriateness of reviews on the platform.

## Acceptance Criteria
- Admin VoluntX poate ascunde recenziile care încalcă regulile comunității.

---

### FR-RAT-05: Răspuns la recenzie

# FR-RAT-05: Răspuns la recenzie

## Description
ONG-ul poate răspunde public la recenziile primite.

**Priority:** should_have

## Rationale
Allows NGOs to engage with feedback and provide context or clarification to reviews.

## Acceptance Criteria
- ONG-ul poate răspunde public la recenziile primite.

---

### FR-RAT-06: Trigger automat de recenzie

# FR-RAT-06: Trigger automat de recenzie

## Description
Email + notificare trimise automat la 24h după data de end a proiectului.

**Priority:** must_have

## Rationale
Automates the review request process, increasing the likelihood of users providing feedback.

## Acceptance Criteria
- Email și notificare trimise automat la 24h după data de end a proiectului pentru a solicita recenzii.

---

### FR-DASH-V-01: Sumar activitate: ore totale, proiecte active, aplicații în așteptare

# FR-DASH-V-01: Sumar activitate: ore totale, proiecte active, aplicații în așteptare

## Description
Volunteer Dashboard: Summary of activity including total hours, active projects, and pending applications.

**Priority:** must_have

## Rationale
Provides volunteers with a quick overview of their engagement and status on the platform.

## Acceptance Criteria
- Dashboard-ul voluntarului afișează ore totale, proiecte active și aplicații în așteptare.

---

### FR-DASH-V-02: Aplicările mele: lista completă cu statusuri

# FR-DASH-V-02: Aplicările mele: lista completă cu statusuri

## Description
Volunteer Dashboard: Complete list of applications with their current statuses.

**Priority:** must_have

## Rationale
Allows volunteers to track the progress of all their applications in one place.

## Acceptance Criteria
- Dashboard-ul voluntarului listează toate aplicațiile cu statusurile aferente.

---

### FR-DASH-V-03: Proiectele active: oportunități la care e acceptat

# FR-DASH-V-03: Proiectele active: oportunități la care e acceptat

## Description
Volunteer Dashboard: List of active projects where the volunteer has been accepted.

**Priority:** must_have

## Rationale
Helps volunteers keep track of their ongoing commitments.

## Acceptance Criteria
- Dashboard-ul voluntarului afișează oportunitățile la care este acceptat.

---

### FR-DASH-V-04: Notificări centralizate (aplicații, mesaje, validări, certificate noi)

# FR-DASH-V-04: Notificări centralizate (aplicații, mesaje, validări, certificate noi)

## Description
Volunteer Dashboard: Centralized view of all notifications related to applications, messages, validations, and new certificates.

**Priority:** must_have

## Rationale
Provides a single point of access for all important alerts and updates.

## Acceptance Criteria
- Dashboard-ul voluntarului include o secțiune pentru notificări centralizate.

---

### FR-DASH-V-05: Secțiunea Walled Garden: aplicările la joburi cu statusuri

# FR-DASH-V-05: Secțiunea Walled Garden: aplicările la joburi cu statusuri

## Description
Volunteer Dashboard: Section dedicated to Walled Garden job applications and their statuses.

**Priority:** must_have

## Rationale
Allows volunteers to monitor their career applications within the Walled Garden.

## Acceptance Criteria
- Dashboard-ul voluntarului include o secțiune pentru aplicările la joburi cu statusuri.

---

### FR-DASH-V-06: Recomandări oportunități personalizate

# FR-DASH-V-06: Recomandări oportunități personalizate

## Description
Volunteer Dashboard: Personalized recommendations for volunteer opportunities.

**Priority:** could_have

## Rationale
Enhances engagement by proactively suggesting relevant opportunities to volunteers.

## Acceptance Criteria
- Dashboard-ul voluntarului afișează recomandări personalizate de oportunități.

---

### FR-DASH-O-01: Overview: oportunități active, total voluntari activi, aplicații noi

# FR-DASH-O-01: Overview: oportunități active, total voluntari activi, aplicații noi

## Description
ONG Dashboard: Overview of active opportunities, total active volunteers, and new applications.

**Priority:** must_have

## Rationale
Provides NGOs with a high-level summary of their current activity and engagement on the platform.

## Acceptance Criteria
- Dashboard-ul ONG afișează oportunități active, total voluntari activi și aplicații noi.

---

### FR-DASH-O-02: Gestionare oportunități (creare, editare, arhivare)

# FR-DASH-O-02: Gestionare oportunități (creare, editare, arhivare)

## Description
ONG Dashboard: Tools for creating, editing, and archiving volunteer opportunities.

**Priority:** must_have

## Rationale
Enables NGOs to fully manage their volunteer projects from a central location.

## Acceptance Criteria
- Dashboard-ul ONG permite crearea, editarea și arhivarea oportunităților.

---

### FR-DASH-O-03: Gestionare aplicații per oportunitate (Acceptă / Respinge / Lista așteptare)

# FR-DASH-O-03: Gestionare aplicații per oportunitate (Acceptă / Respinge / Lista așteptare)

## Description
ONG Dashboard: Management of applications for each opportunity, with actions to Accept, Reject, or add to a Waitlist.

**Priority:** must_have

## Rationale
Streamlines the process of reviewing and responding to volunteer applications.

## Acceptance Criteria
- Dashboard-ul ONG permite gestionarea aplicațiilor per oportunitate cu acțiuni de Acceptă / Respinge / Lista așteptare.

---

### FR-DASH-O-04: Validare Social Resume: cereri de validare din partea voluntarilor

# FR-DASH-O-04: Validare Social Resume: cereri de validare din partea voluntarilor

## Description
ONG Dashboard: Section for reviewing and responding to Social Resume validation requests from volunteers.

**Priority:** must_have

## Rationale
Allows NGOs to verify volunteer experiences, adding credibility to the Social Resume.

## Acceptance Criteria
- Dashboard-ul ONG afișează cererile de validare Social Resume din partea voluntarilor.

---

### FR-DASH-O-05: Eliberare certificate: generare PDF cu QR code per voluntar/proiect

# FR-DASH-O-05: Eliberare certificate: generare PDF cu QR code per voluntar/proiect

## Description
ONG Dashboard: Functionality to generate PDF certificates with QR codes for volunteers per project.

**Priority:** must_have

## Rationale
Enables NGOs to formally recognize volunteer contributions with verifiable certificates.

## Acceptance Criteria
- Dashboard-ul ONG permite generarea de certificate PDF cu QR code per voluntar/proiect.

---

### FR-DASH-O-06: Inbox mesaje: toate conversațiile active cu voluntarii

# FR-DASH-O-06: Inbox mesaje: toate conversațiile active cu voluntarii

## Description
ONG Dashboard: Unified inbox for all active conversations with volunteers.

**Priority:** must_have

## Rationale
Provides a central place for NGOs to manage all their communications with volunteers.

## Acceptance Criteria
- Dashboard-ul ONG include un inbox cu toate conversațiile active cu voluntarii.

---

### FR-DASH-O-07: Rating-uri primite: vizualizare și răspuns la recenzii

# FR-DASH-O-07: Rating-uri primite: vizualizare și răspuns la recenzii

## Description
ONG Dashboard: Section for viewing and responding to received ratings and reviews.

**Priority:** must_have

## Rationale
Allows NGOs to monitor their reputation and engage with feedback from volunteers.

## Acceptance Criteria
- Dashboard-ul ONG permite vizualizarea și răspunsul la rating-urile primite.

---

### FR-DASH-O-08: Raport simplu de activitate (export CSV: voluntari, ore, proiecte)

# FR-DASH-O-08: Raport simplu de activitate (export CSV: voluntari, ore, proiecte)

## Description
ONG Dashboard: Simple activity report with CSV export for volunteers, hours, and projects.

**Priority:** should_have

## Rationale
Provides NGOs with basic data for internal reporting and analysis of their volunteer programs.

## Acceptance Criteria
- Dashboard-ul ONG permite exportul unui raport simplu de activitate (CSV: voluntari, ore, proiecte).

---

### FR-DASH-O-09: Preparare infrastructură pentru ONG Management Tool: câmpuri de date, structuri de date și API endpoints pentru ore, task-uri, comunicare internă extinsă — neexpuse în UI dar prezente în backend

# FR-DASH-O-09: Preparare infrastructură pentru ONG Management Tool: câmpuri de date, structuri de date și API endpoints pentru ore, task-uri, comunicare internă extinsă — neexpuse în UI dar prezente în backend

## Description
ONG Dashboard: Backend infrastructure preparation for the future ONG Management Tool, including data fields, data structures, and API endpoints for hours, tasks, and extended internal communication, not exposed in the UI but present in the backend.

**Priority:** must_have

## Rationale
Ensures the platform is scalable and ready for future expansion with the full ONG Management Tool without major refactoring.

## Acceptance Criteria
- Backend-ul include câmpuri de date, structuri de date și API endpoints pentru ore, task-uri și comunicare internă extinsă, pregătite pentru ONG Management Tool.

---

### FR-DASH-C-01: Overview: joburi active, total aplicații, aplicații noi (last 7 zile)

# FR-DASH-C-01: Overview: joburi active, total aplicații, aplicații noi (last 7 zile)

## Description
Company Dashboard: Overview of active jobs, total applications, and new applications (last 7 days).

**Priority:** must_have

## Rationale
Provides companies with a quick summary of their recruitment activity.

## Acceptance Criteria
- Dashboard-ul companiei afișează joburi active, total aplicații și aplicații noi (ultimele 7 zile).

---

### FR-DASH-C-02: Gestionare oportunități de carieră (creare, editare, dezactivare)

# FR-DASH-C-02: Gestionare oportunități de carieră (creare, editare, dezactivare)

## Description
Company Dashboard: Tools for creating, editing, and deactivating career opportunities.

**Priority:** must_have

## Rationale
Enables companies to fully manage their job postings from a central location.

## Acceptance Criteria
- Dashboard-ul companiei permite crearea, editarea și dezactivarea oportunităților de carieră.

---

### FR-DASH-C-03: Vizualizare și gestionare candidați per job (Shortlist / Respinge / În evaluare)

# FR-DASH-C-03: Vizualizare și gestionare candidați per job (Shortlist / Respinge / În evaluare)

## Description
Company Dashboard: Functionality to view and manage candidates for each job, with actions to Shortlist, Reject, or mark as In Evaluation.

**Priority:** must_have

## Rationale
Streamlines the candidate review and selection process for companies.

## Acceptance Criteria
- Dashboard-ul companiei permite vizualizarea și gestionarea candidaților per job cu acțiuni de Shortlist / Respinge / În evaluare.

---

### FR-DASH-C-04: Gestionare profil Companie (logo, descriere, media)

# FR-DASH-C-04: Gestionare profil Companie (logo, descriere, media)

## Description
Company Dashboard: Tools for managing the company's public profile, including logo, description, and media gallery.

**Priority:** must_have

## Rationale
Allows companies to maintain and update their brand presence on the platform.

## Acceptance Criteria
- Dashboard-ul companiei permite gestionarea profilului (logo, descriere, media).

---

### FR-DASH-C-05: Statistici per job: vizualizări, aplicații, conversie

# FR-DASH-C-05: Statistici per job: vizualizări, aplicații, conversie

## Description
Company Dashboard: Statistics per job posting, including views, applications, and conversion rates.

**Priority:** should_have

## Rationale
Provides companies with insights into the performance of their job postings.

## Acceptance Criteria
- Dashboard-ul companiei afișează statistici per job: vizualizări, aplicații, conversie.

---

### FR-DASH-C-06: Export candidați shortlistați (CSV)

# FR-DASH-C-06: Export candidați shortlistați (CSV)

## Description
Company Dashboard: Functionality to export shortlisted candidates in CSV format.

**Priority:** should_have

## Rationale
Allows companies to transfer shortlisted candidate data to external systems or for offline processing.

## Acceptance Criteria
- Dashboard-ul companiei permite exportul candidaților shortlistați în CSV.

---

### FR-ADMIN-01: Gestionare utilizatori: vizualizare, editare, suspendare, ștergere conturi (toate tipurile)

# FR-ADMIN-01: Gestionare utilizatori: vizualizare, editare, suspendare, ștergere conturi (toate tipurile)

## Description
Admin Panel: Functionality to view, edit, suspend, and delete all types of user accounts (Voluntar, ONG, Companie).

**Priority:** must_have

## Rationale
Provides administrators with full control over user accounts for moderation and support purposes.

## Acceptance Criteria
- Admin poate vizualiza, edita, suspenda și șterge conturi de toate tipurile.

---

### FR-ADMIN-02: Validare conturi ONG și Companie: aprobare / respingere cu mesaj

# FR-ADMIN-02: Validare conturi ONG și Companie: aprobare / respingere cu mesaj

## Description
Admin Panel: Functionality to approve or reject ONG and Company accounts, with the option to send a message.

**Priority:** must_have

## Rationale
Ensures the legitimacy of organizations on the platform, maintaining trust and quality.

## Acceptance Criteria
- Admin poate aproba / respinge conturi ONG și Companie, cu posibilitatea de a trimite un mesaj.

---

### FR-ADMIN-03: Moderare conținut: oportunități, recenzii, profile — raportate de utilizatori

# FR-ADMIN-03: Moderare conținut: oportunități, recenzii, profile — raportate de utilizatori

## Description
Admin Panel: Functionality to moderate reported content, including opportunities, reviews, and profiles.

**Priority:** must_have

## Rationale
Maintains platform integrity and a safe environment by addressing inappropriate or violating content.

## Acceptance Criteria
- Admin poate modera oportunități, recenzii și profile raportate de utilizatori.

---

### FR-ADMIN-04: Dashboard statistici platformă: utilizatori activi, oportunități publicate, aplicații, conversii Walled Garden

# FR-ADMIN-04: Dashboard statistici platformă: utilizatori activi, oportunități publicate, aplicații, conversii Walled Garden

## Description
Admin Panel: Dashboard displaying key platform statistics such as active users, published opportunities, applications, and Walled Garden conversions.

**Priority:** must_have

## Rationale
Provides administrators with insights into platform performance and growth.

## Acceptance Criteria
- Dashboard-ul Admin afișează statistici despre utilizatori activi, oportunități publicate, aplicații și conversii Walled Garden.

---

### FR-ADMIN-05: Configurare parametri platformă: pragul de acces Walled Garden, categorii de cauze, skill-uri disponibile

# FR-ADMIN-05: Configurare parametri platformă: pragul de acces Walled Garden, categorii de cauze, skill-uri disponibile

## Description
Admin Panel: Functionality to configure platform parameters, including the Walled Garden access threshold, cause categories, and available skills.

**Priority:** must_have

## Rationale
Allows administrators to adjust key platform settings to optimize user experience and business goals.

## Acceptance Criteria
- Admin poate configura pragul de acces Walled Garden, categorii de cauze și skill-uri disponibile.

---

### FR-ADMIN-06: Gestionare notificări de sistem (email templates)

# FR-ADMIN-06: Gestionare notificări de sistem (email templates)

## Description
Admin Panel: Functionality to manage system notifications, including editing email templates.

**Priority:** should_have

## Rationale
Enables administrators to customize and maintain consistent messaging across the platform.

## Acceptance Criteria
- Admin poate gestiona notificările de sistem (email templates).

---

### FR-ADMIN-07: Log de activitate admin (audit trail)

# FR-ADMIN-07: Log de activitate admin (audit trail)

## Description
Admin Panel: An audit trail logging all actions performed by administrators.

**Priority:** should_have

## Rationale
Ensures accountability and provides a record of administrative actions for security and compliance.

## Acceptance Criteria
- Log de activitate admin (audit trail) este disponibil.

---

### FR-NOTIF-01: Confirmare înregistrare cont

# FR-NOTIF-01: Confirmare înregistrare cont

## Description
Email notification for account registration confirmation.

**Priority:** must_have

## Rationale
Essential for verifying user email addresses and activating accounts.

## Acceptance Criteria
- Email de confirmare trimis la înregistrarea contului.

---

### FR-NOTIF-02: Validare cont ONG/Companie de Admin

# FR-NOTIF-02: Validare cont ONG/Companie de Admin

## Description
Email and in-app notifications for ONG/Company account validation by Admin.

**Priority:** must_have

## Rationale
Informs organizations about the status of their account verification.

## Acceptance Criteria
- Email și notificare in-app trimise la validarea contului ONG/Companie de către Admin.

---

### FR-NOTIF-03: Aplicație primită (ONG/Companie)

# FR-NOTIF-03: Aplicație primită (ONG/Companie)

## Description
Email, push, and in-app notifications for new applications received by NGOs/Companies.

**Priority:** must_have

## Rationale
Alerts organizations to new interest in their opportunities, facilitating timely review.

## Acceptance Criteria
- Email, push și notificare in-app trimise la primirea unei aplicații (ONG/Companie).

---

### FR-NOTIF-04: Status aplicație schimbat (Voluntar)

# FR-NOTIF-04: Status aplicație schimbat (Voluntar)

## Description
Email, push, and in-app notifications for volunteers when their application status changes.

**Priority:** must_have

## Rationale
Keeps volunteers informed about the progress of their applications.

## Acceptance Criteria
- Email, push și notificare in-app trimise la schimbarea statusului aplicației (Voluntar).

---

### FR-NOTIF-05: Mesaj nou în conversație

# FR-NOTIF-05: Mesaj nou în conversație

## Description
Push and in-app notifications for new messages in a conversation, with an optional email digest.

**Priority:** must_have

## Rationale
Ensures users are promptly alerted to new messages, promoting timely responses.

## Acceptance Criteria
- Push și notificare in-app trimise pentru mesaje noi în conversație.
- Email digest (opțional) pentru mesaje noi.

---

### FR-NOTIF-06: Cerere de validare Social Resume (ONG)

# FR-NOTIF-06: Cerere de validare Social Resume (ONG)

## Description
Email, push, and in-app notifications for NGOs when a volunteer requests Social Resume validation.

**Priority:** must_have

## Rationale
Alerts NGOs to pending validation requests, allowing them to provide timely verification.

## Acceptance Criteria
- Email, push și notificare in-app trimise la cererea de validare Social Resume (ONG).

---

### FR-NOTIF-07: Social Resume validat (Voluntar)

# FR-NOTIF-07: Social Resume validat (Voluntar)

## Description
Email, push, and in-app notifications for volunteers when their Social Resume entry is validated by an ONG.

**Priority:** must_have

## Rationale
Informs volunteers that their experience has been officially recognized, enhancing their profile's credibility.

## Acceptance Criteria
- Email, push și notificare in-app trimise la validarea Social Resume (Voluntar).

---

### FR-NOTIF-08: Certificat nou disponibil (Voluntar)

# FR-NOTIF-08: Certificat nou disponibil (Voluntar)

## Description
Email, push, and in-app notifications for volunteers when a new certificate is available.

**Priority:** must_have

## Rationale
Informs volunteers about new formal recognition of their contributions.

## Acceptance Criteria
- Email, push și notificare in-app trimise la disponibilitatea unui certificat nou (Voluntar).

---

### FR-NOTIF-09: Trigger recenzie (24h după end proiect)

# FR-NOTIF-09: Trigger recenzie (24h după end proiect)

## Description
Email, push, and in-app notifications sent automatically 24 hours after a project's end date to trigger review requests.

**Priority:** must_have

## Rationale
Automates the review collection process, increasing feedback rates.

## Acceptance Criteria
- Email, push și notificare in-app trimise automat la 24h după data de end a proiectului pentru a solicita recenzii.

---

### FR-NOTIF-10: Oportunitate nouă matching skill-uri

# FR-NOTIF-10: Oportunitate nouă matching skill-uri

## Description
Email, push, and in-app notifications for volunteers about new opportunities matching their skills.

**Priority:** could_have

## Rationale
Proactively engages volunteers by informing them of relevant new opportunities.

## Acceptance Criteria
- Email, push și notificare in-app trimise pentru oportunități noi care se potrivesc cu skill-urile voluntarului.

---

## Non-Functional Requirements

### NFR-001: Page Load Time

# NFR-001: Page Load Time

**Category:** performance

## Description
First Contentful Paint (FCP) for pages.

**Metric:** First Contentful Paint (FCP)
**Target:** < 2 seconds on 4G connection

## Rationale
Ensures a fast and responsive user experience, crucial for user retention and satisfaction.

---

### NFR-002: API Response Time

# NFR-002: API Response Time

**Category:** performance

## Description
95th percentile API response time.

**Metric:** p95 API response time
**Target:** < 500ms

## Rationale
Guarantees that backend operations are quick, supporting a fluid user interface and efficient data processing.

---

### NFR-003: Concurrent Users

# NFR-003: Concurrent Users

**Category:** scalability, performance

## Description
Capacity to handle simultaneous users without degradation of performance.

**Metric:** Number of concurrent users
**Target:** minimum 500

## Rationale
Ensures the platform can support a growing user base and peak usage periods without performance issues.

---

### NFR-004: System Uptime

# NFR-004: System Uptime

**Category:** availability

## Description
Minimum system availability.

**Metric:** Uptime percentage
**Target:** 99.5% minimum

## Rationale
Guarantees that the platform is consistently accessible to users, minimizing downtime and ensuring reliability.

---

### NFR-005: Secure Communication

# NFR-005: Secure Communication

**Category:** security

## Description
All communications must be encrypted.

**Metric:** Protocol version
**Target:** HTTPS (TLS 1.2+)

## Rationale
Protects sensitive user data during transmission, preventing eavesdropping and ensuring data integrity.

---

### NFR-006: Password Storage

# NFR-006: Password Storage

**Category:** security

## Description
Secure storage of user passwords.

**Metric:** Hashing algorithm and rounds
**Target:** bcrypt (min 12 rounds)

## Rationale
Protects user credentials from unauthorized access in case of a data breach.

---

### NFR-007: Input Validation

# NFR-007: Input Validation

**Category:** security

## Description
Protection against common web vulnerabilities.

**Metric:** Vulnerability types prevented
**Target:** CSRF, XSS, SQL Injection on all inputs

## Rationale
Prevents malicious attacks through user inputs, safeguarding the platform and user data.

---

### NFR-008: Authentication Rate Limiting

# NFR-008: Authentication Rate Limiting

**Category:** security

## Description
Prevent brute-force attacks on authentication endpoints.

**Metric:** Attempts per time period
**Target:** max 10 attempts / 15 minutes

## Rationale
Mitigates the risk of unauthorized access attempts through automated password guessing.

---

### NFR-009: Mobile Session Management

# NFR-009: Mobile Session Management

**Category:** security

## Description
Secure session management for mobile applications.

**Metric:** Token type
**Target:** JWT with refresh tokens

## Rationale
Ensures secure and persistent user sessions on mobile devices, protecting against session hijacking.

---

### NFR-010: Admin Activity Audit

# NFR-010: Admin Activity Audit

**Category:** security, auditability

## Description
Log all actions performed by administrators.

**Metric:** Audit log presence
**Target:** Audit log for Admin actions

## Rationale
Provides accountability for administrative actions and aids in security investigations and compliance.

---

### NFR-011: Explicit Consent

# NFR-011: Explicit Consent

**Category:** GDPR, privacy

## Description
Obtain user consent for data processing.

**Metric:** Consent types
**Target:** Explicit consent at registration (cookies, data processing, terms)

## Rationale
Complies with GDPR regulations regarding user data privacy and consent.

---

### NFR-012: Right to Erasure

# NFR-012: Right to Erasure

**Category:** GDPR, privacy

## Description
Allow users to request deletion of their data.

**Metric:** Deletion mechanism
**Target:** User can request complete account and data deletion (Admin Panel or email)

## Rationale
Complies with GDPR's 'right to be forgotten', empowering users with control over their personal data.

---

### NFR-013: Right to Data Portability

# NFR-013: Right to Data Portability

**Category:** GDPR, privacy

## Description
Allow users to export their personal data.

**Metric:** Export format
**Target:** Export complete personal data in JSON/PDF

## Rationale
Complies with GDPR's data portability requirement, allowing users to transfer their data.

---

### NFR-014: Minor Data Handling

# NFR-014: Minor Data Handling

**Category:** GDPR, privacy

## Description
Special handling for users under 18.

**Metric:** Parental consent flow
**Target:** Users under 18 require parental consent (dedicated flow)

## Rationale
Ensures compliance with child data protection laws and ethical guidelines.

---

### NFR-015: Data Storage Location

# NFR-015: Data Storage Location

**Category:** GDPR, privacy

## Description
Geographical location for data storage.

**Metric:** Server location
**Target:** Servers in EU (mandatory)

## Rationale
Ensures compliance with EU data residency requirements and GDPR.

---

### NFR-016: API-First Architecture

# NFR-016: API-First Architecture

**Category:** scalability, architecture

## Description
Design platform with an API-first approach.

**Metric:** Architecture style
**Target:** API-first (REST or GraphQL) to allow future extensions

## Rationale
Enables flexible integration with other services and future platform expansions, promoting scalability and modularity.

---

### NFR-017: Modular Design

# NFR-017: Modular Design

**Category:** scalability, architecture

## Description
Codebase and data schema designed for modularity.

**Metric:** Modularity support
**Target:** ONG Management Tool module activatable via feature flag without refactoring

## Rationale
Facilitates future development and feature additions without requiring extensive changes to the core system.

---

### NFR-018: Cloud Infrastructure

# NFR-018: Cloud Infrastructure

**Category:** scalability, architecture

## Description
Utilize cloud services with auto-scaling capabilities.

**Metric:** Infrastructure type
**Target:** Cloud (AWS / GCP / Azure) with auto-scaling

## Rationale
Provides flexibility to handle varying loads and ensures high availability and performance as the platform grows.

---

### NFR-019: CI/CD Pipeline

# NFR-019: CI/CD Pipeline

**Category:** development, operations

## Description
Implement continuous integration and continuous deployment.

**Metric:** CI/CD setup
**Target:** CI/CD pipeline configured (auto-deploy staging on PR, manual deploy production)

## Rationale
Ensures efficient and reliable software delivery, reducing deployment risks and accelerating development cycles.

---

### NFR-020: API Documentation

# NFR-020: API Documentation

**Category:** development, architecture

## Description
Provide comprehensive API documentation.

**Metric:** Documentation standard
**Target:** API documentation (Swagger/OpenAPI) mandatory

## Rationale
Facilitates understanding and integration for internal and external developers, crucial for an API-first approach.

---

### NFR-021: WCAG Compliance

# NFR-021: WCAG Compliance

**Category:** accessibility

## Description
Adhere to Web Content Accessibility Guidelines.

**Metric:** WCAG level
**Target:** Minimum WCAG 2.1 level AA for main components

## Rationale
Ensures the platform is usable by individuals with disabilities, broadening the user base and complying with accessibility standards.

---

### NFR-022: Screen Reader Support

# NFR-022: Screen Reader Support

**Category:** accessibility

## Description
Ensure critical flows are usable with screen readers.

**Metric:** Screen reader compatibility
**Target:** Support for screen readers on critical flows (registration, application)

## Rationale
Provides essential accessibility for visually impaired users, enabling them to navigate and interact with core platform functionalities.

---

## BDD Scenarios (Business Tests)

### Feature: User Authentication

# Feature: User Authentication

## Scenario: New volunteer registers with email and password

**Given:**
- A new volunteer is on the registration page.

**When:**
- The volunteer fills in the registration form with a valid email and password (min. 8 characters, complexity rules).
- The volunteer submits the form.

**Then:**
- A confirmation email is sent to the provided email address.
- The volunteer's account status is 'inactive' until email confirmation.
- The volunteer cannot log in until the email is confirmed.

**Tags:** AUTH, Registration

---

### BDD Scenario 2

## Scenario: New volunteer registers via Google

**Given:**
- A new volunteer is on the registration page.

**When:**
- The volunteer clicks the 'Register with Google' button.
- The volunteer successfully authenticates with their Google account.

**Then:**
- A new account is automatically created for the volunteer.
- The volunteer is logged into the platform.
- The volunteer is redirected to the onboarding wizard.

**Tags:** AUTH, SocialLogin

---

### BDD Scenario 3

## Scenario: ONG representative's account is verified by Admin

**Given:**
- An ONG representative has registered and submitted additional data (Denumire ONG, CUI, adresă, persoană de contact).
- The ONG account status is 'În așteptare'.
- An Admin VoluntX is logged into the Admin Panel.

**When:**
- The Admin VoluntX reviews the ONG's data.
- The Admin VoluntX approves the ONG account.

**Then:**
- The ONG account status changes to 'Active'.
- A confirmation email is sent to the ONG representative.
- The ONG representative can now post opportunities.

**Tags:** AUTH, Verification, Admin

---

### BDD Scenario 4

## Scenario: Volunteer completes mandatory onboarding steps

**Given:**
- A new volunteer has registered and confirmed their email.
- The volunteer is automatically directed to the multi-step onboarding wizard.

**When:**
- The volunteer completes Step 1 (Personal Data).
- The volunteer completes Step 2 (Education).
- The volunteer completes Step 4 (Skills & Foreign Languages).
- The volunteer completes Step 5 (Career Preferences & CV), filling in mandatory fields.

**Then:**
- The progress bar visibly updates at each step.
- Data is automatically saved at each step.
- The volunteer cannot skip mandatory fields.
- Upon completion, a success animation is displayed.
- The volunteer's public profile is populated with the entered data.
- The volunteer can access platform functionalities.

**Tags:** ONB, Onboarding, Profile

---

### BDD Scenario 5

## Scenario: Volunteer adds and requests validation for a volunteer experience

**Given:**
- A volunteer is logged into their account.
- The volunteer is on their profile page, in the Social Resume section.

**When:**
- The volunteer clicks to add a new volunteer experience.
- The volunteer fills in the details (Organization, Role, Period, Description, Applied Skills).
- The volunteer clicks 'Solicită validare' for the selected ONG.

**Then:**
- The new experience is added to the Social Resume with an 'Auto-declarat' indicator.
- A validation request is sent to the selected ONG.
- The volunteer can see the status of the validation request.

**Tags:** PROF, SocialResume, Validation

---

### BDD Scenario 6

## Scenario: ONG posts a new volunteer opportunity

**Given:**
- An ONG representative is logged into their validated ONG account.
- The ONG representative is in the 'Create Opportunity' section of their dashboard.

**When:**
- The ONG representative fills in all mandatory fields of the opportunity form (Title, Description, Category, Skills, Spots, Location, Dates, Estimated Hours).
- The ONG representative clicks 'Publish Opportunity'.

**Then:**
- The opportunity becomes public on the marketplace.
- The opportunity is listed in the ONG's dashboard as 'Active'.
- Volunteers can discover and apply for the opportunity.

**Tags:** MKT, ONG, Opportunity

---

### BDD Scenario 7

## Scenario: Volunteer searches and applies for an opportunity

**Given:**
- A volunteer is logged into their account.
- The volunteer is on the volunteer opportunities feed.

**When:**
- The volunteer applies filters (e.g., 'Educație' category, 'București' location).
- The volunteer types 'mentorat' in the search bar.
- The volunteer clicks on a relevant opportunity to view its details.
- The volunteer clicks the 'Apply' button.
- The volunteer optionally adds a motivation message.

**Then:**
- The opportunities feed updates dynamically based on filters and search.
- The detailed opportunity page displays all information, including ONG profile and map.
- The application is submitted using the volunteer's VoluntX profile.
- The volunteer receives a confirmation of their application.
- The application status is visible in the volunteer's dashboard.

**Tags:** MKT, Volunteer, Application

---

### BDD Scenario 8

## Scenario: Eligible volunteer accesses and applies for a job in Walled Garden

**Given:**
- A volunteer is logged into their account.
- The volunteer has at least one validated volunteer experience in their Social Resume.

**When:**
- The volunteer navigates to the 'Walled Garden' section.
- The volunteer browses the job/internship feed.
- The volunteer clicks on a job to view its details.
- The volunteer clicks the 'Apply' button.
- The volunteer optionally adds a cover letter.

**Then:**
- The Walled Garden feed is fully visible (not blurred).
- The detailed job page displays the full job description and company profile.
- The application is submitted using the volunteer's complete VoluntX profile (Social Resume, validated skills, certificates).
- The volunteer receives an email confirmation of the application.
- The application status is tracked in the 'Aplicările mele' section.

**Tags:** WG, WalledGarden, JobApplication

---

### BDD Scenario 9

## Scenario: Volunteer without eligibility tries to access Walled Garden

**Given:**
- A volunteer is logged into their account.
- The volunteer does NOT have any validated volunteer experience in their Social Resume.

**When:**
- The volunteer navigates to the 'Walled Garden' section.

**Then:**
- The job/internship feed is displayed in blur.
- A clear message is shown: 'Completează primul voluntariat validat pentru a accesa oportunități de carieră'.
- A Call to Action (CTA) directs the volunteer to volunteer opportunities.

**Tags:** WG, WalledGarden, Eligibility

---

### BDD Scenario 10

## Scenario: Volunteer and ONG exchange messages about an opportunity

**Given:**
- A volunteer has applied for an opportunity posted by an ONG.
- Both the volunteer and the ONG representative are logged in.

**When:**
- The volunteer sends a message to the ONG from the opportunity's context.
- The ONG representative receives a push notification and an in-app badge.
- The ONG representative opens the message in their unified inbox.
- The ONG representative replies to the volunteer.

**Then:**
- The messages are exchanged in real-time.
- The conversation history is persistent.
- Read/unread indicators are visible for messages.
- The volunteer receives a notification for the ONG's reply.

**Tags:** MSG, Communication, Chat

---

### BDD Scenario 11

## Scenario: Volunteer rates an ONG after project completion

**Given:**
- A volunteer has completed a project with an ONG.
- 24 hours have passed since the project's end date.

**When:**
- The volunteer receives an email and in-app notification to leave a review.
- The volunteer navigates to the review section for the completed project.
- The volunteer provides a text review and a 5-star rating for 'Organizare', 'Comunicare', 'Impact', and 'Experiență generală'.
- The volunteer submits the review.

**Then:**
- The average rating and number of reviews are updated on the ONG's profile.
- The review is visible on the ONG's public profile.

**Tags:** RAT, Review, Feedback

---

### BDD Scenario 12

## Scenario: Admin moderates an inappropriate review

**Given:**
- A user has reported a review as inappropriate.
- An Admin VoluntX is logged into the Admin Panel.
- The Admin navigates to the 'Content Moderation' section.

**When:**
- The Admin reviews the reported review.
- The Admin determines the review violates community rules.
- The Admin clicks 'Hide Review'.

**Then:**
- The inappropriate review is no longer publicly visible on the profile.
- The action is recorded in the Admin activity log.

**Tags:** ADMIN, Moderation, Review

---

## Acceptance Criteria

### AC-AUTH-01: Email de confirmare trimis

# AC-AUTH-01: Email de confirmare trimis

**Linked Requirement:** FR-AUTH-01
**Verification Method:** automated_test

---

### AC-AUTH-02: Contul e inactiv până la confirmare

# AC-AUTH-02: Contul e inactiv până la confirmare

**Linked Requirement:** FR-AUTH-01
**Verification Method:** automated_test

---

### AC-AUTH-03: Login social creează cont automat la prima utilizare

# AC-AUTH-03: Login social creează cont automat la prima utilizare

**Linked Requirement:** FR-AUTH-02
**Verification Method:** automated_test

---

### AC-AUTH-04: Formularul include câmpuri: Denumire ONG, CUI, adresă, persoană de contact

# AC-AUTH-04: Formularul include câmpuri: Denumire ONG, CUI, adresă, persoană de contact

**Linked Requirement:** FR-AUTH-07
**Verification Method:** manual_test

---

### AC-AUTH-05: Status 'În așteptare' vizibil în dashboard pentru ONG

# AC-AUTH-05: Status 'În așteptare' vizibil în dashboard pentru ONG

**Linked Requirement:** FR-AUTH-07
**Verification Method:** manual_test

---

### AC-AUTH-06: Email de confirmare la aprobare/respingere ONG

# AC-AUTH-06: Email de confirmare la aprobare/respingere ONG

**Linked Requirement:** FR-AUTH-07
**Verification Method:** automated_test

---

### AC-AUTH-07: Pagina 'Securitate' listează sesiunile active

# AC-AUTH-07: Pagina 'Securitate' listează sesiunile active

**Linked Requirement:** FR-AUTH-XX (Not explicitly defined as FR, but implied by user story)
**Verification Method:** manual_test

---

### AC-AUTH-08: Buton 'Deconectează toate sesiunile'

# AC-AUTH-08: Buton 'Deconectează toate sesiunile'

**Linked Requirement:** FR-AUTH-XX (Not explicitly defined as FR, but implied by user story)
**Verification Method:** manual_test

---

### AC-ONB-01: Wizard lansat automat dupa confirmarea email-ului

# AC-ONB-01: Wizard lansat automat dupa confirmarea email-ului

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** automated_test

---

### AC-ONB-02: Progress bar vizibil la fiecare pas

# AC-ONB-02: Progress bar vizibil la fiecare pas

**Linked Requirement:** FR-ONB-01
**Verification Method:** manual_test

---

### AC-ONB-03: Nu pot accesa platforma fara a finaliza minim pasii obligatorii (01, 02, 04, 05)

# AC-ONB-03: Nu pot accesa platforma fara a finaliza minim pasii obligatorii (01, 02, 04, 05)

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** automated_test

---

### AC-ONB-04: Educatia din wizard => sectiunea Educatie din profil

# AC-ONB-04: Educatia din wizard => sectiunea Educatie din profil

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** automated_test

---

### AC-ONB-05: Skill-urile din wizard => sectiunea Skill-uri din profil

# AC-ONB-05: Skill-urile din wizard => sectiunea Skill-uri din profil

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** automated_test

---

### AC-ONB-06: Experienta din wizard => Social Resume (marcata Profesional, nu Voluntariat)

# AC-ONB-06: Experienta din wizard => Social Resume (marcata Profesional, nu Voluntariat)

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** automated_test

---

### AC-ONB-07: Toate datele din wizard vizibile in profilul public

# AC-ONB-07: Toate datele din wizard vizibile in profilul public

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** manual_test

---

### AC-ONB-08: CV-ul PDF descarcabil direct din profil

# AC-ONB-08: CV-ul PDF descarcabil direct din profil

**Linked Requirement:** FR-ONB-06, FR-PROF-09
**Verification Method:** manual_test

---

### AC-ONB-09: Limbile afisate cu nivel de competenta standardizat (CEFR)

# AC-ONB-09: Limbile afisate cu nivel de competenta standardizat (CEFR)

**Linked Requirement:** FR-ONB-XX (Implied by onboarding context)
**Verification Method:** manual_test

---

### AC-PROF-01: Toate câmpurile din Hero Section editabile

# AC-PROF-01: Toate câmpurile din Hero Section editabile

**Linked Requirement:** FR-PROF-01
**Verification Method:** manual_test

---

### AC-PROF-02: Profilul are URL public unic (ex: voluntx.ro/user/nume)

# AC-PROF-02: Profilul are URL public unic (ex: voluntx.ro/user/nume)

**Linked Requirement:** FR-PROF-XX (Implied by public profile)
**Verification Method:** manual_test

---

### AC-PROF-03: Preview mod 'Cum mă vede un recruter'

# AC-PROF-03: Preview mod 'Cum mă vede un recruter'

**Linked Requirement:** FR-PROF-XX (Implied by public profile)
**Verification Method:** manual_test

---

### AC-PROF-04: Formular de adăugare experiență cu toate câmpurile

# AC-PROF-04: Formular de adăugare experiență cu toate câmpurile

**Linked Requirement:** FR-PROF-03
**Verification Method:** manual_test

---

### AC-PROF-05: Buton 'Solicită validare' trimite cerere ONG-ului selectat

# AC-PROF-05: Buton 'Solicită validare' trimite cerere ONG-ului selectat

**Linked Requirement:** FR-PROF-03
**Verification Method:** automated_test

---

### AC-PROF-06: Badge 'Validat' apare după confirmare ONG

# AC-PROF-06: Badge 'Validat' apare după confirmare ONG

**Linked Requirement:** FR-PROF-03, FR-PROF-04
**Verification Method:** automated_test

---

### AC-PROF-07: Experiențele nevalidate apar cu indicator 'Auto-declarat'

# AC-PROF-07: Experiențele nevalidate apar cu indicator 'Auto-declarat'

**Linked Requirement:** FR-PROF-03
**Verification Method:** manual_test

---

### AC-PROF-08: Statisticile se actualizează în timp real

# AC-PROF-08: Statisticile se actualizează în timp real

**Linked Requirement:** FR-PROF-02
**Verification Method:** automated_test

---

### AC-PROF-09: Tooltip pe fiecare metrică explică cum se calculează

# AC-PROF-09: Tooltip pe fiecare metrică explică cum se calculează

**Linked Requirement:** FR-PROF-02
**Verification Method:** manual_test

---

### AC-MKT-01: Min. 6 filtre active simultan

# AC-MKT-01: Min. 6 filtre active simultan

**Linked Requirement:** FR-MKT-06
**Verification Method:** manual_test

---

### AC-MKT-02: Rezultatele se actualizează fără reload (live filtering)

# AC-MKT-02: Rezultatele se actualizează fără reload (live filtering)

**Linked Requirement:** FR-MKT-06
**Verification Method:** automated_test

---

### AC-MKT-03: Număr rezultate afișat dinamic

# AC-MKT-03: Număr rezultate afișat dinamic

**Linked Requirement:** FR-MKT-06
**Verification Method:** manual_test

---

### AC-MKT-04: Panou dedicat per oportunitate pentru gestionarea aplicațiilor

# AC-MKT-04: Panou dedicat per oportunitate pentru gestionarea aplicațiilor

**Linked Requirement:** FR-MKT-03
**Verification Method:** manual_test

---

### AC-MKT-05: Acțiuni bulk (acceptă/respinge multiple)

# AC-MKT-05: Acțiuni bulk (acceptă/respinge multiple)

**Linked Requirement:** FR-MKT-03
**Verification Method:** manual_test

---

### AC-MKT-06: Email automat la fiecare schimbare de status aplicație

# AC-MKT-06: Email automat la fiecare schimbare de status aplicație

**Linked Requirement:** FR-MKT-03
**Verification Method:** automated_test

---

### AC-MKT-07: Export lista voluntarilor acceptați (CSV)

# AC-MKT-07: Export lista voluntarilor acceptați (CSV)

**Linked Requirement:** FR-DASH-O-08
**Verification Method:** manual_test

---

### AC-MKT-08: Date de contact vizibile după acceptare

# AC-MKT-08: Date de contact vizibile după acceptare

**Linked Requirement:** FR-MKT-XX (Implied by ONG management)
**Verification Method:** manual_test

---

### AC-WG-01: Aplicarea nu necesită upload CV separat

# AC-WG-01: Aplicarea nu necesită upload CV separat

**Linked Requirement:** FR-WG-11
**Verification Method:** manual_test

---

### AC-WG-02: Compania vede Social Resume, skill-uri validate, certificate

# AC-WG-02: Compania vede Social Resume, skill-uri validate, certificate

**Linked Requirement:** FR-WG-04, FR-WG-11
**Verification Method:** manual_test

---

### AC-WG-03: Confirmarea aplicării trimisă pe email

# AC-WG-03: Confirmarea aplicării trimisă pe email

**Linked Requirement:** FR-WG-11
**Verification Method:** automated_test

---

### AC-WG-04: Mesaj clar cu criteriul neîndeplinit pentru Walled Garden

# AC-WG-04: Mesaj clar cu criteriul neîndeplinit pentru Walled Garden

**Linked Requirement:** FR-WG-08
**Verification Method:** manual_test

---

### AC-WG-05: CTA direct către oportunități de voluntariat

# AC-WG-05: CTA direct către oportunități de voluntariat

**Linked Requirement:** FR-WG-08
**Verification Method:** manual_test

---

### AC-WG-06: Progress indicator vizual pentru Walled Garden acces

# AC-WG-06: Progress indicator vizual pentru Walled Garden acces

**Linked Requirement:** FR-WG-08
**Verification Method:** manual_test

---

### AC-WG-07: Profilul candidatului vizibil complet în contextul aplicației

# AC-WG-07: Profilul candidatului vizibil complet în contextul aplicației

**Linked Requirement:** FR-WG-04
**Verification Method:** manual_test

---

### AC-WG-08: Istoricul de voluntariat cu indicatori 'Validat/Auto-declarat'

# AC-WG-08: Istoricul de voluntariat cu indicatori 'Validat/Auto-declarat'

**Linked Requirement:** FR-WG-04
**Verification Method:** manual_test

---

### AC-WG-09: Posibilitate de a lăsa note interne per candidat

# AC-WG-09: Posibilitate de a lăsa note interne per candidat

**Linked Requirement:** FR-WG-04
**Verification Method:** manual_test

---
