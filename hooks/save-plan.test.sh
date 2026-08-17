#!/usr/bin/env bash
# Self-check for save-plan.sh. No framework: set -e + diff.
set -e

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

export PLANS_DIR="$tmp/plans"
export CLAUDE_PROJECT_DIR="$tmp/project"
mkdir -p "$PLANS_DIR" "$CLAUDE_PROJECT_DIR"

echo "# fake plan" > "$PLANS_DIR/some-slug.md"

bash "$(dirname "$0")/save-plan.sh"

copied="$CLAUDE_PROJECT_DIR/docs/plans/some-slug.md"
[ -f "$copied" ] || { echo "FAIL: plan was not copied to $copied"; exit 1; }
diff "$PLANS_DIR/some-slug.md" "$copied" || { echo "FAIL: copied content differs"; exit 1; }
[ -f "$PLANS_DIR/some-slug.md" ] || { echo "FAIL: original was deleted, should be a copy"; exit 1; }

echo "OK"
