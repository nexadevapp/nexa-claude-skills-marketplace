---
name: setup-arch-unit
description: >
  Sets up arch-unit-ts architectural testing for a Next.js project. Detects the
  project layout, proposes a default rule set derived from the Next.js project
  structure conventions, asks the user to confirm or extend the rules, scaffolds
  the architecture spec, and installs a dedicated Husky pre-commit hook that
  runs the rules before every commit. Use when the user asks to "set up
  arch-unit", "add architecture tests", "enforce module boundaries", "set up
  arch-unit-ts", "add an architecture lint", or mentions arch-unit, ArchUnit,
  architectural rules, dependency rules between modules, layered architecture
  enforcement, or hexagonal architecture testing in TypeScript.
---

# Setup Arch-Unit Architecture Tests

## Instructions

Install and configure arch-unit-ts so that the project's module boundaries are
enforced as part of the test suite, and wire a dedicated pre-commit hook that
runs the architecture rules on every commit.

This skill is **independent** of `setup-pre-commit`: it manages its own block
inside `.husky/pre-commit` (delimited by `# >>> nexa arch-unit >>>` markers) and
does not touch any lint-staged configuration. Running both skills on the same
project is safe.

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

The following must exist before running this skill:

- `package.json` — to determine the package manager and detect installed deps
- A Vitest setup — arch-unit-ts tests run as Vitest specs. If Vitest is not
  installed, stop and tell the user to run `/vitest-test` first or install
  Vitest manually.

If `package.json` is missing or Vitest is not installed, stop and tell the user
which prerequisite is missing.

## DO NOT

- Do not skip the verification step (Step 8) — arch-unit-ts package matchers may
  silently match zero files for folder names containing parens (route groups)
  or leading underscores (private folders). The sanity checks in the generated
  template catch this, but only if the spec is actually executed once.
- Do not modify or share configuration with the `setup-pre-commit` skill — this
  skill manages its own labeled block inside `.husky/pre-commit`.
- Do not add the architecture spec to `lint-staged` — arch-unit-ts analyzes the
  whole project, not the staged subset.
- Do not enable opt-in rule blocks (route groups, private folders, layered
  architecture) without the user's explicit confirmation.
- Do not add a CI workflow — the user has explicitly scoped this skill to
  pre-commit only.
- Do not invent package matcher patterns. Only use patterns from the
  arch-unit-ts documentation, fetched via context7 in Step 0.
- Do not generate a spec that imports paths that don't exist in the project
  (e.g. `..lib..` if there is no `lib/` folder). Detect first, then write.

## Step 0: Consult arch-unit-ts Documentation

Before writing any code, use the context7 MCP server to look up:

1. **arch-unit-ts** (library id `/arch-unit-ts/arch-unit-ts`) — confirm the
   current API for:
   - `classes()`, `noClasses()`, `Architectures.layeredArchitecture()`
   - Package matchers: `resideInAPackage`, `resideInAnyPackage`,
     `resideOutsideOfPackage` (if available)
   - Dependency matchers: `dependOnClassesThat`, `onlyDependOnClassesThat`,
     `onlyHaveDependentClassesThat`
   - `TypeScriptProject` constructor signature and exclusion patterns
   - `filterClasses(glob)` API for the fallback pattern
   - `TypeScriptClass.hasImport(name)` and `packagePath.getDotsPath()`
2. **arch-unit-ts version** — read `package.json` after installation; the import
   paths in the template (`arch-unit-ts/dist/...`) may differ across versions

If the API has changed since this skill was written, prefer what the
documentation says for the installed version over what the template shows.

## Workflow

### Step 1: Gather Context

Detect the project layout. Read or run:

1. `package.json` — record:
   - Whether `arch-unit-ts` is already a dep
   - Whether `husky` is already a dep
   - Whether Vitest is installed (look for `vitest` or `@vitest/*`)
   - The package manager (presence of `package-lock.json`, `pnpm-lock.yaml`,
     `yarn.lock`, `bun.lockb`)
2. Filesystem detection:
   - Does `src/` exist? If yes, the `TypeScriptProject` root is `src`. If no,
     the root is `.`.
   - Which of the common shared folders exist at the source root:
     `components/`, `lib/`, `hooks/`, `ui/`, `utils/`, `styles/`?
   - Does `app/` exist? List immediate children matching `(*)/` — these are
     route groups.
   - List immediate children of `app/**/` matching `_*/` — these are private
     folders.
   - Does any of these exist: `domain/`, `application/`, `infrastructure/`? If
     yes, the layered-architecture opt-in is a strong candidate.
3. Existing test file check:
   - Does `tests/architecture/architecture.test.ts` (or `.spec.ts`) already
     exist? If yes, read it and ask the user whether to overwrite, extend, or
     skip — do not overwrite silently.
4. Existing Husky setup:
   - Does `.husky/` exist? Does `.husky/pre-commit` exist? If yes, read it and
     check for an existing `# >>> nexa arch-unit >>>` block.

Record all findings before proceeding.

### Step 2: Propose Default Rule Set

Present a single proposal to the user showing what the generated test will
contain. Structure the message like this:

> **Proposed architecture rules** (based on the Next.js project structure
> conventions and what I detected in your project):
>
> **Enabled by default**
> - **R1 — Shared code must not depend on `app/`** ([SHARED_DIRS_LIST])
>   _Detected shared folders: [list]. `app/` consumes them; reversing the
>   dependency would couple them to your routes._
>
> **Opt-in (commented out in the generated file)**
> - **R2 — Route groups must not cross-import** [only show if route groups
>   detected: list them, e.g. `(marketing)`, `(shop)`]
>   _Caveat: arch-unit-ts dot-path matchers may not handle parens cleanly.
>   The generated test includes a sanity check that catches silent
>   zero-match passes; a manual fallback using `filterClasses()` is provided
>   in the file._
> - **R3 — Private folders are implementation details** [only show if `_*`
>   folders detected: list them]
>   _Same parens-style caveat applies for leading underscores._
> - **R4 — Layered / hexagonal architecture** [only show if `domain/`,
>   `application/`, or `infrastructure/` detected]
>   _Domain ⟂ application ⟂ infrastructure boundaries._
>
> **Custom rules**
> Want to add or modify anything before I generate the file? You can:
> - Enable any opt-in rule (R2/R3/R4)
> - Add a custom rule (tell me which packages must not depend on which)
> - Remove a default rule
> - Just confirm and generate

Wait for the user to respond before proceeding. Apply their changes to the
template plan.

### Step 3: Confirm Strategy

Summarize the final decisions in a compact table and ask once more before
writing files:

> **Final architecture test setup**
>
> | Setting | Value |
> |---|---|
> | Test file path | `tests/architecture/architecture.test.ts` |
> | `TypeScriptProject` root | `[. | src]` |
> | Rules enabled | [list of enabled rule IDs] |
> | npm script | `test:arch` → `vitest run tests/architecture` |
> | Pre-commit hook | dedicated block in `.husky/pre-commit` (separate from any
>   existing lint-staged setup) |
>
> Proceed?

Wait for confirmation.

### Step 4: Install Dependencies

Install `arch-unit-ts` and (if missing) `husky` as dev dependencies. Use the
detected package manager:

- `npm install -D arch-unit-ts husky`
- `pnpm add -D arch-unit-ts husky`
- `yarn add -D arch-unit-ts husky`
- `bun add -d arch-unit-ts husky`

Ask the user for confirmation before installing. Skip packages that are already
installed.

After install, re-query context7 for the installed version of arch-unit-ts to
confirm the import paths in the template are still valid.

### Step 5: Scaffold the Architecture Spec

Read the template at `${CLAUDE_PLUGIN_ROOT}/skills/setup-arch-unit/templates/architecture.test.template.ts`.

Write it to `tests/architecture/architecture.test.ts`, filling in the following
placeholders based on Step 1 detection:

| Placeholder | Replacement | Example |
|---|---|---|
| `{{SRC_ROOT}}` | `'src'` if `src/` exists, otherwise `'.'` | `'src'` |
| `{{SHARED_PACKAGES}}` | Comma-separated `'..foo..'` strings for each detected shared folder | `'..components..', '..lib..', '..hooks..'` |
| `{{SHARED_SANITY_PREDICATE}}` | JS expression on `path` that returns true for any shared package | `path.includes('.components.') \|\| path.includes('.lib.') \|\| path.includes('.hooks.')` |

For each opt-in rule the user enabled in Step 2, uncomment that block in the
generated file and parameterize it (e.g. replace `(GROUP_A)`/`(GROUP_B)` with
the actual route group names).

If the user added custom rules, append them as additional `it(...)` blocks
inside the `describe('Architecture', ...)` and clearly label them with
`// Custom rule N — <summary>` comments.

### Step 6: Add the npm Script

Read `package.json` and add a `test:arch` script to the `scripts` object:

```json
{
  "scripts": {
    "test:arch": "vitest run tests/architecture"
  }
}
```

If a `test:arch` script already exists with a different command, ask the user
whether to overwrite or rename.

Do not modify any other scripts.

### Step 7: Set Up the Pre-commit Hook

This step has two cases.

#### 7a — No `.husky/` directory

Initialize Husky:

- npm: `npx husky init`
- pnpm: `pnpm dlx husky init`
- yarn: `yarn dlx husky init`
- bun: `bunx husky init`

This creates `.husky/pre-commit` with a default `npm test` line. Replace its
contents with **only** the arch-unit block from
`${CLAUDE_PLUGIN_ROOT}/skills/setup-arch-unit/templates/precommit-block.sh`.

#### 7b — `.husky/pre-commit` exists

Read the file. Three sub-cases:

1. **No nexa arch-unit block** — append the contents of
   `templates/precommit-block.sh` to the end of the file. Preserve everything
   already in the hook.
2. **An existing nexa arch-unit block** (detect via `# >>> nexa arch-unit >>>`
   marker) — replace only the lines between the markers (inclusive) with the
   fresh block. This makes re-running the skill idempotent.
3. **No Husky setup but `.husky/pre-commit` exists from another tool** — ask
   the user whether to proceed or abort.

Make the hook executable: `chmod +x .husky/pre-commit`.

### Step 8: Run It Once to Verify (mandatory)

Execute `npm run test:arch` (or the equivalent for the detected package
manager). Three outcomes:

1. **All sanity checks pass and all rules pass** — proceed to Step 9.
2. **A sanity check fails with "should contain files, got 0"** — the dot-path
   matcher did not match a folder whose name contains parens or leading
   underscores. Tell the user and recommend the manual fallback at the bottom
   of the generated spec file (using `filterClasses()` + `hasImport()`).
   Offer to rewrite the failing rule using the fallback pattern.
3. **A rule fails with an actual architectural violation** — show the user the
   violation. Ask whether to:
   - Fix the violating code (out of scope for this skill — recommend
     `/implement` or a manual edit)
   - Mark the rule as a known follow-up (comment it out with a `// TODO:` and
     a linked technical task)
   - Reconsider whether the rule is correct

Do not declare the skill complete until the test command exits cleanly (either
all pass, or the rules causing failures are explicitly deferred with TODOs).

### Step 9: Update CLAUDE.md

Append the following section to the target project's `CLAUDE.md` (create the
file if it doesn't exist).

If a `## Architecture Tests` section already exists (check for
`<!-- NEXA_ARCH_UNIT_CONFIGURED -->`), ask the user whether to overwrite or
skip — do not silently duplicate.

~~~markdown
## Architecture Tests

<!-- NEXA_ARCH_UNIT_CONFIGURED -->

- Library: `arch-unit-ts`
- Spec file: `tests/architecture/architecture.test.ts`
- Run: `npm run test:arch` (also runs as a Vitest spec under the regular suite)
- Pre-commit: enforced via `.husky/pre-commit` (dedicated block, independent
  of any lint-staged setup)
- Active rules: [list of enabled rule IDs and one-line descriptions]

### Conventions
- New shared modules (under `components/`, `lib/`, `hooks/`, `utils/`, `ui/`)
  must never import from `app/` — only the other direction.
- When adding a new route group (`app/(group)/`), update the route-group
  cross-import rule if R2 is enabled.
- When adding a layered module (`domain/`, `application/`, `infrastructure/`),
  enable or extend R4 to reflect the new layer's allowed dependencies.
~~~

Do not remove or modify any other content in `CLAUDE.md`.

### Step 10: Summary

Present a summary of what was created:

```
## Architecture Tests Configured

### Strategy
- Library: arch-unit-ts vX.Y.Z (installed)
- Test framework: Vitest
- Active rules: [list]
- Pre-commit: dedicated block in .husky/pre-commit

### Files Created/Updated
| File | Change |
|---|---|
| tests/architecture/architecture.test.ts | created (N rules enabled) |
| package.json | added `test:arch` script |
| .husky/pre-commit | [created / appended nexa arch-unit block] |
| CLAUDE.md | appended `## Architecture Tests` section |

### Verification
- `npm run test:arch`: [X passed, Y failed]
- Sanity checks: [all matched files / N folders matched 0 files — see fallback]

### Next Steps
- To enable a commented opt-in rule (route groups, private folders, layered
  architecture), uncomment it in tests/architecture/architecture.test.ts and
  re-run `npm run test:arch`.
- The hook runs on every commit. To bypass once (not recommended), use
  `git commit --no-verify`.
- If a sanity check ever flags a zero-match folder after a project rename,
  update the matcher patterns in the spec — folder structure changes can
  silently break package patterns.
```

## Reference Templates

- **Architecture spec**: [templates/architecture.test.template.ts](templates/architecture.test.template.ts)
- **Pre-commit block**: [templates/precommit-block.sh](templates/precommit-block.sh)

### Spec Template Placeholders

| Placeholder | Description | Example |
|---|---|---|
| `{{SRC_ROOT}}` | Root path passed to `RelativePath.of()` | `'src'` or `'.'` |
| `{{SHARED_PACKAGES}}` | Comma-separated dot-path patterns for shared folders | `'..components..', '..lib..'` |
| `{{SHARED_SANITY_PREDICATE}}` | JS expression on a `path` string that returns true for any shared package | `path.includes('.components.') \|\| path.includes('.lib.')` |

## Design Decisions

### Why a separate hook block instead of integrating with `setup-pre-commit`

`setup-pre-commit` configures lint-staged for fast, staged-file-only checks
(formatter, type-check on staged files, etc.). Arch-unit-ts is fundamentally a
whole-project analysis — it must scan all files to resolve dependencies. Putting
it inside lint-staged would either (a) feed it only staged files, breaking the
analysis, or (b) run the full project scan on every staged-file invocation,
which mixes concerns.

A dedicated labeled block in `.husky/pre-commit` keeps the two concerns
independent: each skill manages only its own block, marked by
`# >>> nexa arch-unit >>>` / `# <<< nexa arch-unit <<<`. Re-running this skill
replaces only its block; re-running `setup-pre-commit` does not touch it.

### Why the spec ships with a sanity check on every rule

arch-unit-ts package matchers like `'..foo..'` are silent when they match
nothing — the rule passes vacuously and the user gains false confidence. Next.js
folder names commonly contain parens (route groups) and leading underscores
(private folders), both of which may interact unpredictably with the dot-path
matcher. The sanity check (`expect(matchedClasses.length).toBeGreaterThan(0)`)
turns a silent miss into a loud, named test failure on the very first run.

### Why no CI workflow

Explicitly scoped out by the user. The pre-commit hook is the enforcement
point. If the user later wants CI enforcement, `npm run test:arch` is already a
standalone command and can be added to any CI job manually.
