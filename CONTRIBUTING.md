# Contributing

Thanks for your interest in improving the Nexa Agentic Engineering Marketplace. This guide explains how the repository is organized and how to add or change a skill.

## Architecture

The marketplace is a **two-layer** design:

- **`nexa-claude-core`** — stack-agnostic SDLC methodology (vision → requirements → specs → designs → verification). It must never depend on a specific tech stack.
- **`nexa-claude-nextjs`** — the Next.js stack (implementation, testing, quality, delivery). It builds on `nexa-claude-core`.

When adding a skill, decide which layer it belongs to. Anything stack-specific goes in `nexa-claude-nextjs` (or a future stack plugin), never in core.

## Repository layout

```
.claude-plugin/marketplace.json   # lists the plugins
nexa-claude-core/
  .claude-plugin/plugin.json       # plugin metadata
  .mcp.json                        # MCP servers for this plugin
  skills/<skill-name>/SKILL.md     # one directory per skill
nexa-claude-nextjs/
  ... same structure ...
```

## Anatomy of a skill

Each skill is a directory under `skills/` containing a `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: One sentence on what it does AND when to use it. Include the trigger phrases a user would say, so the agent can route to it.
---

# My Skill

## When to use
## Process (numbered, ordered steps)
## Verification (how the agent confirms the work is done)
```

Guidelines:

- **`name`** must match the directory name exactly.
- **`description`** is how the agent discovers the skill — make it specific and include the situations/phrases that should trigger it.
- A skill is an **actionable process**, not vague advice. If it doesn't have concrete, ordered steps and a verification step, it isn't ready.
- **Don't duplicate content** between skills — reference the other skill instead.
- Reference bundled files within a plugin using `${CLAUDE_PLUGIN_ROOT}`; never hardcode an absolute or cache path.
- Bundle supporting assets (templates, examples) inside the skill directory.
- Use the `setup-` prefix for skills that establish foundational infrastructure/config/tooling (run once, occasionally re-run). All other skills use a plain name.
- **Keep `SKILL.md` under ~500 lines.** Anthropic's skill-authoring guidance loads the full `SKILL.md` body on every invocation regardless of which section is relevant, so it must stay lean. If a skill's body grows past ~500 lines, split it: keep the workflow skeleton (frontmatter, `When to use`, ordered `Process`, `Verification`) in `SKILL.md`, and extract templates, detailed examples, and edge-case tables into a single `REFERENCE.md` in the same skill directory. Link to it inline with `[REFERENCE.md](REFERENCE.md#some-heading)` at the point of use — one level deep only, no nested reference files. Any heading referenced by name from elsewhere (in-file or from another file, e.g. an `agents/*.md` prompt) must be kept as a stub in `SKILL.md`, never deleted outright. See `nexa-claude-core/skills/requirements/` or `nexa-claude-core/skills/sprint-prepare/` for worked examples of this pattern.

You can scaffold a new skill with the `write-a-skill` skill if you have it installed.

## Versioning

Do **not** add a `version` field to any `.claude-plugin/plugin.json`. It is omitted on purpose: for a git-distributed marketplace, Claude Code uses the commit SHA as the version, so every merged commit is automatically a new version. That is what makes `/plugin update` actually pull skill changes. A pinned `version` (advisory only — it never invalidates the cache on its own) would freeze users on whatever commit they first installed.

## Testing your change locally

1. Add this repo as a local marketplace in Claude Code:
   `/plugin marketplace add /path/to/nexa-claude-skills-marketplace`
2. Install the plugin you changed: `/plugin install nexa-claude-core` (and/or `nexa-claude-nextjs`).
   - For fast iteration, prefer `claude --plugin-dir /path/to/nexa-claude-skills-marketplace` and `/reload-plugins` after each edit — it loads skills straight from the source tree and sidesteps the directory-source cache staleness that a normal install can hit.
3. Invoke your skill as a slash command and confirm it behaves as documented.
4. Make sure no documentation references a skill that no longer exists, and that any new skill appears in `README.md`, `CLAUDE.md`, and the `nexa-skills` orchestrator index.

## Pull requests

- Keep changes focused; one logical change per PR.
- Update `README.md` / `CLAUDE.md` / the `nexa-skills` index when you add, rename, or remove a skill.
- Do not include references to private or third-party projects in examples — use a neutral placeholder (e.g. `ExampleApp`).

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](./LICENSE).
