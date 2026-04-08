---
name: setup-i18n
description: >
  Sets up server-side internationalization infrastructure for Next.js App Router using
  next-intl. Creates middleware locale detection, translation file structure, type-safe
  utilities, and routing configuration. Run before implementing use cases so that all
  feature code produces localized pages from the start. Use when the user asks to
  "set up i18n", "add internationalization", "add translations", "set up localization",
  "add multi-language support", or mentions i18n, internationalization, localization,
  or multi-language.
---

# Setup Internationalization (i18n)

## Instructions

Set up server-side internationalization infrastructure for the project using Next.js
App Router conventions. This skill produces the translation infrastructure that all
subsequent use case implementations depend on — locale detection, translation loading,
and type-safe translation utilities for both server and client components.

Run this skill **after** environment profiles exist (`/setup-env-profiles`) and **before**
implementing use cases. If the request interception layer already exists
(`/setup-web-middleware`), this skill extends it with locale detection rather than
replacing it.

## Step 0: Consult Next.js and next-intl Documentation

**Before writing any code**, use the context7 MCP server to look up:

1. **Next.js version** — read `package.json` to determine the installed version
2. **next-intl documentation** — query for the current setup guide for Next.js App Router,
   including:
   - Middleware integration for locale detection and routing
   - Server component usage (`getTranslations`, `getLocale`)
   - Client component usage (`useTranslations`, `useLocale`)
   - Message file structure and namespacing
   - TypeScript integration for type-safe translation keys
   - Configuration file conventions (`i18n/request.ts` or equivalent)
3. **Next.js middleware composition** — how to chain multiple middleware concerns (auth +
   i18n) in a single entry point, if a request interception file already exists

Store these findings and use them throughout the remaining steps. Every file name, export,
and API choice must align with what the documentation says for the installed versions.

## DO NOT

- Replace the existing request interception file — extend it with locale detection
- Install libraries without user confirmation
- Hardcode locale strings in components — always use translation functions
- Put translation JSON files inside `public/` — keep them in the project source (e.g. `messages/`)
- Create client components for content that can be rendered as server components with translations
- Add locale-specific content or translations in this skill — only set up the infrastructure and placeholder keys
- Skip reading the requirements — the supported locales must come from requirements or user input
- Use client-side i18n libraries (react-i18next, react-intl) — use next-intl which is built for App Router server components
- Create a separate middleware file for i18n if one already exists for auth — compose them in the same entry point

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

The following must exist before running this skill:

- `docs/requirements.md` (from `/requirements`) — to identify supported locales and default language
- `package.json` — to determine the Next.js version

If `docs/requirements.md` is missing, stop and tell the user to run `/requirements` first.

## Workflow

### Step 1: Gather Context

1. Read `docs/requirements.md` and extract:
   - Supported locales (e.g. `en`, `de`, `fr`, `ro`)
   - Default locale
   - Any locale detection preferences (URL prefix, browser language, cookie)
   - Any RTL language requirements
2. Read `package.json` to determine the Next.js version and check if `next-intl` is already installed
3. Check if a request interception entry point already exists (the middleware file)
4. Check if any i18n infrastructure already exists (`messages/` directory, `i18n/` directory, translation imports)

If the requirements do not mention specific locales, ask the user:

> **Internationalization setup — I need the following:**
>
> 1. **Supported locales** — which languages should the app support? (e.g. `en, de, fr`)
> 2. **Default locale** — which locale should be used as the fallback? (e.g. `en`)
> 3. **Locale detection strategy** — URL prefix (recommended for SEO), cookie, or browser `Accept-Language` header?

Wait for the user to respond before proceeding.

### Step 2: Confirm Strategy with User

Present the i18n strategy for confirmation:

> **Internationalization strategy:**
>
> | Setting              | Value                                      |
> |----------------------|--------------------------------------------|
> | Library              | `next-intl` (server-side, App Router native) |
> | Supported locales    | [from requirements or user input]          |
> | Default locale       | [from requirements or user input]          |
> | Routing strategy     | URL prefix (`/en/...`, `/de/...`)          |
> | Locale detection     | `Accept-Language` header → cookie → default |
> | Default locale prefix | Hidden (no `/en` prefix for default locale) |
>
> **Why server-side with next-intl:**
> - Translations are rendered on the server — no flash of untranslated content
> - Works natively with React Server Components (no `"use client"` needed for translated content)
> - Translation JSON stays on the server — smaller client bundles
> - Middleware locale detection integrates with existing auth middleware
>
> Should I proceed with this setup?

Wait for the user to confirm or adjust before proceeding.

### Step 3: Install Dependencies

Install `next-intl`:

```bash
npm install next-intl
```

Ask the user for confirmation before installing.

Use the context7 MCP server to verify `next-intl` compatibility with the installed Next.js version.

### Step 4: Create Translation File Structure

Create the message files for each supported locale:

```
messages/
├── en.json        # Default locale — all keys must exist here
├── de.json        # Other supported locales
├── fr.json        # ...
└── ...
```

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

For non-default locales, use placeholder values that clearly indicate they need translation
(e.g. the English text with a `[TRANSLATE]` prefix) so they are easy to find and replace:

```json
{
  "common": {
    "appName": "[TRANSLATE] [App Name]",
    "loading": "[TRANSLATE] Loading...",
    ...
  }
}
```

### Step 5: Create i18n Configuration

Create the next-intl configuration following the documentation from Step 0. This typically
involves:

#### 5a. `i18n/config.ts` — Locale Configuration Constants

```typescript
export const locales = ['en', 'de', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
```

Use the actual locales from Step 1.

#### 5b. `i18n/request.ts` — Server-side Request Configuration

Create the request configuration file following the next-intl docs for the installed version.
This file configures how next-intl resolves the locale and loads messages for each request.

Consult the context7 MCP server for the exact API — the configuration format may vary across
next-intl versions.

#### 5c. `next.config.js` / `next.config.ts` — Plugin Configuration

Update the Next.js config to integrate the next-intl plugin, if required by the installed
version. Consult the context7 MCP server for the correct configuration.

**Do not overwrite existing configuration.** Read the current `next.config.js`/`next.config.ts`
and merge the i18n plugin with existing settings.

### Step 6: Set Up Routing

#### 6a. Create `i18n/routing.ts` — Routing Configuration

Create the routing configuration following the next-intl docs. This defines:

- The list of supported locales
- The default locale
- Locale prefix strategy (typically `as-needed` — hide the default locale prefix)

Consult the context7 MCP server for the exact API.

#### 6b. Create `i18n/navigation.ts` — Localized Navigation Utilities

Create localized versions of Next.js navigation primitives (`Link`, `redirect`,
`usePathname`, `useRouter`) following the next-intl docs.

These utilities automatically handle locale prefixes so that components don't need to
manage locale in URLs manually.

Consult the context7 MCP server for the exact API.

### Step 7: Integrate with Middleware

This step depends on whether a request interception entry point already exists.

#### 7a. If NO existing middleware

Create the middleware file using the next-intl middleware integration. Follow the next-intl
docs for the correct middleware setup. It should:

- Use the routing configuration from Step 6a
- Handle locale detection from `Accept-Language` header
- Rewrite URLs to include the locale prefix internally
- Export the config matcher to exclude static assets and internal Next.js routes

#### 7b. If existing middleware exists (from `/setup-web-middleware`)

Read the existing middleware file. Compose the i18n middleware with the auth middleware
following the next-intl documentation for middleware composition.

The composition order should be:

1. **i18n locale detection** — determine the locale for the request
2. **Auth checks** — authenticate/authorize (existing logic)
3. **Response** — apply security headers and locale routing

Show the user the proposed changes to the existing middleware and ask for confirmation:

> **I need to extend your existing middleware to add locale detection.**
>
> Current middleware handles: [list existing concerns — auth, security headers, etc.]
>
> Proposed changes:
> - Import next-intl middleware utilities
> - Add locale detection before auth checks
> - Compose both middleware concerns in the correct order
>
> [show the diff or proposed code]
>
> Should I proceed?

Wait for the user to confirm.

### Step 8: Set Up App Router Layout for Locales

#### 8a. Create locale-based route group

Create the `[locale]` dynamic segment in the app directory:

```
app/
├── [locale]/
│   ├── layout.tsx      # Root layout with locale provider
│   ├── page.tsx        # Home page (moved from app/page.tsx if exists)
│   └── ...             # All other pages go under [locale]/
```

#### 8b. Create or update the root layout

The `app/[locale]/layout.tsx` must:

- Accept `locale` from params
- Validate the locale against the supported list
- Set the `lang` attribute on `<html>`
- Set the text direction (`dir`) if RTL locales are supported
- Wrap children with the next-intl provider (following the docs for the installed version)

#### 8c. Handle existing pages

If pages already exist directly under `app/`:

1. List the existing pages to the user
2. Explain that they need to move under `app/[locale]/`
3. Move `app/page.tsx` to `app/[locale]/page.tsx` (and similarly for layout, loading, error files)
4. For other existing pages, create a migration checklist (do not move them automatically —
   they may need translation keys added)

If this is a greenfield project (only `app/page.tsx` or no pages), move the files directly.

### Step 9: Create Translation Utilities

#### 9a. Server Component Usage Example

Create a brief example or utility showing how to use translations in server components:

```typescript
// Example usage in a server component:
// import { getTranslations } from 'next-intl/server';
//
// export default async function DashboardPage() {
//   const t = await getTranslations('dashboard');
//   return <h1>{t('title')}</h1>;
// }
```

#### 9b. Client Component Usage Example

Create a brief example showing client component usage:

```typescript
// Example usage in a client component:
// 'use client';
// import { useTranslations } from 'next-intl';
//
// export default function SearchBar() {
//   const t = useTranslations('common');
//   return <input placeholder={t('search')} />;
// }
```

Place these examples as comments in the relevant configuration files, not as separate
documentation files.

### Step 10: Retrofit Detection

Check whether the project already has implemented features that need i18n integration.

#### 10a. Scan for Existing Code

Search for:
- **Pages** — `app/**/page.tsx` files with hardcoded text content
- **Components** — `components/**/*.tsx` files with hardcoded strings
- **Server actions** — files with hardcoded user-facing messages (validation errors, success messages)
- **API routes** — files returning hardcoded error/success messages

#### 10b. If Existing Features Found (Retrofit Mode)

If pages or components with hardcoded text exist, create a technical task following the
standard `TT-XXX` naming convention:

1. Read existing files in `docs/technical_tasks/` to determine the next available `TT-XXX` ID
2. Create `docs/technical_tasks/TT-XXX-i18n-retrofit.md` using the template from
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

**Do not apply the retrofit changes in this skill.** The checklist is implemented via
`/implement TT-XXX-i18n-retrofit` as a follow-up step.

### Step 11: Write Unit Tests

Create unit tests for the i18n configuration modules.

Place test files colocated with the source:

| Source File        | Test File                        |
|--------------------|----------------------------------|
| `i18n/config.ts`   | `i18n/__tests__/config.test.ts`  |
| `i18n/routing.ts`  | `i18n/__tests__/routing.test.ts` |

#### 11a. `config.test.ts` — Locale Configuration

- `locales` array contains all expected locales
- `defaultLocale` is included in the `locales` array
- `Locale` type is correctly derived (compile-time check — ensure the type exports work)

#### 11b. `routing.test.ts` — Routing Configuration

- Routing config uses the same locales as `config.ts`
- Default locale matches `config.ts`
- Locale prefix strategy is set to the expected value

**Do not** create tests for the middleware integration — that is validated by Playwright e2e tests.
**Do not** create tests for translation file content — translation keys change frequently and
testing them creates maintenance burden without catching real bugs.

### Step 12: Verify

1. Run `npx next build` to verify everything compiles
2. Verify the middleware matcher excludes static assets
3. Verify that translation files exist for every configured locale
4. Verify the `[locale]` route segment is set up correctly
5. Run all existing tests to ensure nothing is broken:
   - **Unit tests** — run `npx vitest run`
   - **Integration tests** — if they exist, run them
   - **E2E tests** — if Playwright is configured, run `npx playwright test`
   - If any test fails, fix the issue before proceeding
6. Describe a manual smoke test:
   - Visit `/` → should serve content in the default locale
   - Visit `/de` (or another supported locale) → should serve the locale-specific layout
   - Check the `<html lang="...">` attribute matches the locale
   - Check that the URL prefix is hidden for the default locale

### Step 13: Update CLAUDE.md

Append a `## Internationalization (i18n)` section to the target project's `CLAUDE.md` so that
future sessions know the i18n strategy and conventions.

1. If `CLAUDE.md` does not exist, create it
2. If a `## Internationalization (i18n)` section already exists (check for `<!-- NEXA_I18N_CONFIGURED -->`),
   ask the user whether to overwrite or skip
3. Append the following section (fill in the actual values from the setup):

~~~markdown
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
~~~

Do not remove or modify any other content in `CLAUDE.md`.

### Step 14: Summary

Present a summary of what was created:

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
