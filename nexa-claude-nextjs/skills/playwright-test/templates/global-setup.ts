import { GenericContainer, Wait } from 'testcontainers';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { config as dotenvConfig } from 'dotenv';

async function globalSetup() {
  // Load all config from .env.e2e (single source of truth for test env vars)
  dotenvConfig({ path: path.join(__dirname, '..', '.env.e2e'), override: true });

  // Ryuk handles automatic cleanup of containers when the test process exits.
  process.env.TESTCONTAINERS_RYUK_DISABLED = 'false';
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '/var/run/docker.sock';

  // 1. Start PostgreSQL container on fixed port 5432 (matches .env.e2e)
  await new GenericContainer('postgres:16')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'testdb',
    })
    .withExposedPorts({ container: 5432, host: 5432 })
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections', 2),
    )
    .withStartupTimeout(60_000)
    .start();

  const databaseUrl = process.env.DATABASE_URL!;

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
}

export default globalSetup;
