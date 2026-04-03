import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

let container: StartedPostgreSqlContainer;

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

export async function setup() {
  // Clean up any orphaned containers from previous crashed runs
  cleanupOrphanedContainers();

  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('testdb')
    .withUsername('test')
    .withPassword('test')
    .start();

  const databaseUrl = container.getConnectionUri();

  // Make DATABASE_URL available to all test processes
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = databaseUrl;

  // Run Prisma migrations against the Testcontainer
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
}

export async function teardown() {
  await container?.stop();
}
