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

## External Dependencies

Read and follow the instructions in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

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
4. Check existing code for patterns and conventions
5. Implement API route handlers (if needed for client-side fetching):
    - Create route handlers in `app/api/**/route.ts`
    - Export named functions matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)
    - Validate request bodies with zod
    - Use Prisma Client for data access
    - Return `NextResponse.json()` with appropriate status codes
6. Implement server actions (if needed for form mutations):
    - Create actions in `app/actions/` or colocate with the page
    - Mark with `"use server"` directive
    - Validate input with zod
    - Use Prisma Client for data access
    - Call `revalidatePath()` or `revalidateTag()` for cache invalidation
7. Implement the UI:
    - Create or update `page.tsx` and `layout.tsx` files
    - Use server components by default for data fetching with Prisma
    - Use client components (`"use client"`) only for interactivity (forms, event handlers, state)
    - Create reusable UI components in `components/`
    - Handle loading states with `loading.tsx`
    - Handle errors with `error.tsx`
    - Handle empty states
    - When a design artifact exists, match the specified layout, components, states, and navigation
8. Write unit tests for the implemented logic:
    - Test API route handlers with mocked Prisma Client
    - Test server actions with mocked dependencies
    - Test client components with React Testing Library
    - Run tests with `npx vitest run` to verify they pass
9. Run code quality checks as described in `nexa-claude-nextjs/skills/code-quality/CODE_QUALITY.md`
10. Verify the implementation compiles successfully with `next build`

## DoD Check

- For **UC-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_DONE.md`.
- For **TT-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_DONE_TT.md`.
- For **BUG-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_DONE_BUG.md`.

Do not proceed to post-implementation tracking until all items pass or the user explicitly waives failures.

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.

## Resources

- Use the context7 MCP server for Next.js documentation
