#!/usr/bin/env bash
# Runs on PostToolUse:ExitPlanMode. Copies the most-recently-modified plan
# file from ~/.claude/plans/ into the current project's docs/plans/.
set -u

PLANS_DIR="${PLANS_DIR:-$HOME/.claude/plans}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# ponytail: mtime-based "most recent" is a global heuristic — two concurrent
# plan-mode sessions exiting within the same second could pick the wrong
# file. Upgrade path: thread the plan's own path through hook input once
# ExitPlanMode exposes it (it doesn't today).
plan_file=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1)

if [ -z "$plan_file" ]; then
  exit 0
fi

dest_dir="$PROJECT_DIR/docs/plans"
mkdir -p "$dest_dir" 2>/dev/null && cp "$plan_file" "$dest_dir/" 2>/dev/null

# A hook failing here shouldn't block the user's session.
exit 0
