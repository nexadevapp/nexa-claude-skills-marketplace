#!/usr/bin/env bash
# ------------------------------------------------------------------
# guard-testcontainers.sh
#
# PreToolUse hook for Bash commands that run Playwright or Vitest.
# Blocks execution if DATABASE_URL is set to a remote host anywhere
# in the environment or in .env* files in the project directory.
#
# Exit 0  → allow (no remote DATABASE_URL detected)
# Exit 2  → block  (remote DATABASE_URL detected, stderr explains why)
# ------------------------------------------------------------------
set -euo pipefail

# ── 1. Read hook input from stdin ────────────────────────────────
INPUT=$(cat)
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ -z "$PROJECT_DIR" ]; then
  exit 0  # No project dir context — nothing to guard
fi

# ── 2. Collect all DATABASE_URL values to check ──────────────────
declare -a URLS_TO_CHECK=()
declare -a URL_SOURCES=()

# 2a. Current environment variable
if [ -n "${DATABASE_URL:-}" ]; then
  URLS_TO_CHECK+=("$DATABASE_URL")
  URL_SOURCES+=("environment variable DATABASE_URL")
fi

# 2b. All .env* files in the project root
for envfile in "$PROJECT_DIR"/.env "$PROJECT_DIR"/.env.*; do
  [ -f "$envfile" ] || continue
  # Extract DATABASE_URL lines, skip comments, handle quotes
  while IFS= read -r line; do
    # Strip inline comments and trim
    value=$(echo "$line" | sed 's/#.*//' | sed 's/^DATABASE_URL=//' | sed 's/^["'\'']//' | sed 's/["'\'']*$//' | xargs)
    if [ -n "$value" ]; then
      URLS_TO_CHECK+=("$value")
      URL_SOURCES+=("$(basename "$envfile")")
    fi
  done < <(grep -E '^\s*DATABASE_URL=' "$envfile" 2>/dev/null || true)
done

# ── 3. Check each URL for remote hosts ──────────────────────────
# Allowed: localhost, 127.0.0.1, [::1], empty/unset, placeholder comments
ALLOWED_HOSTS="^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$"

for i in "${!URLS_TO_CHECK[@]}"; do
  url="${URLS_TO_CHECK[$i]}"
  source="${URL_SOURCES[$i]}"

  # Skip placeholder values (contain angle brackets or "placeholder")
  if echo "$url" | grep -qiE '(<|placeholder|dynamic|set by)'; then
    continue
  fi

  # Extract host from postgresql://user:pass@HOST:port/db
  host=$(echo "$url" | sed -n 's|.*@\([^:/]*\).*|\1|p')

  if [ -z "$host" ]; then
    continue  # Can't parse host — likely a placeholder or malformed
  fi

  if ! echo "$host" | grep -qE "$ALLOWED_HOSTS"; then
    cat >&2 <<BLOCK

╔══════════════════════════════════════════════════════════════════╗
║  BLOCKED: Remote DATABASE_URL detected                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Source : $source
║  Host   : $host
║  URL    : ${url:0:60}...
║                                                                  ║
║  E2E and integration tests MUST use Testcontainers with a       ║
║  local PostgreSQL instance. The global-setup.ts file provisions  ║
║  the database automatically — no manual DATABASE_URL needed.     ║
║                                                                  ║
║  To fix:                                                         ║
║  • Remove or comment out DATABASE_URL from $source               ║
║  • Ensure .env symlinks to .env.local (not .env.development)     ║
║  • Let global-setup.ts inject DATABASE_URL dynamically           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

BLOCK
    exit 2
  fi
done

# ── 4. Verify Docker is running (Testcontainers requires it) ────
if ! docker info >/dev/null 2>&1; then
  cat >&2 <<BLOCK

╔══════════════════════════════════════════════════════════════════╗
║  BLOCKED: Docker is not running                                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Testcontainers requires Docker to provision a local PostgreSQL  ║
║  instance for E2E tests. Start Docker Desktop and try again.     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

BLOCK
  exit 2
fi

# All checks passed
exit 0
