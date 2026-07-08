import { GenericContainer, Wait } from 'testcontainers';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { config as dotenvConfig } from 'dotenv';

/**
 * Starts a PostgreSQL Testcontainer, applies the ASP.NET Core API's EF Core
 * migrations against it, and seeds baseline data. The two dev servers (API +
 * SPA) are started separately by Playwright's `webServer` array — this file
 * only owns the database.
 *
 * If Docker is not running, Testcontainers throws here and the whole run
 * aborts. That is intentional: never skip database-dependent tests.
 */
async function globalSetup() {
  // Load all config from .env.e2e (single source of truth for test env vars)
  dotenvConfig({ path: path.join(__dirname, '..', '.env.e2e'), override: true });

  // Ryuk handles automatic cleanup of the container when the process exits.
  process.env.TESTCONTAINERS_RYUK_DISABLED = 'false';
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '/var/run/docker.sock';

  // 1. Start PostgreSQL on fixed port 5432 (matches ConnectionStrings__Default in .env.e2e)
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

  // The API reads its connection string from ConnectionStrings__Default.
  const apiEnv = { ...process.env, ASPNETCORE_ENVIRONMENT: 'Test' };

  // 2. Apply EF Core migrations against the container.
  //    Requires `dotnet tool install --global dotnet-ef` (or a local manifest).
  //    Alternative: have the API auto-migrate on startup (context.Database.Migrate())
  //    when ASPNETCORE_ENVIRONMENT=Test, and drop this step.
  execSync('dotnet ef database update --project src/<Project>.Api', {
    env: apiEnv,
    stdio: 'pipe',
  });

  // 3. Seed baseline (non-user) reference data. Optional — remove if the API
  //    seeds on startup. Adjust the command to your project's seeder.
  try {
    execSync('dotnet run --project src/<Project>.Api --no-launch-profile -- seed', {
      env: apiEnv,
      stdio: 'pipe',
    });
  } catch {
    // Seed command is optional.
  }
}

export default globalSetup;
