#!/usr/bin/env bash
#
# check-skill-inventory.sh — detect drift between the actual skill directories
# and the hand-maintained skill listings in README.md, CLAUDE.md, and the
# nexa-skills orchestrator index.
#
# The skill inventory (directory tree / Quick Reference tables) is
# hand-duplicated in three places:
#   - README.md
#   - CLAUDE.md
#   - nexa-claude-core/skills/nexa-skills/SKILL.md (Quick Reference table)
#
# This script fails when:
#   - a skill directory exists but its `/skill-name` slash command isn't
#     listed in one of the three files above (MISSING)
#   - a `/skill-name` is listed in one of the three files but no matching
#     skill directory exists — usually a stale reference left behind by a
#     rename or removal (PHANTOM)
#   - a skill's SKILL.md `name:` frontmatter doesn't match its directory
#     name (MISMATCH)
#
# Exception: `nexa-skills` is the orchestrator skill itself. It does not list
# itself as a slash command in its own Quick Reference table (nor in
# README.md/CLAUDE.md), so it is excluded from the "must be listed" check —
# but its frontmatter is still validated like any other skill.
#
# Usage:
#   scripts/check-skill-inventory.sh           # run the check (default)
#   scripts/check-skill-inventory.sh --check   # same; accepted for symmetry
#                                               # with sync-shared.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/nexa-claude-core"
NEXT="$ROOT/nexa-claude-nextjs"

README="$ROOT/README.md"
CLAUDE_MD="$ROOT/CLAUDE.md"
NEXA_SKILLS_MD="$CORE/skills/nexa-skills/SKILL.md"

LISTINGS=("$README" "$CLAUDE_MD" "$NEXA_SKILLS_MD")

# Orchestrator skill excluded from the "must appear in listings" check (see
# header comment above).
SELF_EXCLUDED="nexa-skills"

fail=0

# --- collect actual skill directories -----------------------------------
skills=()
for d in "$CORE"/skills/*/ "$NEXT"/skills/*/; do
  [ -d "$d" ] || continue
  skills+=("$(basename "$d")")
done

# --- 1. frontmatter name must match directory name ----------------------
for d in "$CORE"/skills/*/ "$NEXT"/skills/*/; do
  [ -d "$d" ] || continue
  d="${d%/}"
  dirname="$(basename "$d")"
  skill_md="$d/SKILL.md"
  rel_skill_md="${skill_md#"$ROOT"/}"

  if [ ! -f "$skill_md" ]; then
    printf '%-10s%s\n' "MISSING" "$rel_skill_md (no SKILL.md in skill directory '$dirname')"
    fail=1
    continue
  fi

  name="$(grep -m1 -E '^name:[[:space:]]*' "$skill_md" | sed -E 's/^name:[[:space:]]*//' | tr -d '[:space:]' || true)"
  if [ "$name" != "$dirname" ]; then
    printf '%-10s%s\n' "MISMATCH" "$rel_skill_md (frontmatter name '$name' != directory '$dirname')"
    fail=1
  fi
done

# --- 2. every skill (except the self-excluded orchestrator) must be listed
#        as `/skill-name` in all three files -----------------------------
for skill in "${skills[@]}"; do
  [ "$skill" = "$SELF_EXCLUDED" ] && continue
  for f in "${LISTINGS[@]}"; do
    rel_f="${f#"$ROOT"/}"
    if ! grep -qE "\`/${skill}\`" "$f"; then
      printf '%-10s%s\n' "MISSING" "$rel_f (skill '$skill' has a directory but is not listed as /$skill)"
      fail=1
    fi
  done
done

# --- 3. every `/skill-name` listed in the three files must have a matching
#        skill directory --------------------------------------------------
for f in "${LISTINGS[@]}"; do
  rel_f="${f#"$ROOT"/}"
  listed="$(grep -oE '`/[a-zA-Z][a-zA-Z0-9-]*`' "$f" | tr -d '`' | sed 's#^/##' | sort -u || true)"
  for name in $listed; do
    match=0
    for skill in "${skills[@]}"; do
      if [ "$skill" = "$name" ]; then
        match=1
        break
      fi
    done
    if [ "$match" -eq 0 ]; then
      printf '%-10s%s\n' "PHANTOM" "$rel_f (lists /$name but no matching skill directory exists)"
      fail=1
    fi
  done
done

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "Skill inventory is out of sync. Update README.md, CLAUDE.md, and"
  echo "nexa-claude-core/skills/nexa-skills/SKILL.md so every skill directory"
  echo "and every listing agree, then re-run:"
  echo "  scripts/check-skill-inventory.sh"
  exit 1
fi

echo "skill inventory in sync"
