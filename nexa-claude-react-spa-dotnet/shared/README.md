# Shared gate files

This directory holds the readiness/tracking gate files that `nexa-claude-react-spa-dotnet`
skills reference via `${CLAUDE_PLUGIN_ROOT}/shared/...`.

## Do not edit the synced copies

Most files here are **copies** owned by `nexa-claude-core`. They are mirrored so that
`${CLAUDE_PLUGIN_ROOT}` (which resolves to *this* plugin's root) can find them. The
single source of truth is `nexa-claude-core/shared/`.

To change a synced gate file:

1. Edit it in **`nexa-claude-core/shared/`**.
2. Run `scripts/sync-shared.sh` from the repo root.
3. Commit both the core change and the regenerated copy here.

A CI check (`.github/workflows/sync-shared.yml`) runs `scripts/sync-shared.sh --check`
on every pull request and fails if these copies drift from core, or if a skill
references a `shared/...` file that exists in neither plugin.

## Exception

`readiness/PROJECT_READINESS.md` is **owned by this plugin** — it has no counterpart in
core and is edited here directly. It describes the ASP.NET Core + React SPA cross-cutting
infrastructure (middleware pipeline, exception handling, structured logging, environment
configuration) that must exist before use-case implementation.
