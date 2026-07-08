using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyApp.Api.Data;               // <-- adapt: your DbContext namespace
using Npgsql;
using Respawn;
using Testcontainers.PostgreSql;

namespace MyApp.Api.Tests.Fixtures;

/// <summary>
/// Starts ONE real PostgreSQL container for the whole test collection, boots the API
/// against it via WebApplicationFactory, applies EF Core migrations once, and exposes
/// a Respawn checkpoint so each test starts from a clean database.
///
/// NEVER mock the database. Tests hit real HTTP endpoints and assert on the real
/// resulting DB state.
/// </summary>
public sealed class PostgresContainerFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .WithDatabase("testdb")
        .WithUsername("test")
        .WithPassword("test")
        .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(5432))
        .Build();

    private Respawner _respawner = null!;
    private NpgsqlConnection _connection = null!;

    public string ConnectionString => _container.GetConnectionString();

    /// <summary>The API host wired to the container database. Create clients from Factory.</summary>
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");

            // Point the app's DbContext at the container instead of the real database.
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options => options.UseNpgsql(ConnectionString));
            });
        });

        // Apply real EF Core migrations once, against the real container.
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
        }

        // Respawn resets rows between tests instead of tearing the schema down.
        _connection = new NpgsqlConnection(ConnectionString);
        await _connection.OpenAsync();
        _respawner = await Respawner.CreateAsync(_connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            // Keep EF migration history so we don't re-run migrations between tests.
            TablesToIgnore = new Respawn.Graph.Table[] { "__EFMigrationsHistory" },
        });
    }

    /// <summary>Delete all rows (keeping schema) so the next test starts clean.</summary>
    public Task ResetDatabaseAsync() => _respawner.ResetAsync(_connection);

    public async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
        await Factory.DisposeAsync();
        await _container.DisposeAsync();
    }
}

/// <summary>
/// One container is shared by every test in this collection. Put [Collection("Integration")]
/// on each integration test class (or inherit IntegrationTestBase).
/// </summary>
[CollectionDefinition("Integration")]
public sealed class IntegrationCollection : ICollectionFixture<PostgresContainerFixture>;
