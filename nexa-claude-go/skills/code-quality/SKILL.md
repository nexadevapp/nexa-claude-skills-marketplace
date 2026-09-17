---
name: code-quality
description: >
  Runs golangci-lint v2 on Go files to fix lint errors, enforce a cyclomatic complexity limit with
  gocyclo, and apply consistent formatting with gofumpt and goimports; formats templ files with
  templ fmt. Use when the user asks to "lint", "format code", "run code quality checks", "run
  golangci-lint", or mentions code quality, formatting, gofmt, or static analysis in a Go project.
---

# Code Quality — golangci-lint

## When to Apply

Run these checks after generating or modifying Go or templ files.
This applies to implementation code, test files, and any `.go` / `.templ` files.
It does **not** apply to SQL migrations, sqlc query files, or generated code
(`internal/db/`, `*_templ.go`).

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

Verify the tools are available:

```bash
golangci-lint version
go tool templ version
```

`golangci-lint` must be v2. If it is missing or v1, install the v2 binary following the official
install instructions (use the context7 MCP server) — do not add it with `go get -tool`.
If `go tool templ` fails, add it: `go get -tool github.com/a-h/templ/cmd/templ`.

## Configuration

If the project does not yet have a `.golangci.yml` at the root, create one:

```yaml
version: "2"

run:
  build-tags:
    - integration
    - e2e

linters:
  default: standard
  enable:
    - gocyclo
  settings:
    gocyclo:
      min-complexity: 10
  exclusions:
    generated: lax

formatters:
  enable:
    - gofumpt
    - goimports
  exclusions:
    generated: lax
```

`gocyclo` with `min-complexity: 10` reports every function whose cyclomatic complexity exceeds 10.
Functions over this threshold must be refactored before the task is considered complete.
`generated: lax` skips files carrying a `// Code generated ... DO NOT EDIT.` header, which covers
sqlc and templ output. `build-tags` makes the linters see the integration and E2E test files,
which are otherwise excluded by their build constraints.

If a `.golangci.yml` already exists, keep it and only add what is missing from the block above.
Confirm option names against the installed version with the context7 MCP server.

## Linting

Run golangci-lint with auto-fix over the module:

```bash
golangci-lint run --fix ./...
```

- If there are remaining issues that cannot be auto-fixed, resolve them manually.
- **Cyclomatic complexity violations** (`gocyclo`): refactor the function —
  extract helpers, use early returns, replace long `if`/`switch` chains with a lookup table,
  or simplify conditional logic.
- Never silence a finding with `//nolint` to make the run pass. A `//nolint` is acceptable only
  for a verified false positive, and it must name the linter and give the reason
  (`//nolint:gocyclo // generated dispatch table`).

## Formatting

Format Go files, then templ files:

```bash
golangci-lint fmt
go tool templ fmt .
```

If a `.templ` file changed, regenerate with `go tool templ generate` so `*_templ.go` stays in sync.

## Order

1. **Lint first** — `golangci-lint run --fix ./...` (fixes code issues, reports complexity violations)
2. **Format last** — `golangci-lint fmt` and `go tool templ fmt .` (normalize style without changing semantics)

This order matters because the formatter may reformat the linter's fixes, but not vice versa.

## Verification

The skill is complete when:

- `golangci-lint run ./...` exits with code **0** (no issues)
- `golangci-lint fmt --diff` prints nothing (all Go files already formatted)
- `go tool templ fmt -fail .` exits with code **0** (all templ files already formatted)
- No function exceeds cyclomatic complexity of 10
