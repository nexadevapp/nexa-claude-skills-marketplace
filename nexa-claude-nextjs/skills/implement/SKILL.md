---
name: implement
description: >
  Implements use cases and fixes bugs by creating Next.js pages, components, API route handlers,
  and server actions. Use when the user asks to "implement a use case", "fix a bug", "build
  the UI", "create an API endpoint", "write a page", or mentions Next.js
  implementation, App Router, server actions, or full-stack implementation.
---

# Implement Use Case

## Instructions

Implement $ARGUMENTS using Next.js App Router for both the UI and API layer.
$ARGUMENTS can be a use case (`UC-XXX`), a technical task (`TT-XXX`), or a bug fix (`BUG-XXX`).
Write unit tests alongside the implementation. Integration tests (`vitest-test`) and e2e tests (`playwright-test`) are separate skills.

Use the context7 MCP server to look up Next.js documentation when needed.

## DO NOT

- Create integration or e2e tests (use dedicated testing skills instead)
- Use the Pages Router (use App Router exclusively)
- Use raw SQL queries (use Prisma Client)
- Use client components when server components suffice
- Put database calls in client components or API routes called only by server components
- Make implementation decisions without documenting their provenance (EXPLICIT vs INFERRED)

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/SPRINT_BRANCH_GATE.md`.

## External Dependencies

Read and follow the instructions in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

## Project Readiness Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/shared/readiness/PROJECT_READINESS.md`.

This gate checks that cross-cutting infrastructure (middleware, error logging, security headers,
environment configuration) exists before use case implementation begins. It applies to `UC-XXX`
items only — `TT-XXX` and `BUG-XXX` items skip this gate.

Do not proceed with implementation until all items pass or the user explicitly waives failures.

## DoR Check

- For **UC-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY.md`.
- For **TT-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY_TT.md`.
- For **BUG-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY_BUG.md`.

Do not proceed with implementation until all items pass or the user explicitly waives failures.

## Tracking

Read and follow the **Before Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.

## Workflow

1. Read the specification:
    - For **UC-XXX**: Read the use case specification from `docs/use_cases/`
    - For **TT-XXX**: Read the technical task specification from `docs/technical_tasks/`
    - For **BUG-XXX**: Read the bug report from `docs/bugs/`
2. Read the entity model from `docs/entity_model.md` (if applicable)
3. Read the design artifact from `docs/designs/` (if it exists for this UC). When a design artifact exists, the implementation must match the specified screens, layout, components, states, and navigation flow.
4. Read project design rules from `docs/designs/DESIGN_RULES.md` (if it exists). These are project-specific constraints — e.g., shared layout elements (header, footer, sidebar), mandatory components, or navigation patterns — that every implementation must follow. Missing a shared element specified in design rules is a defect.
5. Check existing code for patterns and conventions
6. **i18n Detection** — Always check whether the project uses internationalization.
   Look for any i18n indicators: translation/message files, i18n configuration, locale directories,
   translation function imports (`useTranslations`, `getTranslations`, `t()`, `intl`, etc.),
   locale-based routing segments (`[locale]`, `[lang]`), or i18n libraries in `package.json`
   (e.g., `next-intl`, `react-intl`, `react-i18next`, `i18next`).
   If any i18n setup is found, **all user-facing strings in this implementation MUST use the
   project's established translation pattern**:
    - Study how existing pages use translations and follow the same pattern
    - For every new page or section, add translation keys to **all** locale files following
      the project's existing file structure and naming conventions
    - User-facing error messages in server actions and API route handlers must also use
      translation keys, not hardcoded strings
    - Use the project's localized navigation utilities if they exist, instead of raw framework imports
    - Place new pages under the locale route segment if the project uses locale-based routing
7. Implement API route handlers (if needed for client-side fetching):
    - Create route handlers in `app/api/**/route.ts`
    - Export named functions matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)
    - Validate request bodies with zod
    - Use Prisma Client for data access
    - Return `NextResponse.json()` with appropriate status codes
8. Implement server actions (if needed for form mutations):
    - Create actions in `app/actions/` or colocate with the page
    - Mark with `"use server"` directive
    - Validate input with zod
    - Use Prisma Client for data access
    - Call `revalidatePath()` or `revalidateTag()` for cache invalidation
9. Implement the UI:
    - Create or update `page.tsx` and `layout.tsx` files
    - Use server components by default for data fetching with Prisma
    - Use client components (`"use client"`) only for interactivity (forms, event handlers, state)
    - Create reusable UI components in `components/`
    - Handle loading states with `loading.tsx`
    - Handle errors with `error.tsx`
    - Handle empty states
    - When a design artifact exists, match the specified layout, components, states, and navigation
    - When project design rules exist (read in step 4), enforce every rule — e.g., include shared layout elements, follow mandatory navigation patterns, and apply required brand guidelines
    - When i18n is active (detected in step 6), every user-facing string must use the project's translation pattern — no hardcoded text in JSX
    - When implementing forms where users enter data, always add client-side and server-side validation:
        - Define a zod schema for each form's input fields
        - Apply client-side validation to show inline field errors before submission
        - Validate again on the server side in the server action or API route handler (never trust client-only validation)
        - Display server-side validation errors back to the user
10. Write unit tests for the implemented logic:
    - Test API route handlers with mocked Prisma Client
    - Test server actions with mocked dependencies
    - Test client components with React Testing Library
    - When forms are involved, write dedicated validation unit tests:
        - Test the zod schema directly: valid inputs pass, invalid inputs produce the expected errors
        - Test that server actions and API route handlers reject invalid input and return appropriate error responses
        - Test that form components display validation errors for invalid input
    - Run tests with `npx vitest run` to verify they pass
11. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
12. Verify the implementation compiles successfully with `next build`
13. Document implementation decisions in a `DECISIONS.md` file (or in the PR description):
    - For each non-trivial decision made during implementation, record:
      - **Decision:** What was decided
      - **Provenance:** EXPLICIT (from spec/requirements) or INFERRED (agent reasoning)
      - **Source/Reasoning:** Quote the source document or explain the reasoning
    - INFERRED decisions are candidates for stakeholder review before merge

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.

## Resources

- Use the context7 MCP server for Next.js documentation
