---
name: implement
description: >
  Implements use cases, technical tasks, and bug fixes by creating ASP.NET Core API
  controllers, services, DTOs, and EF Core data access on the backend, and React SPA
  pages, components, React Query hooks, and Redux slices on the frontend. Use when the
  user asks to "implement a use case", "fix a bug", "build the UI", "create an API
  endpoint", "add a controller", or mentions React SPA, ASP.NET Core, EF Core, or
  full-stack implementation.
---

# Implement Use Case

## Instructions

Implement $ARGUMENTS across the two halves of the stack: an ASP.NET Core Web API backend
(`src/<Project>.Api/`) and a Create React App + TypeScript SPA frontend
(`src/<web-project>/`). `$ARGUMENTS` can be a use case (`UC-XXX`), a technical task
(`TT-XXX`), or a bug fix (`BUG-XXX`).

Write **unit** tests alongside the implementation — xUnit for the backend, Jest + React
Testing Library for the frontend. Integration tests with a real database (`xunit-test`) and
browser end-to-end tests (`playwright-test`) are separate skills.

For current ASP.NET Core / EF Core 8 / React Query / react-hook-form + yup API syntax, query
the **context7** MCP server rather than relying on memory.

## When to use

Use after a specification exists (`UC-XXX`, `TT-XXX`, or `BUG-XXX`) and cross-cutting
infrastructure is in place. This is the construction step that turns a spec and its design
into working backend endpoints and frontend screens.

## DO NOT

- Create integration or e2e tests (use `xunit-test` and `playwright-test`).
- Use raw SQL / `FromSqlRaw` / Dapper for CRUD — use EF Core (`DbContext` + LINQ). Raw SQL is only acceptable when the spec explicitly requires it (e.g. a bulk operation EF cannot express).
- Add Hangfire background jobs or SignalR hubs unless the specification explicitly calls for asynchronous processing or real-time updates. Default to a synchronous service call.
- Put data-access (`DbContext`) logic directly in controllers when the endpoint has real business logic — thin controllers delegate to a service registered in DI. Trivial pass-through reads may query the context directly, matching the existing codebase's conventions.
- Trust client-side validation alone — always validate again on the server.
- Make implementation decisions without documenting their provenance (EXPLICIT vs INFERRED).
- Over-engineer — implement only what the specification requires. No speculative abstractions, no interface with a single implementation added "for testing", no premature generalisation, no features not in the spec. Three similar lines are better than a premature abstraction. If a simple approach satisfies the requirement, use it.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Project Readiness Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/PROJECT_READINESS.md`.

This gate checks that cross-cutting infrastructure (authentication/authorization, the
exception-handling middleware that produces consistent error responses, security headers,
environment configuration) exists before use case implementation begins. It applies to
`UC-XXX` items only — `TT-XXX` and `BUG-XXX` items skip this gate.

Do not proceed with implementation until all items pass or the user explicitly waives failures.

## DoR Check

- For **UC-XXX**: Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_READY.md`.
- For **TT-XXX**: Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_READY_TT.md`.
- For **BUG-XXX**: Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/DEFINITION_OF_READY_BUG.md`.

Do not proceed with implementation until all items pass or the user explicitly waives failures.

## Tracking

Read and follow the **Before Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`.

## Test Data Conventions

- Use only `example.com` for test emails and accounts (e.g., `user@example.com`, `admin@example.com`). This is an IANA-reserved domain that will never route real mail.

## Process

1. Read the specification:
    - For **UC-XXX**: Read the use case specification from `docs/use_cases/`.
    - For **TT-XXX**: Read the technical task specification from `docs/technical_tasks/`.
    - For **BUG-XXX**: Read the bug report from `docs/bugs/`. Fix the **root cause**, not the reported symptom — trace every caller of the code you are about to touch and fix it once where all callers route through, so sibling call sites are not left broken.
2. Read the entity model from `docs/entity_model.md` (if applicable).
3. Read the design artifact from `docs/designs/UC-XXX-design.html` (if it exists for this UC). When a design artifact exists, the implementation must match the specified screens, layout, components, states, and navigation flow.
4. Read project design rules from `docs/designs/DESIGN_RULES.md` (if it exists). These are project-specific constraints — shared layout elements (header, footer, sidebar), mandatory components, navigation patterns — that every implementation must follow. Missing a shared element specified in design rules is a defect.
5. Check existing code for patterns and conventions on **both** halves:
    - Backend — an existing controller (`Controllers/`), the service layer (`Services/`), DTOs (`Dtos/` or `Models/DTOs/`), and the `DbContext` (`Data/`). Match namespaces, DI registration style (`Program.cs`), route conventions (`[ApiController]`, `[Route("api/[controller]")]`), and error-response shape.
    - Frontend — the axios API client (`src/services/api.ts`), existing React Query hooks, Redux slices (`src/store/slices/`), routes (`App.tsx` / react-router v7), and form components using react-hook-form + yup.
6. **i18n Detection** — Check whether the project uses internationalization. First check the project's `CLAUDE.md` for the marker `<!-- NEXA_I18N_CONFIGURED -->`. If absent, scan the requirements and frontend for i18n indicators: translation/message files, locale directories, translation function imports (`useTranslation`, `t()`, `intl`), or i18n libraries in `package.json` (`react-i18next`, `i18next`, `react-intl`).
    - **Default path** — this stack ships **no i18n** today. If none is detected, use plain user-facing strings.
    - If i18n **is** required by the spec but not yet set up: there is currently **no `/setup-i18n` skill for this stack** — flag it as a manual prerequisite to the user rather than inventing an ad-hoc setup, and record the decision in `DECISIONS.md`. Do not hard-block on it; proceed with plain strings unless the user directs otherwise.
    - If i18n **is** already configured, every user-facing string (including server-side validation/error messages surfaced to the UI) must use the project's established translation pattern — study existing usage and add keys to **all** locale files.
7. Implement the backend API:
    - Add or extend a **controller** in `Controllers/` (`[ApiController]`, `[Route("api/[controller]")]`, `[Authorize]` where the spec requires auth). Export one action per operation with the matching HTTP verb attribute (`[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]`). Return typed `IActionResult` results (`Ok`, `CreatedAtAction`, `NotFound`, `BadRequest`, `Conflict`) with the codebase's existing error-payload shape.
    - Put non-trivial business logic in a **service** class registered in DI (`Program.cs`, typically `AddScoped<IFoo, Foo>()`). Inject `CompensationContext`/`DbContext`, other services, and `ILogger<T>` through the constructor. Keep controllers thin.
    - Define request/response **DTOs** with server-side validation. Follow the codebase's existing style — DataAnnotations (`[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`) checked via `ModelState.IsValid`, or FluentValidation if the project already uses it. Never bind or return EF entities directly when the spec defines a distinct request/response shape.
    - All data access goes through **EF Core** (`DbContext` + LINQ, `async` methods, `Include` for relations). No raw SQL.
    - Rely on the existing **exception-handling middleware** for consistent error responses on unhandled exceptions — do not re-implement global error handling. Handle expected domain errors (not found, conflict, forbidden) explicitly with the right status code.
    - Add a **Hangfire** job or **SignalR** hub **only** if the spec explicitly requires background processing or real-time push; register it in `Program.cs` following existing patterns.
8. Implement the frontend SPA:
    - Add the API call to the axios client (`src/services/api.ts`) following the existing grouping.
    - Wrap server state in **React Query** hooks — `useQuery` for reads, `useMutation` (with `queryClient.invalidateQueries`) for writes — rather than calling axios directly in components.
    - Use **Redux Toolkit** slices (`src/store/slices/`) only for shared **client** state (auth, UI, cross-page selections). Do not duplicate server state that React Query already owns.
    - Build pages/components under `src/components/` (or the project's page directory) and wire routes with **react-router v7** in `App.tsx`, protecting them as existing routes do.
    - When a design artifact exists, match its layout, components, states, and navigation. When design rules exist (step 4), enforce every rule — shared layout elements, mandatory navigation, brand guidelines.
    - Handle **loading**, **error**, and **empty** states explicitly for every data-driven view (React Query exposes `isLoading`/`isError`; render accordingly).
    - For every form where users enter data, add **both** client- and server-side validation:
        - Define a **yup** schema and wire it with react-hook-form via `@hookform/resolvers/yup` (`useForm({ resolver: yupResolver(schema) })`). Do **not** use zod — this stack uses yup.
        - Show inline field errors from `formState.errors` before submission.
        - Validate again on the server (step 7) — never trust client-only validation — and surface server validation errors back to the user.
9. Write **unit** tests for the implemented logic:
    - **Backend (xUnit + Moq + FluentAssertions)** — test service classes with the repository/`DbContext` boundary mocked (Moq, or EF Core `InMemory` provider for query-shaped logic, matching the existing test project). Test controller actions with the service mocked, asserting status codes and payloads. Do **not** stand up a real database here — that is `xunit-test`.
    - **Frontend (Jest + React Testing Library)** — test components' rendering and interaction, mocking the API client / React Query as existing tests do.
    - **Validation tests** — for every form: test the yup schema directly (valid input passes, invalid input yields the expected messages); test that the DTO/controller rejects invalid input with the right error response; test that the form component displays validation errors.
    - Run the suites and confirm they pass (backend `dotnet test`, frontend `npm test -- --watchAll=false`).
10. Run the `/code-quality` skill.
11. Verify both halves build:
    - Backend: `dotnet build` (from the solution or `src/<Project>.Api/`) — 0 errors.
    - Frontend: `npm run build` (from `src/<web-project>/`) — succeeds with no type errors.
12. Document implementation decisions in a `DECISIONS.md` file (or in the PR description):
    - For each non-trivial decision made during implementation, record:
      - **Decision:** What was decided.
      - **Provenance:** EXPLICIT (from spec / design / requirements) or INFERRED (agent reasoning).
      - **Source/Reasoning:** Quote the source document or explain the reasoning.
    - INFERRED decisions are candidates for stakeholder review before merge.

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md`.

## Verification

- The specification's acceptance criteria are all satisfied; for a `BUG-XXX`, the reported defect no longer reproduces and the root cause (not just the symptom) is fixed.
- Backend: controller + service + DTOs implemented, all data access via EF Core (no raw SQL), server-side validation present, and no Hangfire/SignalR added unless the spec required it.
- Frontend: server state via React Query, client state via Redux only where shared, forms validated with yup + react-hook-form, and loading/error/empty states handled.
- When a design artifact and/or `DESIGN_RULES.md` exist, the UI matches them (layout, components, states, navigation, shared elements).
- i18n handled per detection: plain strings by default, or the project's translation pattern when i18n is configured; any i18n prerequisite recorded in `DECISIONS.md`.
- Unit tests written and passing (`dotnet test`, `npm test -- --watchAll=false`); `/code-quality` run clean.
- Both builds succeed: `dotnet build` and `npm run build`.
- `DECISIONS.md` records every non-trivial decision as EXPLICIT or INFERRED.

## Resources

- Use the context7 MCP server for ASP.NET Core, EF Core 8, React Query (`@tanstack/react-query`), react-hook-form, and yup documentation.
