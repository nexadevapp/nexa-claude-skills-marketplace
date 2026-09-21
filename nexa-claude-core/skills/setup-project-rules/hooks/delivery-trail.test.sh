#!/usr/bin/env bash
# Self-check for delivery-trail.sh. No framework: a throwaway repo + assertions.
set -e

hook="$(cd "$(dirname "$0")" && pwd)/delivery-trail.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cd "$tmp"
git init -q .
git config user.email t@t.t
git config user.name t
mkdir -p docs/use_cases docs/bugs docs/delivery

spec() { printf '| **Status** | %s |\n' "$2" > "$1"; }

run() { (cd "$tmp" && bash "$hook" 2>&1); }

# 1. An Approved spec needs no trail.
spec docs/use_cases/UC-001.md Approved
git add docs/use_cases/UC-001.md
run >/dev/null || { echo "FAIL: Approved spec was rejected"; exit 1; }

# 2. Done without a trail is rejected, and names the ID.
spec docs/use_cases/UC-001.md Done
git add docs/use_cases/UC-001.md
if out=$(run); then echo "FAIL: Done without a trail was accepted"; exit 1; fi
case "$out" in
  *"The delivery documents for the task [UC-001] are not present"*) ;;
  *) echo "FAIL: wrong message: $out"; exit 1 ;;
esac

# 3. Done with the trail staged in the same commit passes.
echo '# trail' > docs/delivery/UC-001-traceability.md
git add docs/delivery/UC-001-traceability.md
run >/dev/null || { echo "FAIL: staged trail was not accepted"; exit 1; }

# 4. A bug reaching Fixed is gated too.
spec docs/bugs/BUG-007.md Fixed
git add docs/bugs/BUG-007.md
if out=$(run); then echo "FAIL: Fixed bug without a trail was accepted"; exit 1; fi
case "$out" in
  *"[BUG-007]"*) ;;
  *) echo "FAIL: bug ID missing from message: $out"; exit 1 ;;
esac

# 5. A commit that touches no spec passes.
git commit -qm wip --no-verify
echo hi > README.md
git add README.md
run >/dev/null || { echo "FAIL: unrelated commit was rejected"; exit 1; }

echo "OK"
