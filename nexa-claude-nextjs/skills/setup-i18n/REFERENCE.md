# Setup i18n Reference

Detailed templates for `setup-i18n/SKILL.md`.

## Step 4: Default Locale Message File

Each file starts with a minimal structure containing common namespaces:

```json
{
  "common": {
    "appName": "[App Name]",
    "loading": "Loading...",
    "error": "An error occurred",
    "notFound": "Page not found",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "search": "Search",
    "close": "Close",
    "confirm": "Confirm"
  },
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "settings": "Settings",
    "login": "Log in",
    "logout": "Log out",
    "signup": "Sign up"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "minLength": "Must be at least {min} characters",
    "maxLength": "Must be at most {max} characters"
  },
  "auth": {
    "loginTitle": "Log in",
    "signupTitle": "Sign up",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  }
}
```

## Step 4: Non-Default Locale Placeholder Example

```json
{
  "common": {
    "appName": "[TRANSLATE] [App Name]",
    "loading": "[TRANSLATE] Loading...",
    ...
  }
}
```

## Step 10b i18n Retrofit Task Fields

Create `docs/technical_tasks/TT-XXX-i18n-retrofit.md` using the template from
`nexa-claude-core/skills/technical-task/templates/technical-task.md` with:

- **Task ID:** `TT-XXX`
- **Task Name:** i18n Retrofit — Localize Existing Pages and Components
- **Category:** Cleanup
- **Goal:** Replace hardcoded user-facing strings with translation keys across existing
  pages, components, and server actions
- **Status:** Approved
- **Acceptance Criteria:** one checklist item per file that needs localization, grouped by:
  - **Pages** — files that need translation keys for content
  - **Components** — shared components with hardcoded strings
  - **Server actions** — user-facing messages that need translation
  - **API routes** — error/success messages that need translation
- **Affected Areas:** every file identified in the scan
- **Dependencies:** None

## Step 13 CLAUDE.md Section Template

```markdown
## Internationalization (i18n)

<!-- NEXA_I18N_CONFIGURED -->

- Library: `next-intl` (server-side, App Router native)
- Supported locales: [list, e.g. `en`, `de`, `fr`]
- Default locale: [locale, e.g. `en`]
- Routing: URL prefix (`/en/...`, `/de/...`), hidden for default locale
- Locale detection: `Accept-Language` header → cookie → default
- Translation files: `messages/{locale}.json`
- Config files: `i18n/config.ts`, `i18n/request.ts`, `i18n/routing.ts`, `i18n/navigation.ts`
- Locale layout: `app/[locale]/layout.tsx` — all pages live under `app/[locale]/`

### i18n conventions for implementation
- **Server components:** `const t = await getTranslations('namespace');` then `t('key')`
- **Client components:** `const t = useTranslations('namespace');` then `t('key')`
- **Navigation:** import `Link`, `redirect`, `useRouter` from `@/i18n/navigation` (not `next/link`)
- **New pages:** always create under `app/[locale]/` — never directly under `app/`
- **New translation keys:** add to `messages/en.json` first, then to other locale files
- **No hardcoded strings:** all user-facing text must use translation functions
```

## Step 14 Summary Template

```
## Internationalization Infrastructure Created

### Strategy
- Library: next-intl (server-side)
- Supported locales: [list]
- Default locale: [locale]
- Routing: URL prefix (hidden for default locale)
- Locale detection: Accept-Language → cookie → default

### Files Created/Updated
| File                                  | Purpose                               |
|---------------------------------------|---------------------------------------|
| messages/en.json                      | Default locale translations           |
| messages/de.json                      | [locale] translations (placeholders)  |
| i18n/config.ts                        | Locale constants and types            |
| i18n/request.ts                       | Server request configuration          |
| i18n/routing.ts                       | Routing configuration                 |
| i18n/navigation.ts                    | Localized navigation utilities        |
| i18n/__tests__/config.test.ts         | Unit tests for locale config          |
| i18n/__tests__/routing.test.ts        | Unit tests for routing config         |
| app/[locale]/layout.tsx               | Locale-aware root layout              |
| middleware.ts                         | [Created / Extended with i18n]        |
| next.config.js                        | [Updated with next-intl plugin]       |

### Middleware Integration
- [New middleware created / Extended existing auth middleware]
- Composition order: i18n locale detection → auth → security headers → response

### Test Results
- Unit tests: X passed, Y failed
- Integration tests: X passed, Y failed (or N/A)
- E2E tests: X passed, Y failed (or N/A)

### Retrofit (if applicable)
- Mode: Greenfield / Retrofit
- Existing pages to localize: N files
- Migration checklist: docs/technical_tasks/TT-XXX-i18n-retrofit.md

### How to Use in Feature Implementation
- **Server components:** `const t = await getTranslations('namespace');` then `t('key')`
- **Client components:** `const t = useTranslations('namespace');` then `t('key')`
- **Navigation:** Import `Link`, `redirect`, `useRouter` from `@/i18n/navigation` instead of `next/link` / `next/navigation`
- **New pages:** Create under `app/[locale]/` — never directly under `app/`
- **New translation keys:** Add to `messages/en.json` first, then to other locale files

### Next Steps
- Add translation keys for your first use case with `/implement`
- If in retrofit mode: run `/implement TT-XXX-i18n-retrofit` to localize existing pages
- Replace `[TRANSLATE]` placeholders in non-default locale files with actual translations
- Consider adding a language switcher component in your navigation
```
