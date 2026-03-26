---
name: implement
description: >
  Implements use cases by creating NestJS services, controllers, and DTOs for the
  backend and Next.js pages and components for the frontend. Use when the user
  asks to "implement a use case", "build the UI", "create an API endpoint",
  "write the backend", or mentions NestJS implementation, Next.js pages,
  REST API, or full-stack implementation.
---

# Implement Use Case

## Instructions

Implement $ARGUMENTS using NestJS for the backend and Next.js for the frontend.
$ARGUMENTS can be a use case (`UC-XXX`) or a technical task (`TT-XXX`).
Write unit tests alongside the implementation. Integration tests (`jest-test`) and e2e tests (`playwright-test`) are separate skills.

Use the context7 MCP server to look up NestJS and Next.js documentation when needed.

## DO NOT

- Create integration or e2e tests (use dedicated testing skills instead)
- Mix backend and frontend concerns (keep clear separation)
- Use raw SQL queries (use Prisma Client)

## External Dependencies

Read and follow the instructions in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/mocking/MOCKING.md`.

## DoR Check

- For **UC-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY.md`.
- For **TT-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_READY_TT.md`.

Do not proceed with implementation until all items pass or the user explicitly waives failures.

## Tracking

Read and follow the **Before Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.

## Workflow

1. Read the specification:
    - For **UC-XXX**: Read the use case specification from `docs/use_cases/`
    - For **TT-XXX**: Read the technical task specification from `docs/technical_tasks/`
2. Read the entity model from `docs/entity_model.md` (if applicable)
3. Check existing code for patterns and conventions
4. Implement the NestJS backend:
    - Create or update DTOs for request/response validation
    - Create or update the service with business logic using Prisma Client
    - Create or update the controller with REST endpoints
    - Register the module if new
5. Verify the backend compiles successfully
6. Implement the Next.js frontend:
    - Create or update page components
    - Create or update reusable UI components
    - Implement API calls to the NestJS backend
    - Handle loading, error, and empty states
7. Write unit tests for the implemented logic:
    - Test NestJS services with mocked Prisma Client
    - Test DTO validation
    - Test frontend components with React Testing Library
    - Run tests with `npx jest --runInBand` to verify they pass
8. Run code quality checks as described in `nexa-claude-nestjs-nextjs/skills/code-quality/CODE_QUALITY.md`
9. Verify the full implementation compiles successfully

## DoD Check

- For **UC-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_DONE.md`.
- For **TT-XXX**: Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/DEFINITION_OF_DONE_TT.md`.

Do not proceed to post-implementation tracking until all items pass or the user explicitly waives failures.

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/tracking/TRACKING.md`.

## Resources

- Use the context7 MCP server for NestJS and Next.js documentation
