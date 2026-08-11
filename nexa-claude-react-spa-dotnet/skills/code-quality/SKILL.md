---
name: code-quality
description: >
  Runs code quality checks across the two halves of the stack: `dotnet format`
  (whitespace + style + Roslyn analyzers) on the .NET backend, and ESLint
  (`react-app` preset) followed by Prettier on the React SPA frontend.
  Use when the user asks to "lint", "format code", "run code quality checks",
  or mentions dotnet format, eslint, code quality, formatting, or static analysis.
---

# Code Quality — .NET (dotnet format) + React SPA (ESLint + Prettier)

## When to Apply

Run these checks after generating or modifying source in either half of the repo:

- **Backend** — any `.cs` file under a project (`*.csproj` / referenced by `*.sln` / `*.slnx`).
- **Frontend** — any `.ts`/`.tsx`/`.js`/`.jsx` file under a Create React App project.

The skill may be invoked for one half or both. Detect what is present and run
only the relevant tool(s):

- Backend present if a `*.csproj`, `*.sln`, or `*.slnx` exists.
- Frontend present if a `package.json` with `react-scripts` in its dependencies exists.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

---

## Backend — dotnet format

### Configuration

`dotnet format` is driven by a repo-root `.editorconfig`. If none exists, copy the
bundled default:

```bash
cp ${CLAUDE_PLUGIN_ROOT}/skills/code-quality/templates/.editorconfig .editorconfig
```

The default turns on the built-in Roslyn analyzers (`dotnet_analyzer_diagnostic.severity = warning`)
and enables the complexity-flagging rules (`CA1502` "Avoid excessive complexity",
`CA1506` "Avoid excessive class coupling"). .NET has no single "max complexity 10"
knob like the source's `eslint/complexity`; these analyzer rules are the built-in
equivalent, and Roslynator (`Roslynator.Analyzers`) can be added for a dedicated
complexity rule. Keep the **max complexity 10 spirit**: refactor any method these
rules flag rather than suppressing them.

### Fix

Run all fixers (whitespace, style, analyzers) against the solution:

```bash
dotnet format
```

- Analyzer findings that cannot be auto-fixed must be resolved manually.
- **Complexity violations** (`CA1502`/`CA1506` or a Roslynator complexity rule):
  refactor the method — extract helpers, use early returns, simplify conditionals.

### Check

```bash
dotnet format --verify-no-changes
```

Exit code `0` means the code is already formatted and analyzer-clean.

---

## Frontend — ESLint + Prettier

### Configuration

Create React App ships ESLint with the `react-app` preset already wired via the
`eslintConfig` key in `package.json` — reuse it, do not add a competing config.

Prettier is **not** part of CRA. If it is absent, add it and a config so formatting
is deterministic:

```bash
npm install -D prettier
```

Create `.prettierrc.json` at the frontend root if missing:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### Lint (fix)

```bash
npx eslint --fix "src/**/*.{ts,tsx,js,jsx}"
```

Resolve any remaining errors or warnings that cannot be auto-fixed manually.

### Format (write)

```bash
npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,json}"
```

### Order

1. **Lint first** — `eslint --fix` (fixes code issues, reports what it can't).
2. **Format last** — `prettier --write` (normalizes style without changing semantics).

This order matters because the formatter may reformat the linter's fixes, but not
vice versa. It mirrors the backend order — analyzers/style fixes before the final
whitespace pass in `dotnet format`.

---

## Verification

The skill is complete when **every relevant check exits `0` with no remaining violations**:

**Backend** (if present):

```bash
dotnet format --verify-no-changes   # exit 0 — no whitespace, style, or analyzer changes needed
```

**Frontend** (if present):

```bash
npx eslint "src/**/*.{ts,tsx,js,jsx}"          # exit 0 — 0 errors and 0 warnings
npx prettier --check "src/**/*.{ts,tsx,js,jsx,css,json}"   # exit 0 — all files already formatted
```

No method flagged by the complexity analyzers remains unrefactored.
