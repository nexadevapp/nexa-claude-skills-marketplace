# Nexa Rules Gate

## Instructions

Before executing this skill, verify that the target project's `CLAUDE.md` contains the
Nexa workflow enforcement rules.

## How to Check

1. Read `CLAUDE.md` at the project root
2. Search for the marker `<!-- NEXA_RULES_CONFIGURED -->`

## On Pass

The marker is present. Proceed with the skill.

## On Failure

The marker is missing. **Stop immediately** and report:

```
NEXA RULES GATE — FAILED

The project's CLAUDE.md does not contain the Nexa workflow enforcement rules.
These rules ensure the AI agent follows the structured methodology and never
bypasses the requirements → specification → design → implementation pipeline.

Run /setup-project-rules first, then re-run this skill.
```

Do not proceed with the skill until the user runs `/setup-project-rules` or explicitly
waives this gate.
