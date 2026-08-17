#!/usr/bin/env bash
#
# test-hooks.sh — run every hook self-check in the repo.
#
# Discovers any `*.test.sh` under a `hooks/` directory, so a new hook is picked
# up by dropping its test next to it. No framework, no dependencies.
#
# Convention for a hook test: takes no arguments, builds its own fixtures
# (mktemp -d + env var overrides), cleans up after itself, exits 0 on pass and
# non-zero on fail.
#
# Usage:
#   scripts/test-hooks.sh           # run all
#   scripts/test-hooks.sh save-plan # run only tests whose path matches
#
set -uo pipefail

cd "$(dirname "$0")/.."

filter="${1:-}"
pass=0
fail=0

while IFS= read -r t; do
  if [ -n "$filter" ] && [[ "$t" != *"$filter"* ]]; then continue; fi
  if out=$(bash "$t" 2>&1); then
    echo "PASS  $t"
    pass=$((pass + 1))
  else
    echo "FAIL  $t"
    printf '%s\n' "$out" | sed 's/^/      /'
    fail=$((fail + 1))
  fi
done < <(find . -path '*/hooks/*.test.sh' -not -path './.git/*' | sort)

echo ""
if [ "$((pass + fail))" -eq 0 ]; then
  echo "no hook tests matched${filter:+ filter '$filter'}"
  exit 1
fi

echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
