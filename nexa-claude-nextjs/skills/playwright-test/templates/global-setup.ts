import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync, type ChildProcess, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const STATE_FILE = path.join(__dirname, '.global-state.json');

/**
 * Clean up orphaned Testcontainers from previous crashed runs.
 * This prevents container buildup when tests are killed (SIGKILL) or crash.
 * Ryuk (Testcontainers' reaper) handles most cases, but explicit cleanup
 * catches edge cases where Ryuk didn't run.
 */
function cleanupOrphanedContainers() {
  try {
    execSync(
      'docker rm -f $(docker ps -aq --filter "label=org.testcontainers=true") 2>/dev/null || true',
      { stdio: 'pipe' }
    );
  } catch {
    // No orphaned containers or Docker not available
  }
}

async function globalSetup() {
  // 0. Clean up any orphaned containers from previous crashed runs
  cleanupOrphanedContainers();

  // 1. Start PostgreSQL Testcontainer
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer('postgres:16')
    .withDatabase('testdb')
    .withUsername('test')
    .withPassword('test')
    .start();

  const databaseUrl = container.getConnectionUri();

  // 2. Run Prisma migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  // 3. Seed the database (if seed script exists)
  try {
    execSync('npx prisma db seed', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
  } catch {
    // Seed script is optional
  }

  // 4. Start the Next.js dev server against the Testcontainer database
  const devServer: ChildProcess = spawn('npx', ['next', 'dev'], {
    env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: 'test' },
    stdio: 'pipe',
  });

  // Wait for the dev server to be ready
  await waitForServer('http://localhost:3000', 30_000);

  // 5. Save state for teardown
  writeFileSync(
    STATE_FILE,
    JSON.stringify({
      containerId: container.getId(),
      devServerPid: devServer.pid,
    }),
  );
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export default globalSetup;
