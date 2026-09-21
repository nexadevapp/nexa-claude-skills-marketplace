#!/usr/bin/env bash
#
# delivery-trail.sh — Nexa pre-commit gate.
#
# A specification that reaches its terminal status (UC/TT/CR: Done, BUG: Fixed)
# must ship its delivery trail. The trail is the document that ties the
# implementation back to the requirements and records the decisions taken
# during delivery: docs/delivery/<ID>-traceability.md.
#
# The gate reads the STAGED content of each spec, so it fires on the commit
# that performs the transition, not on the working tree.
#
# Install: called from the project's pre-commit hook. Bypass once (not
# recommended): git commit --no-verify
#
set -uo pipefail

SPEC_DIRS='docs/(use_cases|technical_tasks|bugs|change_requests)'
TERMINAL_STATUS='(Done|Fixed)'

missing=()

while IFS= read -r spec; do
  [ -n "$spec" ] || continue
  id=$(basename "$spec" .md)

  # The status lives in the Overview table: | **Status** | Done |
  git show ":$spec" |
    grep -qE "^\|[[:space:]]*\*\*Status\*\*[[:space:]]*\|[[:space:]]*$TERMINAL_STATUS[[:space:]]*\|" ||
    continue

  # The trail must be in the index — tracked already, or staged in this commit.
  git ls-files --error-unmatch "docs/delivery/$id-traceability.md" >/dev/null 2>&1 ||
    missing+=("$id")
done < <(git diff --cached --name-only --diff-filter=ACM |
  grep -E "^$SPEC_DIRS/(UC|TT|BUG|CR)-[0-9]{3}\.md$" || true)

if [ ${#missing[@]} -eq 0 ]; then
  exit 0
fi

for id in "${missing[@]}"; do
  echo "The delivery documents for the task [$id] are not present" >&2
done

cat >&2 <<'MSG'

Expected: docs/delivery/<ID>-traceability.md
Run the delivery-trail agent to generate the trail, then commit again.
MSG

exit 1
