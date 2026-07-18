#!/usr/bin/env bash
# UserPromptSubmit hook: stash the raw prompt so the Stop hook can commit with it.
# cwd is the project dir. Stash inside .git so it is never itself committed.
[ -d .git ] || exit 0
node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).prompt||"")}catch{}})' \
  > .git/WORKFLOW_CONTROL_PROMPT
exit 0
