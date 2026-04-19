---
name: code-quality
description: >
  Runs oxlint and oxfmt on TypeScript/JavaScript files to fix lint errors,
  enforce cyclomatic complexity limits, and apply consistent formatting.
  Use when the user asks to "lint", "format code", "run code quality checks",
  or mentions code quality, formatting, or static analysis.
---

# Code Quality — Oxc (oxlint + oxfmt)

## When to Apply

Run these checks after generating or modifying TypeScript/JavaScript files.
This applies to implementation code, test files, and any `.ts`/`.tsx`/`.js`/`.jsx` files.
It does **not** apply to Prisma schema files.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

Verify `oxlint` and `oxfmt` are available in the project:

```bash
npx oxlint --version
npx oxfmt --version
```

If not installed, add them:

```bash
npm install -D oxlint oxfmt
```

## Configuration

If the project does not yet have an `oxlintrc.json` at the root, create one:

```json
{
  "rules": {
    "eslint/complexity": ["warn", { "max": 10 }]
  }
}
```

This enforces a cyclomatic complexity ceiling of 10 per function. Functions exceeding
this threshold must be refactored before the task is considered complete.

## Linting

Run oxlint with auto-fix on the source and test directories:

```bash
npx oxlint --fix --tsconfig tsconfig.json src/
```

- If there are remaining warnings or errors that cannot be auto-fixed, resolve them manually.
- **Cyclomatic complexity violations** (`eslint/complexity`): refactor the function —
  extract helpers, use early returns, or simplify conditional logic.

## Formatting

Format all changed files with oxfmt:

```bash
npx oxfmt --write src/
```

## Order

1. **Lint first** — `oxlint --fix` (fixes code issues, reports complexity violations)
2. **Format last** — `oxfmt --write` (normalizes style without changing semantics)

This order matters because the formatter may reformat the linter's fixes, but not vice versa.

## Verification

The skill is complete when:

- `npx oxlint --tsconfig tsconfig.json src/` exits with **0 errors and 0 warnings**
- `npx oxfmt --check src/` exits with code **0** (all files already formatted)
- No function exceeds cyclomatic complexity of 10
