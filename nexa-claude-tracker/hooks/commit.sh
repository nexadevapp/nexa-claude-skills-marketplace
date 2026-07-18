#!/usr/bin/env bash
# Stop hook: stage everything and commit as "prompt: <the prompt>".
# Command substitution passes the message as one arg, so quotes/newlines are safe.
# Commit failures (nothing staged, failing pre-commit hook) are swallowed: the
# changes simply stay uncommitted and the next prompt retries.
# ponytail: assumes .git is a directory; git worktrees/submodules skipped.
f=.git/WORKFLOW_CONTROL_PROMPT
[ -f "$f" ] || exit 0
git add -A
git commit -m "prompt: $(cat "$f")" >/dev/null 2>&1 || true
rm -f "$f"
exit 0
