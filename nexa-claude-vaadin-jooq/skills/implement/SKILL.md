---
name: implement
description: >
  Implements use cases by creating Vaadin views, forms, and grids for the UI
  layer and jOOQ queries for the data access layer. Use when the user asks to
  "implement a use case", "build the UI", "create a Vaadin view", "write the
  data access layer", or mentions Vaadin implementation, jOOQ queries,
  Java web app, or database-backed UI.
---

# Implement Use Case

## Instructions

Implement $ARGUMENTS using Vaadin for the UI layer and jOOQ for data access.
$ARGUMENTS can be a use case (`UC-XXX`) or a technical task (`TT-XXX`).
Write unit tests alongside the implementation. Integration tests (`karibu-test`) and e2e tests (`playwright-test`) are separate skills.

Check the Vaadin and jOOQ MCP servers for guidance.

## DO NOT

- Create integration or e2e tests (use dedicated testing skills instead)

## External Dependencies

Read and follow the instructions in `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/mocking/MOCKING.md`.

## DoR Check

- For **UC-XXX**: Read and follow `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/readiness/DEFINITION_OF_READY.md`.
- For **TT-XXX**: Read and follow `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/readiness/DEFINITION_OF_READY_TT.md`.

Do not proceed with implementation until all items pass or the user explicitly waives failures.

## Tracking

Read and follow the **Before Implementation** steps in `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/tracking/TRACKING.md`.

## Workflow

1. Read the specification:
    - For **UC-XXX**: Read the use case specification from `docs/use_cases/`
    - For **TT-XXX**: Read the technical task specification from `docs/technical_tasks/`
2. Read the entity model from `docs/entity_model.md` (if applicable)
3. Check existing code for patterns and conventions
4. Implement the data access layer using jOOQ
5. Verify the data access layer compiles and follows existing patterns
6. Implement the Vaadin view following existing patterns
7. Wire up the view with the data access layer
8. Write unit tests for the implemented logic:
    - Test data access layer with mocked jOOQ DSLContext
    - Test business logic in isolation
    - Run tests to verify they pass
9. Verify the full implementation compiles successfully

## DoD Check

- For **UC-XXX**: Read and follow `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/readiness/DEFINITION_OF_DONE.md`.
- For **TT-XXX**: Read and follow `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/readiness/DEFINITION_OF_DONE_TT.md`.

Do not proceed to post-implementation tracking until all items pass or the user explicitly waives failures.

## Post-Implementation Tracking

Read and follow the **After Implementation** steps in `~/.claude/plugins/marketplaces/nexa-claude-marketplace/nexa-claude-core/shared/tracking/TRACKING.md`.

## Resources

- Use the Vaadin MCP server for component documentation
- Use the jOOQ MCP server for query DSL reference
- Use the JavaDocs MCP server for API documentation
