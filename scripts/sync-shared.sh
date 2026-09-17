#!/usr/bin/env bash
#
# sync-shared.sh — keep every stack plugin's shared/ in sync with nexa-claude-core/shared.
#
# nexa-claude-core owns the shared readiness/tracking gate files. Stack plugin skills
# (nexa-claude-nextjs, nexa-claude-go, ...) reference them via ${CLAUDE_PLUGIN_ROOT}/shared/...
# — but ${CLAUDE_PLUGIN_ROOT} resolves to the *stack* plugin root, so each referenced file
# must also physically exist inside <stack>/shared. This script keeps those copies identical
# to core. core is always the single source of truth — never edit the stack copies.
#
# Stack plugins are discovered as every nexa-claude-*/ directory except core. The set of
# files to mirror is derived automatically from the skills themselves: every
# ${CLAUDE_PLUGIN_ROOT}/shared/... reference in <stack>/skills is resolved against core.
# No hand-maintained manifest.
#
# Usage:
#   scripts/sync-shared.sh           # copy core -> every stack plugin (default)
#   scripts/sync-shared.sh --check   # verify in sync; exit 1 on drift or dangling ref
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/nexa-claude-core"

MODE="sync"
if [ "${1:-}" = "--check" ]; then MODE="check"; fi

fail=0
synced=0

for STACK in "$ROOT"/nexa-claude-*/; do
  STACK="${STACK%/}"
  [ "$STACK" = "$CORE" ] && continue
  name="$(basename "$STACK")"

  # Distinct shared/ files referenced by this stack's skills via ${CLAUDE_PLUGIN_ROOT}.
  refs="$(grep -rhoE '\$\{CLAUDE_PLUGIN_ROOT\}/shared/(readiness|tracking)/[A-Z_]+\.md' \
    "$STACK"/skills/*/SKILL.md 2>/dev/null \
    | sed -E 's#\$\{CLAUDE_PLUGIN_ROOT\}/##' | sort -u || true)"

  for rel in $refs; do
    core_f="$CORE/$rel"
    stack_f="$STACK/$rel"

    if [ -f "$core_f" ]; then
      # core owns this file -> the stack must hold a byte-identical copy
      if [ "$MODE" = "check" ]; then
        if ! cmp -s "$core_f" "$stack_f"; then
          echo "DRIFT     $name/$rel (copy differs from core)"
          fail=1
        fi
      else
        if ! cmp -s "$core_f" "$stack_f" 2>/dev/null; then
          mkdir -p "$(dirname "$stack_f")"
          cp "$core_f" "$stack_f"
          echo "synced    $name/$rel"
          synced=$((synced + 1))
        fi
      fi
    elif [ -f "$stack_f" ]; then
      # stack-owned shared file (no core counterpart) — e.g. PROJECT_READINESS.md
      :
    else
      echo "DANGLING  $name/$rel (referenced but missing in both core and $name)"
      fail=1
    fi
  done
done

if [ "$MODE" = "check" ]; then
  if [ "$fail" -ne 0 ]; then
    echo ""
    echo "Shared gate files are out of sync. Fix in nexa-claude-core, then run:"
    echo "  scripts/sync-shared.sh"
    exit 1
  fi
  echo "shared gate files in sync"
else
  if [ "$fail" -ne 0 ]; then exit 1; fi
  if [ "$synced" -eq 0 ]; then echo "already in sync — nothing to copy"; fi
fi
