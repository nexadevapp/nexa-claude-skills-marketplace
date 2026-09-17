---
name: setup-arch-unit
description: >
  Sets up architecture rules for a Go project with the depguard and forbidigo linters of
  golangci-lint v2. Detects the package layout, proposes a default rule set derived from the
  Nexa Go conventions (no database access outside sqlc in feature code, no HTTP or templ in services, only
  internal/config reads the environment, shared packages never import features), asks the user
  to confirm or extend it, writes the rules into .golangci.yml, and installs a git pre-commit
  hook that runs them before every commit. Use when the user asks to "set up arch-unit", "add
  architecture tests", "enforce module boundaries", "enforce package boundaries", "add an
  architecture lint", or mentions ArchUnit, depguard, import rules, dependency rules between
  packages, or layered / hexagonal architecture enforcement in Go.
---

# Setup Architecture Rules

## Instructions

Enforce the project's package boundaries as lint rules, and run them in a pre-commit hook.

Go already enforces two boundaries in the compiler: **import cycles** are a build error, and
**`internal/`** packages cannot be imported from outside their parent tree. Do not write a rule
for either. The rules here cover what the compiler allows but the Nexa conventions forbid.

The rules live in `.golangci.yml`, so every place that already runs golangci-lint enforces
them with no extra step: `/code-quality` during implementation, and the workflow from
`/setup-quality-ci` on every pull request. The pre-commit hook runs only the architecture
linters, so it stays fast.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- `go.mod` — read the `module` path; every rule below uses it in place of `example.com/app`
- golangci-lint v2 and a `.golangci.yml` with `version: "2"` — if either is missing, stop and
  tell the user to run `/code-quality` first

## DO NOT

- Add an architecture library (arch-go, go-arch-lint) — depguard and forbidigo ship with golangci-lint
- Write rules for import cycles or `internal/` visibility — the compiler enforces them
- Apply a rule to generated code (`internal/db/`, `*_templ.go`) — sqlc and templ own those imports
- Enable an opt-in rule (feature isolation, layered architecture) without the user's explicit confirmation
- Invent option names — use only what the golangci-lint v2 documentation from Step 0 shows
- Write a rule whose `files` globs match no file in the project — detect first, then write
- Skip Step 6 — a depguard rule whose globs match nothing passes silently
- Silence a violation with `//nolint` to make the first run pass
- Touch any other hook manager's configuration beyond the one block this skill owns

## Step 0: Consult Documentation

Use the context7 MCP server (library `/golangci/golangci-lint`) to confirm, for the installed
version:

1. **depguard** — `linters.settings.depguard.rules.<name>` with `list-mode`, `files`, `allow`,
   `deny` (`pkg`, `desc`); the `$all`, `$test`, and `$gostd` variables; `!` negation in `files`;
   the trailing `$` for an exact package match
2. **forbidigo** — `linters.settings.forbidigo.forbid` (`pattern`, `pkg`, `msg`) and
   `analyze-types`
3. **Exclusions** — `linters.exclusions.rules` with `path` and `linters`
4. **CLI** — `golangci-lint run --enable-only <linters>`

Prefer the documentation over the snippets below if they differ.

## Workflow

### Step 1: Gather Context

1. `go.mod` — module path and Go version
2. `.golangci.yml` — which linters are enabled; does it already have `depguard` or
   `forbidigo` settings? If yes, read them and ask whether to extend, replace, or skip
3. Package layout — `go list ./...`, then record:
   - Feature packages: `internal/<feature>/` holding `handler.go` or `service.go`
   - Shared packages that exist: `internal/auth`, `internal/config`, `internal/db`,
     `internal/i18n`, `internal/testdb`, `internal/web`, `internal/web/layout`
   - Layered folders: any `domain/`, `application/`, `infrastructure/`, `ports/`, `adapters/`
4. Hook manager — in this order: `lefthook.yml` / `lefthook.yaml`, `.pre-commit-config.yaml`,
   `git config core.hooksPath`, `.husky/`. None found → plain git hooks in `.githooks/`
5. Existing violations — for each default rule below, grep the imports it would deny so the
   Step 2 proposal can say up front which rules will fail on the first run

### Step 2: Propose the Rule Set

> **Proposed architecture rules** (Nexa Go conventions and your package layout):
>
> **Enabled by default**
> - **R1 — No database access outside sqlc in feature code.** `internal/<feature>/` must not
>   import `database/sql`, `github.com/jackc/pgx/v5/pgxpool`, `github.com/jackc/pgx/v5/stdlib`,
>   `github.com/lib/pq`, `github.com/jmoiron/sqlx`, or `gorm.io/gorm`. _Features use the sqlc
>   `db.Querier`; SQL lives in `db/queries/`. The `pgx` root package (`pgx.ErrNoRows`), `pgtype`
>   (sqlc parameter types), and `pgconn` (`*pgconn.PgError` codes) stay allowed._
> - **R2 — Services are transport-free.** `internal/*/service.go` must not import `net/http`,
>   `github.com/a-h/templ`, or `internal/web`. _Business rules must be callable from a job or a
>   CLI, and unit-testable without a request._
> - **R3 — Shared packages never import features.** `internal/auth`, `internal/config`,
>   `internal/i18n`, `internal/web/layout` must not import any feature package
>   ([detected list]). _Only `internal/web/routes.go` wires features together._
> - **R4 — Only `internal/config` reads the environment.** `os.Getenv`, `os.LookupEnv`, and
>   `os.Environ` are forbidden elsewhere (except `cmd/` and tests). _One place validates
>   configuration._
>
> **Opt-in**
> - **R5 — Feature isolation.** A feature package must not import another feature package.
>   _Shared behaviour moves to a shared package. Strict — it blocks a use case from calling
>   another use case's service._
> - **R6 — Layered architecture** [only if layered folders were detected]. `domain` imports
>   only the standard library and `domain`; `application` must not import `infrastructure` /
>   `adapters`.
>
> [If Step 1.5 found violations: "R1 will fail on the first run: `internal/item/service.go`
> imports `database/sql`."]
>
> Enable an opt-in rule, add a custom rule ("package A must not import B"), remove a default,
> or confirm?

Wait for the user. Then confirm once more:

> | Setting       | Value                                                      |
> |---------------|------------------------------------------------------------|
> | Rules         | [enabled rule IDs]                                         |
> | Config        | `.golangci.yml` (depguard, forbidigo)                      |
> | Run           | `golangci-lint run --enable-only depguard,forbidigo ./...` |
> | Pre-commit    | [lefthook / pre-commit / `.githooks/pre-commit`]           |
>
> Proceed?

### Step 3: Write the Rules

Add `depguard` and `forbidigo` to `linters.enable` and merge the settings into
`.golangci.yml`, keeping everything already there. Fill in the module path, the detected
feature packages, and only the shared packages that exist.

```yaml
linters:
  enable:
    - depguard
    - forbidigo
  settings:
    depguard:
      rules:
        # R1 — No database access outside sqlc in feature code
        r1-no-db-access-in-features:
          list-mode: lax
          files:
            - "**/internal/item/**"
            - "**/internal/order/**"
          deny:
            - pkg: database/sql$
              desc: "R1: features use the sqlc db.Querier; SQL lives in db/queries/"
            - pkg: github.com/jackc/pgx/v5/pgxpool
              desc: "R1: features use the sqlc db.Querier; SQL lives in db/queries/"
            - pkg: github.com/jackc/pgx/v5/stdlib
              desc: "R1: features use the sqlc db.Querier; SQL lives in db/queries/"
            - pkg: github.com/lib/pq
              desc: "R1: features use the sqlc db.Querier; SQL lives in db/queries/"
            - pkg: github.com/jmoiron/sqlx
              desc: "R1: features use the sqlc db.Querier; SQL lives in db/queries/"
            - pkg: gorm.io/gorm
              desc: "R1: features use the sqlc db.Querier; SQL lives in db/queries/"
        # R2 — Services are transport-free
        r2-transport-free-services:
          list-mode: lax
          files:
            - "**/internal/*/service.go"
          deny:
            - pkg: net/http$
              desc: "R2: business rules must not depend on the request; the handler parses it"
            - pkg: github.com/a-h/templ
              desc: "R2: services return data; views render it"
            - pkg: example.com/app/internal/web
              desc: "R2: services must not depend on the web layer"
        # R3 — Shared packages never import features
        r3-shared-never-imports-features:
          list-mode: lax
          files:
            - "**/internal/auth/**"
            - "**/internal/config/**"
            - "**/internal/i18n/**"
            - "**/internal/web/layout/**"
          deny:
            - pkg: example.com/app/internal/item
              desc: "R3: only internal/web/routes.go wires features together"
            - pkg: example.com/app/internal/order
              desc: "R3: only internal/web/routes.go wires features together"
    forbidigo:
      analyze-types: true
      forbid:
        # R4 — Only internal/config reads the environment
        - pattern: ^os\.(Getenv|LookupEnv|Environ)$
          msg: "R4: read configuration through internal/config"
  exclusions:
    rules:
      - path: (^|/)(internal/config|cmd)/
        linters: [forbidigo]
      - path: _test\.go$
        linters: [forbidigo]
```

`internal/db` is not in R3: it is generated, and `generated: lax` already excludes it.

Opt-in rules, only when confirmed:

- **R5** — one depguard rule per feature: `files: ["**/internal/<feature>/**"]`, `deny` every
  *other* feature package. Regenerate the list when a feature package is added
- **R6** — `files: ["**/domain/**"]`, `list-mode: strict`, `allow: [$gostd, <module>/<path>/domain]`;
  and `files: ["**/application/**"]`, `deny` the `infrastructure` / `adapters` packages

Custom rules follow the same shape: one named depguard rule, a `desc` starting with the rule ID.

### Step 4: Install the Pre-commit Hook

The hook block, delimited so a re-run replaces only these lines:

```sh
# >>> nexa arch-unit >>>
# Installed by /setup-arch-unit. Runs the architecture rules before each commit.
golangci-lint run --enable-only depguard,forbidigo ./...
# <<< nexa arch-unit <<<
```

By hook manager (Step 1.4):

- **lefthook** — add a `pre-commit.commands.nexa-arch-unit` entry with `run:` set to the command
- **pre-commit framework** — add a `repo: local` hook, `id: nexa-arch-unit`, `language: system`,
  `pass_filenames: false`, `entry:` set to the command
- **`core.hooksPath` or `.husky/` already set** — append the block to that directory's
  `pre-commit` (or replace the lines between existing markers)
- **None** — create `.githooks/pre-commit` with `#!/bin/sh`, `set -e`, and the block;
  `chmod +x .githooks/pre-commit`; run `git config core.hooksPath .githooks`. Worktrees share
  this repository setting, so `/deliver-use-case` worktrees run the hook too. A fresh clone must
  run the `git config` line once — Step 8 documents it

The hook runs on the whole module, not on staged files: an import rule is about the package
graph, and a staged-file subset would miss a violation in an unchanged file.

### Step 5: Run the Rules

```bash
golangci-lint run --enable-only depguard,forbidigo ./...
```

Outcomes:

1. **Exit 0** — go to Step 6
2. **A violation** — show it and ask whether to:
   - Fix the code (out of scope here — recommend `/implement` for a technical task)
   - Defer the rule: create a `TT-XXX` technical task for the fix and add a
     `linters.exclusions.rules` entry for exactly the violating path, with a
     `# TODO(TT-XXX)` comment. Never exclude a whole package
   - Reconsider the rule

Do not continue until the command exits 0.

### Step 6: Prove Every Rule Can Fail (mandatory)

A depguard rule whose `files` globs match nothing, or whose `pkg` is misspelled, passes forever.
For each enabled rule:

1. Confirm its `files` globs match at least one file: `git ls-files '<glob without **/ prefix>'`
2. Write a throwaway probe file in a matched package that breaks the rule and does not create
   an import cycle — e.g. R1: `internal/item/zz_archprobe.go` with `import _ "database/sql"`;
   R4: a function calling `os.Getenv("X")`
3. Run the Step 5 command and confirm it reports the probe with the rule's `desc`
4. Delete the probe file

If a probe is not reported, fix the glob or the package path and repeat. Confirm with
`git status --porcelain` that no probe file is left.

### Step 7: Run the Hook

Run the installed hook directly (`.githooks/pre-commit`, `lefthook run pre-commit`, or
`pre-commit run nexa-arch-unit --all-files`) and confirm it exits 0.

### Step 8: Update CLAUDE.md

Append to the project's `CLAUDE.md` (create it if missing). If
`<!-- NEXA_ARCH_UNIT_CONFIGURED -->` already exists, ask whether to overwrite or skip.

~~~markdown
## Architecture Rules

<!-- NEXA_ARCH_UNIT_CONFIGURED -->

- Tooling: golangci-lint `depguard` (imports) and `forbidigo` (calls), configured in `.golangci.yml`
- Run: `golangci-lint run --enable-only depguard,forbidigo ./...` — also part of every `golangci-lint run` (`/code-quality`, CI)
- Pre-commit: [hook location]; [fresh clone: `git config core.hooksPath .githooks`]
- Active rules: [rule IDs with one-line descriptions]

### Conventions
- A new feature package under `internal/` must be added to R1 and R3 (and R5 if enabled) — a package missing from `files` is unchecked
- Wire features together only in `internal/web/routes.go`
- A deferred violation is an exclusion for one path with `# TODO(TT-XXX)`, never a `//nolint`
~~~

Do not remove or modify any other content in `CLAUDE.md`.

## Verification

- `golangci-lint run --enable-only depguard,forbidigo ./...` exits 0
- Every enabled rule reported its probe in Step 6, and no probe file remains
- The pre-commit hook runs and exits 0
- `golangci-lint run ./...` still exits 0 (the full lint, as `/code-quality` runs it)

Then summarize:

```
## Architecture Rules Configured

### Rules
| ID | Rule | Status |
|----|------|--------|
| R1 | No database access outside sqlc in feature code | enabled, probe reported |
| ...                                                            |

### Files Created/Updated
| File                    | Change                                  |
|-------------------------|-----------------------------------------|
| .golangci.yml           | depguard + forbidigo rules              |
| [hook file]             | nexa arch-unit block                    |
| CLAUDE.md               | ## Architecture Rules section           |

### Deferred
- [rule, path, TT-XXX] or none

### Next Steps
- When a feature package is added, add it to the rule globs (the /implement run lints it)
- To bypass the hook once (not recommended): git commit --no-verify
```
