# Sprint Refinement Proposal

**Sprint:** 2026-04-02
**Use Cases in Scope:** UC-003

## Scope Summary

This sprint delivers a simplified multi-step volunteer onboarding wizard — a 5-step flow that collects personal data, education, professional experience, skills/languages, and career preferences after registration. Hard-coded skill and language lists keep the scope minimal. No file uploads (avatar, CV) — those will be added via change requests in a future sprint. Includes auto-save, back navigation, real-time validation, session resume, and a success completion screen.

## Refined Requirements

### Existing Requirements (sprint-relevant)

| ID | Title | Priority | Mapped UCs | Refinement Depth | Notes |
|----|-------|----------|------------|------------------|-------|
| FR-ONB-01 | Progress bar vizibil | must_have | UC-003 | Deep | Missing step labels, mobile behavior |
| FR-ONB-02 | Navigare inapoi fara pierdere date | must_have | UC-003 | Light-touch | Clear enough |
| FR-ONB-03 | Salvare automata (draft) | must_have | UC-003 | Deep | Missing save trigger, redirect logic |
| FR-ONB-04 | Validare in timp real | must_have | UC-003 | Deep | Missing specific validation rules per field |
| FR-ONB-05 | Liste predefinite pentru skill-uri | must_have | UC-003 | Deep | Simplified: 6 hard-coded skills, no autocomplete, no custom |
| FR-ONB-06 | Upload CV cu preview | should_have | UC-003 | — | **DEFERRED** — no file uploads this sprint |
| FR-ONB-07 | Completare ulterioara din profil | must_have | UC-003 | Deep | Banner deferred to UC-033; UC-003 delivers redirect + data |
| FR-ONB-08 | Indicator completitudine profil | should_have | UC-003 | Deep | Simplified calculation (no CV weight) |
| FR-ONB-09 | Ecran de finalizare (success state) | must_have | UC-003 | Light-touch | Clear enough |

### New Requirements (discovered during refinement)

| ID | Title | User Story | Priority | Mapped UCs | Rationale |
|----|-------|------------|----------|------------|-----------|
| FR-ONB-10 | Onboarding route guard | As a volunteer who just registered, I am automatically redirected to the onboarding wizard and cannot access other platform features until I complete at least Step 1 | must_have | UC-003 | The requirements describe the redirect but don't specify the enforcement mechanism |

### Deferred to Change Request (next sprint)

| Feature | Original FR | Rationale |
|---------|------------|-----------|
| Avatar upload | FR-ONB-11 (dropped) | No file uploads this sprint — simplicity |
| CV upload with preview | FR-ONB-06 | No file uploads this sprint — simplicity |
| Dynamic skill search/autocomplete | FR-ONB-05 | Hard-coded list is sufficient for MVP |
| Custom skill creation | FR-ONB-05 | Deferred with dynamic skills |
| Full language catalog | FR-ONB-05 | 3 hard-coded languages for now |

### Refinement Details

#### FR-ONB-01: Progress bar vizibil (deep)

**Original:** Indicator persistent in the top of the wizard: Step X of 5 + percentage progress bar.

**Refined:**
- Progress bar displays at the top of every wizard step with: step number label (e.g., "Step 2 of 5"), step name (e.g., "Education"), and a horizontal progress bar showing percentage (20% per step)
- Steps are labeled: 1. Personal Data, 2. Education, 3. Professional Experience, 4. Skills & Languages, 5. Career Preferences
- Completed steps show a checkmark icon; current step is visually highlighted; future steps are dimmed
- On mobile, step labels collapse to step numbers only
- Clicking a completed step navigates back to it (same as FR-ONB-02 back navigation)

#### FR-ONB-02: Navigare inapoi fara pierdere date (light-touch)

**Assessment:** Clear as specified. Back button on each step (except Step 1) navigates to the previous step with all data preserved. No changes needed.

#### FR-ONB-03: Salvare automata (draft) (deep)

**Original:** Data saved automatically at each step so user can resume after closing session.

**Refined:**
- Save trigger: data is persisted to the server when the user clicks "Next" to advance to the next step (not on every keystroke)
- The USER.onboarding_step field tracks the last completed step (0 = not started, 1-5 = last completed step)
- On login, if USER.onboarding_completed is false and onboarding_step < 5, redirect to step (onboarding_step + 1)
- If user is on Step 3 (optional) and clicks "Skip", the step is marked as completed with no data saved
- Partial data within a step is NOT persisted — user must complete and advance the step to save
- Decision: no client-side localStorage draft — server is the single source of truth

#### FR-ONB-04: Validare in timp real (deep)

**Original:** Required fields validated inline with clear per-field error messages.

**Refined — validation rules per step:**

**Step 1 — Personal Data:**
- First Name: required, 2-100 chars, letters/spaces/hyphens only
- Last Name: required, 2-100 chars, letters/spaces/hyphens only
- Date of Birth: required, must be between 14 and 100 years ago
- City: required, 2-100 chars
- Phone: optional, if provided must match international format (e.g., +40xxxxxxxxx)
- No avatar upload

**Step 2 — Education:**
- At least 1 education entry required
- Study Level: required, selected from predefined list (Liceu, Licenta, Master, Doctorat)
- Institution: required, 2-200 chars
- Field of Study: required, 2-200 chars
- Graduation Year: required, between 1950 and current year + 6

**Step 3 — Professional Experience (optional):**
- Can be skipped entirely via "Skip" button
- If adding an entry: Company Name (required, 2-200 chars), Role (required, 2-200 chars), Start Date (required), End Date (optional, must be after start date), Description (optional, max 1000 chars)
- Can add multiple entries

**Step 4 — Skills & Languages:**
- At least 3 skills required from 6 hard-coded options
- At least 1 language required from 3 hard-coded options, with proficiency level (Beginner, Intermediate, Advanced, Native)

**Step 5 — Career Preferences:**
- Career Interests: required, multi-select from hard-coded list
- No CV upload

Inline validation fires on blur for text fields, on change for selects. Error messages appear below the field in red.

#### FR-ONB-05: Liste predefinite pentru skill-uri (deep — simplified)

**Original:** Admin manages predefined skill lists. User can add custom values.

**Simplified for this sprint:**
- 6 hard-coded skills displayed as selectable chips/checkboxes:
  1. Communication
  2. Teamwork
  3. Organization
  4. Problem Solving
  5. Leadership
  6. Time Management
- No search, no autocomplete, no custom skill creation
- Selected skills appear as highlighted chips; deselect by clicking again
- Minimum 3 must be selected
- These are seeded in the SKILL table as predefined entries

- 3 hard-coded languages displayed as a simple select:
  1. English
  2. French
  3. German
- Each with a proficiency dropdown (Beginner, Intermediate, Advanced, Native)
- Minimum 1 language required
- Can add up to 3 language entries (one per language)
- These are seeded in the LANGUAGE table

- Dynamic lists, search, custom skills, and admin management deferred to change request

#### FR-ONB-06: Upload CV cu preview — DEFERRED

Not included in this sprint. CV upload will be delivered via a change request in a future sprint.

#### FR-ONB-07: Completare ulterioara din profil (deep)

**Refined:**
- Since UC-033 (Volunteer Dashboard) is not yet delivered, the banner implementation is limited to:
  - The redirect logic: on login, incomplete onboarding redirects to the wizard (covered by FR-ONB-03/FR-ONB-10)
  - The profile_completeness field is calculated and stored (covered by FR-ONB-08)
- The actual dashboard banner UI will be delivered with UC-033
- Decision: UC-003 delivers the data and redirect infrastructure; UC-033 delivers the banner rendering

#### FR-ONB-08: Indicator completitudine profil (deep — simplified)

**Original:** Percentage completeness score visible on profile with list of missing fields.

**Refined — calculation algorithm (no CV weight since upload deferred):**
- Profile completeness is calculated as a weighted sum:
  - Personal Data complete (Step 1 all required fields): 30%
  - At least 1 Education entry: 25%
  - At least 1 Professional Experience: 10% (optional, but contributes to score)
  - At least 3 Skills + 1 Language: 20%
  - Career Interests selected: 15%
- The score is stored in VOLUNTEER_PROFILE.profile_completeness and recalculated on each profile save
- UC-003 scope: calculate and persist the score during onboarding. Display it on the success screen (FR-ONB-09)

#### FR-ONB-09: Ecran de finalizare (success state) (light-touch)

**Assessment:** Clear. Success animation (confetti or checkmark), summary of entered data (name, education count, skills count, etc.), two CTAs: "Explore Opportunities" and "View Your Profile" — both link to `/dashboard` as a placeholder until UC-012/UC-006 are delivered. No changes needed.

#### FR-ONB-10: Onboarding route guard (new)

**Specification:**
- Middleware-level route guard: if authenticated user has account_type=VOLUNTEER and onboarding_completed=false, redirect all non-onboarding routes to `/onboarding`
- Exception: `/api/*` routes, `/logout`, and `/onboarding/*` itself
- After Step 5 completion, set USER.onboarding_completed=true and remove the guard
- This integrates with the existing auth middleware from sprint-1

## Entity Model Changes

### No changes needed

All entities referenced by UC-003 already exist with the required attributes:
- **USER**: onboarding_completed, onboarding_step — present
- **VOLUNTEER_PROFILE**: first_name, last_name, date_of_birth, city, phone, career_interests, profile_completeness — present
- **EDUCATION**: study_level, institution, field, graduation_year — present
- **PROFESSIONAL_EXPERIENCE**: company_name, role, start_date, end_date, description — present
- **SKILL / VOLUNTEER_SKILL**: name, type, is_predefined / volunteer_profile_id, skill_id — present
- **LANGUAGE / VOLUNTEER_LANGUAGE**: name, code / volunteer_profile_id, language_id, proficiency — present

All relationships correctly modeled. No new entities, attributes, or relationships required.

## Use Case Diagram Changes

### Updated Relationships

| Change | Detail | Rationale |
|--------|--------|-----------|
| Add dependency | UC-003 depends on UC-001 | Onboarding requires a registered and confirmed account; this implicit dependency should be explicit in the diagram |

No splits, merges, or new use cases needed.

## Open Questions

No open questions. All ambiguities resolved with explicit decisions documented above.
