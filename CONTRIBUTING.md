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

## Evaluating orchestrator skills

There is no automated test suite for skill/prompt *behavior* — `scripts/sync-shared.sh` only
catches file-identity drift in shared gate files. Orchestrator skills (multi-step pipelines with
gates, iteration caps, and rollback logic — currently `deliver-use-case`, `resolve-bug`,
`sprint-deliver`, `sprint-kickoff`, `sprint-complete`) are instead covered by written scenario
evaluations, run by a human or an agent against a real session, and graded PASS/FAIL by hand.

### Where evals live

Root-level `evals/<skill-name>/`, one directory per orchestrator skill:

```
evals/
  <skill-name>/
    EVAL-001.json   # happy path
    EVAL-002.json   # fix-loop / iteration path
    EVAL-003.json   # failure-recovery / short-circuit path
    RESULTS.md       # PASS/FAIL run log
```

### Scenario JSON shape

Each `EVAL-00N.json` is self-contained:

```json
{
  "id": "EVAL-001",
  "skill": "deliver-use-case",
  "scenario": "One-line description of what's being exercised",
  "preconditions": ["State the target project must be in before invoking the skill"],
  "input": "/slash-command ARGUMENT",
  "expected_steps": ["Ordered list of gates/steps the SKILL.md specifies, in order"],
  "expected_terminal_outcome": "What the final summary/state should look like",
  "pass_criteria": "What makes this a PASS vs a FAIL"
}
```

Ground every field in the target skill's actual `SKILL.md` — real gate names, real iteration
caps, real terminal summary columns. Don't invent steps the skill doesn't have.

### Running a scenario

1. Arrange a scratch Next.js project satisfying the scenario's `preconditions` (there is no
   committed fixture project — build or reuse a throwaway one locally).
2. Install this repo as a local marketplace in that scratch project (see "Testing your change
   locally" above) and invoke `input` as a real slash command.
3. Observe the actual session against `expected_steps` — note any skipped, reordered, or
   fabricated step.
4. Compare the actual end state (files written, spec Status, terminal summary, git state) against
   `expected_terminal_outcome` and `pass_criteria`.
5. Append one row to that skill's `RESULTS.md`: Date | Eval ID | Result (PASS/FAIL) | Notes | Run by.

### When new evals are required

Add or update a scenario whenever an orchestrator skill's gate logic, iteration cap, or
stop/rollback behavior changes — not for pure wording or formatting edits. If your PR changes an
existing gate/iteration/rollback step, re-run that skill's affected `EVAL-00N.json` scenarios (or
add a new one if no existing scenario covers the change) and log the result in `RESULTS.md` before
merging.

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](./LICENSE).
