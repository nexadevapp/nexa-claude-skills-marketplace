---
name: preflight
description: >
  Verifies and starts all dependencies required for running Playwright e2e tests.
  Checks Docker, starts PostgreSQL, runs migrations/seeds, starts dev server, and
  confirms health. Use when the user asks to "run preflight", "check test environment",
  "prepare for e2e tests", "start test dependencies", or before running Playwright tests.
---

# Preflight Check

## Instructions

Run preflight checks to ensure all dependencies are ready for e2e testing. This skill
verifies and starts each component, reporting clear status at each step.

## DO NOT

- Assume Docker is running without checking
- Skip health checks and proceed blindly
- Leave zombie processes running from previous test runs
- Start duplicate containers (check first, then start if missing)
- Ignore migration or seed failures

## Preflight Steps

Execute each step in order. Report status (✅ PASS / ❌ FAIL / ⏭️ SKIPPED) after each step.

---

### Step 1: Docker Daemon Check

Verify Docker is running:

```bash
docker info > /dev/null 2>&1 && echo "Docker is running" || echo "Docker is NOT running"
```

**If Docker is not running:**
- On macOS: `open -a Docker`
- On Linux: `sudo systemctl start docker`
- Wait up to 30 seconds and re-check

**FAIL if:** Docker cannot be started within 30 seconds. Report and stop.

---

### Step 2: PostgreSQL Container

Check if postgres is already running:

```bash
docker ps --filter "name=postgres" --filter "status=running" --format "{{.Names}}"
```

**If no postgres container is running:**

1. Check if `docker-compose.test.yml` exists in the project root
2. If yes: `docker compose -f docker-compose.test.yml up -d`
3. If no: Start postgres directly:

```bash
docker run -d --name postgres-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=test \
  -p 5432:5432 \
  --health-cmd="pg_isready -U postgres" \
  --health-interval=5s \
  --health-timeout=5s \
  --health-retries=5 \
  postgres:16
```

Wait for container to be healthy:

```bash
# Poll up to 30 seconds
for i in {1..6}; do
  status=$(docker inspect --format='{{.State.Health.Status}}' postgres-test 2>/dev/null)
  if [ "$status" = "healthy" ]; then
    echo "PostgreSQL is healthy"
    break
  fi
  sleep 5
done
```

**FAIL if:** Container is not healthy after 30 seconds.

---

### Step 3: Database Migrations

Run Prisma migrations to ensure schema is up to date:

```bash
npx prisma migrate deploy
```

**Expected:** Exit code 0.

**If migrations fail:**
- Check if DATABASE_URL is set correctly
- Check if postgres is accessible at the expected port
- Report the error and stop

---

### Step 4: Database Seed (Optional)

Check if seed script exists in `package.json`:

```bash
grep -q '"seed"' package.json && echo "Seed script exists" || echo "No seed script"
```

**If seed script exists:**

```bash
npx prisma db seed
```

**SKIP if:** No seed script is defined.

**Note:** Seed is idempotent if using `upsert` operations. If seed fails, report but continue.

---

### Step 5: Kill Stale Dev Server

Check for any process already using port 3000:

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

This ensures a clean dev server start.

---

### Step 6: Start Dev Server

Start the Next.js dev server in the background:

```bash
npm run dev &
DEV_PID=$!
echo "Dev server started with PID: $DEV_PID"
```

Store the PID for later cleanup if needed.

---

### Step 7: Health Check

Wait for the dev server to respond at `http://localhost:3000`:

```bash
for i in {1..12}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|304"; then
    echo "Dev server is responding"
    break
  fi
  echo "Waiting for dev server... ($i/12)"
  sleep 5
done
```

**FAIL if:** Dev server doesn't respond with 200/304 within 60 seconds.

---

## Status Report

After completing all steps, output a summary:

```
## Preflight Status

| Check              | Status |
|--------------------|--------|
| Docker Daemon      | ✅      |
| PostgreSQL         | ✅      |
| Migrations         | ✅      |
| Seed Data          | ⏭️      |
| Dev Server (3000)  | ✅      |
| Health Check       | ✅      |

All systems ready for e2e testing.
```

If any step failed:

```
## Preflight FAILED

| Check              | Status |
|--------------------|--------|
| Docker Daemon      | ✅      |
| PostgreSQL         | ❌      |
| ...                | --     |

STOPPED AT: PostgreSQL
ERROR: Container failed health check after 30 seconds.

Fix the issue and re-run /preflight.
```

## Templates

- [templates/playwright.config.partial.ts](templates/playwright.config.partial.ts) — webServer configuration snippet

## Usage

Typically run before `/playwright-test`:

```
/preflight
/playwright-test UC-001
```

Or integrated via `/deliver-use-case` which calls preflight automatically before e2e tests.
