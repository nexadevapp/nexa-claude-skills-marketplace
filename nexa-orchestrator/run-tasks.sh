#!/usr/bin/env bash
# =============================================================================
# run-tasks.sh — Run multiple Claude Code tasks sequentially with fresh context
# =============================================================================
#
# Each task runs as a separate `claude -p` invocation, which means:
#   ✅ Fresh context window per task (no bleed-through)
#   ✅ No need for /clear or /compact
#   ✅ Exit codes captured per task
#   ✅ Output logged per task
#
# USAGE:
#   ./run-tasks.sh                          # Run the TASKS array defined below
#   ./run-tasks.sh tasks.txt                # Run tasks from a file (one per line)
#   ./run-tasks.sh --json tasks.json        # Run tasks from a JSON file
#
# CONFIGURATION:
#   Edit the TASKS array below, or pass a file. Environment variables:
#     MODEL           — Model to use (default: sonnet)
#     MAX_TURNS       — Max agentic turns per task (default: 25)
#     LOG_DIR         — Where to save logs (default: .claude/task-logs)
#     STOP_ON_FAIL    — Stop all tasks if one fails (default: false)
#     PERMISSION_MODE — Permission mode (default: plan)
# =============================================================================

set -euo pipefail

# --------------- Configuration ---------------
MODEL="${MODEL:-sonnet}"
MAX_TURNS="${MAX_TURNS:-25}"
LOG_DIR="${LOG_DIR:-.claude/task-logs}"
STOP_ON_FAIL="${STOP_ON_FAIL:-false}"
PERMISSION_MODE="${PERMISSION_MODE:-plan}"
DANGEROUSLY_SKIP_PERMISSIONS="${DANGEROUSLY_SKIP_PERMISSIONS:-false}"
APPEND_PROMPT="${APPEND_PROMPT:-}"

# --------------- Define your tasks here ---------------
# Each element is one complete prompt/task for Claude Code.
# These run in order, each with a completely fresh context.
TASKS=(
  "Review all files in src/ for security vulnerabilities. Write findings to SECURITY_REVIEW.md"
  "Run the test suite with npm test. Fix any failing tests. Commit with message 'fix: resolve failing tests'"
  "Update the README.md to reflect the current project structure and API endpoints"
)

# --------------- Color helpers ---------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[FAIL]${NC}  $*"; }
log_task()  { echo -e "${CYAN}${BOLD}[TASK $1/$2]${NC} $3"; }

# --------------- Parse arguments ---------------
TASK_SOURCE="inline"
TASK_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      TASK_SOURCE="json"
      TASK_FILE="$2"
      shift 2
      ;;
    --help|-h)
      head -25 "$0" | tail -20
      exit 0
      ;;
    *)
      if [[ -f "$1" ]]; then
        TASK_SOURCE="file"
        TASK_FILE="$1"
      fi
      shift
      ;;
  esac
done

# --------------- Load tasks from file if needed ---------------
if [[ "$TASK_SOURCE" == "file" ]]; then
  TASKS=()
  while IFS= read -r line; do
    TASKS+=("$line")
  done < <(grep -v '^\s*#' "$TASK_FILE" | grep -v '^\s*$')
  log_info "Loaded ${#TASKS[@]} tasks from $TASK_FILE"
elif [[ "$TASK_SOURCE" == "json" ]]; then
  if ! command -v jq &> /dev/null; then
    log_error "jq is required for --json mode. Install with: sudo apt install jq"
    exit 1
  fi
  TASKS=()
  while IFS= read -r line; do
    TASKS+=("$line")
  done < <(jq -r '.tasks[]' "$TASK_FILE")
  log_info "Loaded ${#TASKS[@]} tasks from $TASK_FILE"
fi

# --------------- Setup ---------------
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SUMMARY_FILE="$LOG_DIR/run_${TIMESTAMP}_summary.log"
TOTAL=${#TASKS[@]}
PASSED=0
FAILED=0
SKIPPED=0

echo "═══════════════════════════════════════════════════════════" | tee "$SUMMARY_FILE"
echo " Claude Code Sequential Task Runner" | tee -a "$SUMMARY_FILE"
echo " Tasks: $TOTAL | Model: $MODEL | Max turns: $MAX_TURNS" | tee -a "$SUMMARY_FILE"
echo " Stop on fail: $STOP_ON_FAIL | Logs: $LOG_DIR" | tee -a "$SUMMARY_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$SUMMARY_FILE"
echo "" | tee -a "$SUMMARY_FILE"

# --------------- Run tasks ---------------
for i in "${!TASKS[@]}"; do
  TASK_NUM=$((i + 1))
  TASK="${TASKS[$i]}"
  TASK_LOG="$LOG_DIR/run_${TIMESTAMP}_task_${TASK_NUM}.log"
  TASK_LABEL="${TASK:0:80}"  # Truncate for display

  echo "───────────────────────────────────────────────────────" | tee -a "$SUMMARY_FILE"
  log_task "$TASK_NUM" "$TOTAL" "$TASK_LABEL"
  echo "  Started: $(date '+%H:%M:%S')" | tee -a "$SUMMARY_FILE"

  # Build the claude command
  CMD=(claude -p "$TASK"
    --model "$MODEL"
    --max-turns "$MAX_TURNS"
  )

  # Use --dangerously-skip-permissions or --permission-mode (mutually exclusive)
  if [[ "$DANGEROUSLY_SKIP_PERMISSIONS" == "true" ]]; then
    CMD+=(--dangerously-skip-permissions)
  else
    CMD+=(--permission-mode "$PERMISSION_MODE")
  fi

  # Add append prompt if set
  if [[ -n "$APPEND_PROMPT" ]]; then
    CMD+=(--append-system-prompt "$APPEND_PROMPT")
  fi

  # Run with fresh context (each -p call is a new process)
  START_TIME=$(date +%s)

  if "${CMD[@]}" > "$TASK_LOG" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_ok "Completed in ${DURATION}s"
    echo "  Status: ✅ PASSED (${DURATION}s)" >> "$SUMMARY_FILE"
    ((PASSED++))
  else
    EXIT_CODE=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_error "Failed (exit code: $EXIT_CODE) after ${DURATION}s — see $TASK_LOG"
    echo "  Status: ❌ FAILED (exit $EXIT_CODE, ${DURATION}s)" >> "$SUMMARY_FILE"
    ((FAILED++))

    if [[ "$STOP_ON_FAIL" == "true" ]]; then
      SKIPPED=$((TOTAL - TASK_NUM))
      log_warn "STOP_ON_FAIL is set. Skipping remaining $SKIPPED tasks."
      echo "  ⚠️  Stopped early — $SKIPPED tasks skipped" >> "$SUMMARY_FILE"
      break
    fi
  fi

  echo "  Log: $TASK_LOG" >> "$SUMMARY_FILE"

  # Commit any changes before starting the next task
  if ! git diff --quiet HEAD 2>/dev/null || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    log_info "Committing changes from task $TASK_NUM before proceeding..."
    # Extract UC-XXX identifier from task text if present
    UC_ID=""
    if [[ "$TASK" =~ (UC-[0-9]+) ]]; then
      UC_ID="${BASH_REMATCH[1]}"
    fi
    if [[ -n "$UC_ID" ]]; then
      COMMIT_MSG="$UC_ID (Task $TASK_NUM/$TOTAL): ${TASK_LABEL}"
    else
      COMMIT_MSG="Task $TASK_NUM/$TOTAL: ${TASK_LABEL}"
    fi
    git add -A
    git commit -m "$COMMIT_MSG" --no-verify 2>&1 | tee -a "$TASK_LOG" || true
  fi
done

# --------------- Summary ---------------
echo "" | tee -a "$SUMMARY_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$SUMMARY_FILE"
echo " RESULTS: ✅ $PASSED passed | ❌ $FAILED failed | ⏭️  $SKIPPED skipped" | tee -a "$SUMMARY_FILE"
echo " Summary: $SUMMARY_FILE" | tee -a "$SUMMARY_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$SUMMARY_FILE"

# Exit with failure if any task failed
[[ $FAILED -eq 0 ]] && exit 0 || exit 1
