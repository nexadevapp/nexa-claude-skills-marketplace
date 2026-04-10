#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo $SCRIPT_DIR

SKILLS_DIR="$(dirname "$SCRIPT_DIR")/skills"
echo $SKILLS_DIR

META_SKILL="$SKILLS_DIR/nexa-skills/SKILL.md"

echo $META_SKILL

if [ -f "$META_SKILL" ]; then
  CONTENT=$(cat "$META_SKILL")
  # Output as JSON for Claude Code hook consumption
  cat <<EOF
{
  "priority": "IMPORTANT",
  "message": "nexa-skills loaded. Use the skill discovery flowchart to find the right skill for your task.\n\n$CONTENT"
}
EOF
else
  echo '{"priority": "INFO", "message": "nexa-skills: nexa-skills meta-skill not found. Skills may still be available individually."}'
fi
