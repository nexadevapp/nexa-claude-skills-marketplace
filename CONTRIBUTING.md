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

You can scaffold a new skill with the `write-a-skill` skill if you have it installed.

## Versioning

Keep the `version` field in every `.claude-plugin/plugin.json` at `1.0.0` for incremental changes. Only bump on a deliberate paradigm shift.

## Testing your change locally

1. Add this repo as a local marketplace in Claude Code:
   `/plugin marketplace add /path/to/nexa-claude-skills-marketplace`
2. Install the plugin you changed: `/plugin install nexa-claude-core` (and/or `nexa-claude-nextjs`).
3. Invoke your skill as a slash command and confirm it behaves as documented.
4. Make sure no documentation references a skill that no longer exists, and that any new skill appears in `README.md`, `CLAUDE.md`, and the `nexa-skills` orchestrator index.

## Pull requests

- Keep changes focused; one logical change per PR.
- Update `README.md` / `CLAUDE.md` / the `nexa-skills` index when you add, rename, or remove a skill.
- Do not include references to private or third-party projects in examples — use a neutral placeholder (e.g. `ExampleApp`).

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](./LICENSE).
