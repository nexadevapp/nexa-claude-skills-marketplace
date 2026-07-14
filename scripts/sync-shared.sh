#!/usr/bin/env bash
#
# sync-shared.sh — keep each stack plugin's shared/ in sync with nexa-claude-core/shared.
#
# nexa-claude-core owns the shared readiness/tracking gate files. Stack plugins
# reference them via ${CLAUDE_PLUGIN_ROOT}/shared/... — but ${CLAUDE_PLUGIN_ROOT}
# resolves to the *stack plugin's* root, so each referenced file must also physically
# exist inside that plugin's shared/. This script keeps those copies identical to
# core. core is always the single source of truth — never edit the plugin copies.
#
# The set of files to mirror is derived automatically from the skills themselves: every
# ${CLAUDE_PLUGIN_ROOT}/shared/... reference in a plugin's skills is resolved against
# core. No hand-maintained manifest.
#
# Stack plugins are discovered automatically: every top-level nexa-claude-* directory
# other than nexa-claude-core that has a skills/ dir. Add a new stack plugin and it is
# covered with no edit here.
#
# Usage:
#   scripts/sync-shared.sh           # copy core -> plugins (default)
#   scripts/sync-shared.sh --check   # verify in sync; exit 1 on drift or dangling ref
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/nexa-claude-core"

MODE="sync"
if [ "${1:-}" = "--check" ]; then MODE="check"; fi

fail=0
synced=0

for plugin_dir in "$ROOT"/nexa-claude-*/; do
  plugin_dir="${plugin_dir%/}"
  name="$(basename "$plugin_dir")"
  # Skip core (the source of truth) and any dir without skills.
  [ "$name" = "nexa-claude-core" ] && continue
  [ -d "$plugin_dir/skills" ] || continue

  # Distinct shared/ files referenced by this plugin's skills via ${CLAUDE_PLUGIN_ROOT}.
  refs="$(grep -rhoE '\$\{CLAUDE_PLUGIN_ROOT\}/shared/(readiness|tracking)/[A-Z_]+\.md' \
    "$plugin_dir"/skills/*/SKILL.md 2>/dev/null \
    | sed -E 's#\$\{CLAUDE_PLUGIN_ROOT\}/##' | sort -u || true)"

  for rel in $refs; do
    core_f="$CORE/$rel"
    plugin_f="$plugin_dir/$rel"

    if [ -f "$core_f" ]; then
      # core owns this file -> plugin must hold a byte-identical copy
      if [ "$MODE" = "check" ]; then
        if ! cmp -s "$core_f" "$plugin_f"; then
          echo "DRIFT     $name/$rel (plugin copy differs from core)"
          fail=1
        fi
      else
        if ! cmp -s "$core_f" "$plugin_f" 2>/dev/null; then
          mkdir -p "$(dirname "$plugin_f")"
          cp "$core_f" "$plugin_f"
          echo "synced    $name/$rel"
          synced=$((synced + 1))
        fi
      fi
    elif [ -f "$plugin_f" ]; then
      # plugin-owned shared file (no core counterpart) — e.g. PROJECT_READINESS.md
      :
    else
      echo "DANGLING  $name/$rel (referenced but missing in both core and plugin)"
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
