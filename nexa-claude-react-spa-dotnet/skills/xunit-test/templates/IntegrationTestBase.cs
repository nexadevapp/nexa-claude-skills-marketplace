using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using MyApp.Api.Data;               // <-- adapt: your DbContext namespace

namespace MyApp.Api.Tests.Fixtures;

/// <summary>
/// Base class for real-database integration tests.
///
/// - Shares the single PostgreSQL container from PostgresContainerFixture.
/// - Resets the database (Respawn) BEFORE every test, so tests are independent
///   regardless of order and never leak state into each other.
/// - Exposes Client (real HttpClient over the in-memory API) and a scoped DbContext
///   accessor so tests can assert on the resulting DB state.
/// </summary>
[Collection("Integration")]
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected readonly PostgresContainerFixture Fixture;
    protected HttpClient Client { get; private set; } = null!;

    protected IntegrationTestBase(PostgresContainerFixture fixture) => Fixture = fixture;

    public async Task InitializeAsync()
    {
        // Clean slate before each test — replaces per-test DB mocking with a real reset.
        await Fixture.ResetDatabaseAsync();
        Client = Fixture.Factory.CreateClient();
    }

    public Task DisposeAsync()
    {
        Client.Dispose();
        return Task.CompletedTask;
    }

    /// <summary>Run an assertion (or seed) against the real DbContext outside the request pipeline.</summary>
    protected async Task WithDbContext(Func<AppDbContext, Task> action)
    {
        using var scope = Fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await action(db);
    }
}
