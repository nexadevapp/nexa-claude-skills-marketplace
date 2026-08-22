# Nexa Rules Gate

## Instructions

Before executing this skill, verify that the target project's `CLAUDE.md` contains the
Nexa workflow enforcement rules.

## How to Check

1. Read `CLAUDE.md` at the project root
2. Search for the marker `<!-- NEXA_RULES_CONFIGURED v2 -->`

## On Pass

The marker is present. Proceed with the skill.

## On Failure

The marker is missing, or it is the older `<!-- NEXA_RULES_CONFIGURED -->` without a version.
**Stop immediately** and report:

```
NEXA RULES GATE — FAILED

The project's CLAUDE.md does not contain the current Nexa workflow enforcement rules.
These rules ensure the AI agent follows the structured methodology and never
bypasses the requirements → specification → design → implementation pipeline.

Run /setup-project-rules first, then re-run this skill.
```

An unversioned marker means the project still carries the sprint-branch rule, which no
longer matches how work is delivered. Re-running `/setup-project-rules` replaces it.

Do not proceed with the skill until the user runs `/setup-project-rules` or explicitly
waives this gate.
