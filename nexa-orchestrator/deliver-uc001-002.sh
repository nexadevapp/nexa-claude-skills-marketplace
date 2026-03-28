#!/usr/bin/env bash
export DANGEROUSLY_SKIP_PERMISSIONS=true
export MODEL=opus
export MAX_TURNS=50
./run-tasks.sh tasks-uc001-002.txt
