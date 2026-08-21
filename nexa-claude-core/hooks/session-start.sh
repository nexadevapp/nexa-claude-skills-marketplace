#!/bin/bash
#
# Copyright (c) 2025 Addy Osmani and the agent-skills contributors.
# Derived from agent-skills — https://github.com/addyosmani/agent-skills
# Licensed under the MIT License. See LICENSE-MIT-agent-skills and NOTICE.
#
# Modifications Copyright 2026 Nexa (nexadev.app).
# This file is derived from `hooks/session-start.sh` and has been modified
# for the Nexa Agentic Engineering methodology.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$(dirname "$SCRIPT_DIR")/skills"
META_SKILL="$SKILLS_DIR/nexa-skills/SKILL.md"

if [ -f "$META_SKILL" ]; then
  CONTENT=$(cat "$META_SKILL")
  CONTEXT=$(printf '%s' "nexa-skills loaded. Use the skill discovery flowchart to find the right skill for your task.

$CONTENT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
  cat <<EOF
{
  "systemMessage": "nexa-skills loaded — use the skill discovery flowchart to pick the right skill.",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $CONTEXT
  }
}
EOF
else
  cat <<'EOF'
{
  "systemMessage": "nexa-skills: meta-skill not found.",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "nexa-skills: nexa-skills meta-skill not found. Skills may still be available individually."
  }
}
EOF
fi
