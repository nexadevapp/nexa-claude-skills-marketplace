#!/usr/bin/env bash
#
# sync-shared.sh — keep nexa-claude-nextjs/shared in sync with nexa-claude-core/shared.
#
# nexa-claude-core owns the shared readiness/tracking gate files. nexa-claude-nextjs
# skills reference them via ${CLAUDE_PLUGIN_ROOT}/shared/... — but ${CLAUDE_PLUGIN_ROOT}
# resolves to the *nextjs* plugin root, so each referenced file must also physically
# exist inside nexa-claude-nextjs/shared. This script keeps those copies identical to
# core. core is always the single source of truth — never edit the nextjs copies.
#
# The set of files to mirror is derived automatically from the skills themselves: every
# ${CLAUDE_PLUGIN_ROOT}/shared/... reference in nexa-claude-nextjs/skills is resolved
# against core. No hand-maintained manifest.
#
# Usage:
#   scripts/sync-shared.sh           # copy core -> nextjs (default)
#   scripts/sync-shared.sh --check   # verify in sync; exit 1 on drift or dangling ref
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/nexa-claude-core"
NEXT="$ROOT/nexa-claude-nextjs"

MODE="sync"
if [ "${1:-}" = "--check" ]; then MODE="check"; fi

# Distinct shared/ files referenced by nextjs skills via ${CLAUDE_PLUGIN_ROOT}.
refs="$(grep -rhoE '\$\{CLAUDE_PLUGIN_ROOT\}/shared/(readiness|tracking)/[A-Z_]+\.md' \
  "$NEXT"/skills/*/SKILL.md 2>/dev/null \
  | sed -E 's#\$\{CLAUDE_PLUGIN_ROOT\}/##' | sort -u || true)"

fail=0
synced=0

for rel in $refs; do
  core_f="$CORE/$rel"
  next_f="$NEXT/$rel"

  if [ -f "$core_f" ]; then
    # core owns this file -> nextjs must hold a byte-identical copy
    if [ "$MODE" = "check" ]; then
      if ! cmp -s "$core_f" "$next_f"; then
        echo "DRIFT     $rel (nextjs copy differs from core)"
        fail=1
      fi
    else
      if ! cmp -s "$core_f" "$next_f" 2>/dev/null; then
        mkdir -p "$(dirname "$next_f")"
        cp "$core_f" "$next_f"
        echo "synced    $rel"
        synced=$((synced + 1))
      fi
    fi
  elif [ -f "$next_f" ]; then
    # nextjs-owned shared file (no core counterpart) — e.g. PROJECT_READINESS.md
    :
  else
    echo "DANGLING  $rel (referenced but missing in both core and nextjs)"
    fail=1
  fi
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
