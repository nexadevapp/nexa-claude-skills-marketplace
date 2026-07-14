---
name: xunit-test
description: >
  Creates xUnit integration tests for the ASP.NET Core API that run against a REAL
  PostgreSQL database via Testcontainers and WebApplicationFactory. Use when the user
  asks to "write integration tests", "test with a real database", "create xUnit
  integration tests", or mentions Testcontainers, WebApplicationFactory, or Respawn.
  Unit tests are created by the implement skill.
---

# xUnit Integration Test (real PostgreSQL)

## When to use

Create backend integration tests for the ASP.NET Core API based on the use case `$ARGUMENTS`.
These tests boot the real API in-memory with `WebApplicationFactory<Program>`, drive real HTTP
endpoints via `factory.CreateClient()`, and assert on both the HTTP response and the resulting
database state — against a **real PostgreSQL** provisioned by Testcontainers.

- **Unit tests** (isolated service/domain logic, mocked collaborators) are produced by the
  `/implement` skill and live under `Tests/UnitTests/`. This skill does NOT write those.
- **Frontend component tests** (Jest + React Testing Library) also belong to `/implement`.
- **This skill** is real-database integration tests only — `Tests/IntegrationTests/`.

Use the **context7** MCP server for current `Testcontainers.PostgreSql`, `WebApplicationFactory`,
`Respawn`, and EF Core 8 docs rather than relying on memory — these APIs change between versions.

## DO NOT

- **Mock the database.** Integration tests use a real PostgreSQL via Testcontainers.
- Use `EntityFrameworkCore.InMemory` or a mocked `DbContext` — a real container is the point.
- Test implementation details (test behavior through the HTTP boundary, not internals).
- Hard-code connection strings — the container's connection string is injected into the app.
- Skip error/authorization/validation cases (400/401/403/404), not just the happy path.

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Tracking

Update `${CLAUDE_PLUGIN_ROOT}/shared/tracking/TRACKING.md` per its own instructions.

## Test Data Conventions

- Use only `example.com` for test emails and accounts (e.g., `user@example.com`,
  `admin@example.com`). This is an IANA-reserved domain that will never route real mail.

## Prerequisites

- **Docker must be running** — Testcontainers spins up a `postgres:16` container.
- On **Colima / Podman / rootless** engines, the Testcontainers "Ryuk" reaper can fail to bind-mount
  the docker socket (`invalid mount ... operation not supported`). Set `TESTCONTAINERS_RYUK_DISABLED=true`
  in the test environment (Docker Desktop does not need this).
- The test project (`src/<Project>.Api.Tests/`) references the API project and needs these packages.

> **Pin versions to the framework — do NOT install these unpinned.** On a .NET 8 / EF Core 8 project,
> `dotnet add package` grabs the latest major, which silently breaks the build or runtime:
> - **Do not add `Npgsql` directly at all.** It comes transitively (at the correct 8.0.x) via
>   `Npgsql.EntityFrameworkCore.PostgreSQL`. Adding it unpinned resolves **Npgsql 9/10** (note: the EF
>   provider is versioned `8.0.10` but its Npgsql dependency is `8.0.5` — the numbers do NOT match, and
>   Npgsql 8.x has no `8.0.10`), and a mismatched Npgsql throws `TypeLoadException: HackyEnumTypeMapping`
>   at runtime. The fixture's `new NpgsqlConnection(...)` uses the transitive version — that is correct.
> - **`Microsoft.AspNetCore.Mvc.Testing`** unpinned pulls a net9/net10-only build. Pin to the app's major.
> - **`Respawn`** latest requires Npgsql ≥ 9. Pin to `6.*` for Npgsql 8.
> - **`FluentAssertions` v8+ requires a paid commercial license** (Xceed). Pin to `6.*` (MIT) or use
>   xUnit's built-in `Assert` instead — do not ship v8 into a commercial project.

```bash
# Versions shown are for .NET 8 / EF Core 8. Confirm current compatible versions via context7.
dotnet add src/<Project>.Api.Tests package Microsoft.AspNetCore.Mvc.Testing --version 8.0.*
dotnet add src/<Project>.Api.Tests package Testcontainers.PostgreSql
dotnet add src/<Project>.Api.Tests package Respawn --version 6.*
dotnet add src/<Project>.Api.Tests package FluentAssertions --version 6.*   # v8+ is non-free for commercial use
dotnet add src/<Project>.Api.Tests package coverlet.collector              # coverage
# Do NOT add Npgsql directly — it is transitive via the EF Core provider at the correct version.
```

> `Program` must be reachable from the test project. If the API uses top-level statements,
> add `public partial class Program;` at the end of `Program.cs` (or expose it via
> `InternalsVisibleTo`) so `WebApplicationFactory<Program>` can bind to it.

## Container fixture + reset

The infrastructure lives in `Tests/Fixtures/`. Create it once, reuse across every test class.

If `Fixtures/PostgresContainerFixture.cs` does not exist, create it from
[templates/PostgresContainerFixture.cs](templates/PostgresContainerFixture.cs). It:

1. Starts ONE `postgres:16` container for the whole test collection (`ICollectionFixture`).
2. Boots the API via `WebApplicationFactory<Program>`, **removing the app's
   `DbContextOptions<AppDbContext>` registration and re-registering `UseNpgsql(container)`** so
   the real app runs against the container.
3. Applies real EF Core migrations once (`db.Database.MigrateAsync()`).
4. Builds a **Respawn** checkpoint (ignoring `__EFMigrationsHistory`) to reset rows between tests.

If `Fixtures/IntegrationTestBase.cs` does not exist, create it from
[templates/IntegrationTestBase.cs](templates/IntegrationTestBase.cs). It resets the database
(Respawn) **before every test**, exposes a ready `HttpClient`, and a `WithDbContext(...)` helper
for asserting on real DB state.

Adapt `MyApp.Api` / `AppDbContext` in the templates to the actual project namespace and
`DbContext` type.

## Test data strategy

| Approach          | Where                                   | Purpose                        |
|-------------------|-----------------------------------------|--------------------------------|
| Respawn reset     | `IntegrationTestBase.InitializeAsync`   | Clean DB before every test     |
| DbContext seeding | `WithDbContext(db => ...)` in Arrange   | Test-specific baseline rows    |
| Endpoint seeding  | `POST` via `Client` in Arrange          | Exercise the real create path  |
| Test helpers      | `Tests/TestHelpers.cs` (extensions)     | Reusable auth/seed shortcuts   |

For authenticated endpoints, add an extension like `CreateAuthenticatedClientAsync(this
WebApplicationFactory<Program>, string email)` to `TestHelpers.cs` that logs in and sets the
bearer token, then create clients through it.

## Templates

- Container + Respawn fixture: [templates/PostgresContainerFixture.cs](templates/PostgresContainerFixture.cs)
- Base test class (per-test reset): [templates/IntegrationTestBase.cs](templates/IntegrationTestBase.cs)
- Endpoint test example: [templates/ExampleEndpointTests.cs](templates/ExampleEndpointTests.cs)

## Common patterns

### API controller endpoint tests

```csharp
public sealed class CompaniesEndpointTests(PostgresContainerFixture fixture)
    : IntegrationTestBase(fixture)
{
    [Fact]
    public async Task GetCompanies_WithoutToken_Returns401()
    {
        var response = await Client.GetAsync("/api/companies");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateCompany_WithValidData_PersistsAndReturns201()
    {
        using var client = await Fixture.Factory.CreateAuthenticatedClientAsync("consultant@example.com");

        var response = await client.PostAsJsonAsync("/api/companies",
            new { Name = "Acme", PrimaryLocation = "Boston, MA", Industry = "Software", EmployeeCount = 50 });

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        await WithDbContext(async db =>
            (await db.Set<Company>().AnyAsync(c => c.Name == "Acme")).Should().BeTrue());
    }
}
```

### Request-pipeline / behavior tests

Because the real app runs, any pipeline component is exercisable end-to-end: authentication
(401 without token), authorization (403 for the wrong role), model validation (400), and
not-found paths (404). Assert on the HTTP `StatusCode` plus the resulting DB state via
`WithDbContext`.

## Assertions reference (FluentAssertions)

| Assertion type   | Example                                                            |
|------------------|-------------------------------------------------------------------|
| HTTP status      | `response.StatusCode.Should().Be(HttpStatusCode.OK)`              |
| Deserialized DTO | `(await response.Content.ReadFromJsonAsync<Dto>())!.Name.Should().Be("x")` |
| Collection count | `body.Should().HaveCount(2)`                                     |
| Empty            | `body.Should().BeEmpty()`                                         |
| DB persistence   | `(await db.Set<T>().AnyAsync(...)).Should().BeTrue()`            |
| Not null         | `stored.Should().NotBeNull()`                                    |
| Exception        | `await act.Should().ThrowAsync<T>()`                            |

## Process

1. Read the use case specification for `$ARGUMENTS`.
2. Use TodoWrite to create a task per test scenario (happy path + each error/authorization path).
3. Ensure the test project references the packages listed under **Prerequisites**; add missing ones.
4. Ensure `Fixtures/PostgresContainerFixture.cs` exists; create from template if missing, adapting namespace and `DbContext` type.
5. Ensure `Fixtures/IntegrationTestBase.cs` exists; create from template if missing.
6. Create the test class under `Tests/IntegrationTests/`, inheriting `IntegrationTestBase`, using the example template as a starting point.
7. For each test:
   - Reset is automatic (Respawn, before every test) — start from an empty DB.
   - Arrange test data via `WithDbContext(...)` or by calling real endpoints through `Client`.
   - Act: call the real HTTP endpoint (`GET`/`POST`/`PUT`/`DELETE`) via `Client`.
   - Assert on the response status/DTO **and** the resulting DB state.
8. Never mock the database or use the InMemory provider — the container is the source of truth.
9. Run the `/code-quality` skill.
10. Run tests: `dotnet test`. Passing = **0 failed**.
11. Run with coverage: `dotnet test --collect:"XPlat Code Coverage"`.
    - Enforce the **80%** threshold. Either fail the run via coverlet's msbuild integration
      (`dotnet test /p:CollectCoverage=true /p:Threshold=80 /p:ThresholdType=line%2cbranch%2cmethod`
      with the `coverlet.msbuild` package), or generate a report from the collected Cobertura XML
      and check line/branch coverage.
    - If any metric is below 80%, add tests until thresholds are met — focus on uncovered branches
      and endpoints first.
12. If a test fails:
    - Confirm Docker is running and the container started.
    - Confirm EF Core migrations applied (`db.Database.MigrateAsync()` succeeded).
    - Confirm `async` operations are awaited and Respawn ignores `__EFMigrationsHistory`.
    - Confirm `Program` is reachable (`public partial class Program;` for top-level statements).
13. Mark todos complete.

## Verification

- Every scenario from the use case (happy path + each error/authorization branch) has a `[Fact]`.
- Tests run against a real PostgreSQL container — no mocked `DbContext`, no InMemory provider.
- Each test asserts on the HTTP response **and** the resulting DB state where applicable.
- `dotnet test` reports 0 failed.
- Coverage is at or above 80% on line and branch metrics for the code under test.
- `/code-quality` passes.

## Resources

- Use the **context7** MCP server for `Testcontainers.PostgreSql`, `WebApplicationFactory`,
  `Respawn`, and EF Core 8 documentation.
