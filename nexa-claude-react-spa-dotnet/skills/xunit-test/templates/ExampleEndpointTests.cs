using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.Models;             // <-- adapt: your entity namespace
using MyApp.Api.Tests.Fixtures;

namespace MyApp.Api.Tests.IntegrationTests;

/// <summary>
/// Integration tests for the Examples API. Every test drives a real HTTP endpoint
/// against a real PostgreSQL database and asserts on BOTH the response and the
/// resulting database state. Nothing is mocked.
/// </summary>
public sealed class ExampleEndpointTests(PostgresContainerFixture fixture) : IntegrationTestBase(fixture)
{
    [Fact]
    public async Task GetExamples_WhenNoneExist_ReturnsEmptyList()
    {
        var response = await Client.GetAsync("/api/examples");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ExampleDto>>();
        body.Should().BeEmpty();
    }

    [Fact]
    public async Task GetExamples_ReturnsAllPersistedRecords()
    {
        // Arrange — seed directly through the real DbContext.
        await WithDbContext(async db =>
        {
            db.Set<Example>().AddRange(
                new Example { Name = "Item 1", Description = "First item" },
                new Example { Name = "Item 2", Description = "Second item" });
            await db.SaveChangesAsync();
        });

        // Act
        var response = await Client.GetAsync("/api/examples");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ExampleDto>>();
        body.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateExample_WithValidData_PersistsAndReturns201()
    {
        // Act
        var response = await Client.PostAsJsonAsync(
            "/api/examples", new { Name = "New Item", Description = "A new item" });

        // Assert response
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<ExampleDto>();
        created!.Name.Should().Be("New Item");

        // Assert it was actually persisted in the real database.
        await WithDbContext(async db =>
        {
            var stored = await db.Set<Example>().SingleOrDefaultAsync(e => e.Name == "New Item");
            stored.Should().NotBeNull();
        });
    }

    [Fact]
    public async Task CreateExample_WithInvalidData_Returns400()
    {
        var response = await Client.PostAsJsonAsync(
            "/api/examples", new { Description = "Missing required name field" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateExample_ChangesPersistedState()
    {
        Guid id = Guid.Empty;
        await WithDbContext(async db =>
        {
            var e = new Example { Name = "Before", Description = "x" };
            db.Set<Example>().Add(e);
            await db.SaveChangesAsync();
            id = e.Id;
        });

        var response = await Client.PutAsJsonAsync(
            $"/api/examples/{id}", new { Name = "After", Description = "x" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await WithDbContext(async db =>
        {
            var stored = await db.Set<Example>().FindAsync(id);
            stored!.Name.Should().Be("After");
        });
    }

    [Fact]
    public async Task DeleteExample_RemovesFromDatabase()
    {
        Guid id = Guid.Empty;
        await WithDbContext(async db =>
        {
            var e = new Example { Name = "ToDelete", Description = "x" };
            db.Set<Example>().Add(e);
            await db.SaveChangesAsync();
            id = e.Id;
        });

        var response = await Client.DeleteAsync($"/api/examples/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        await WithDbContext(async db =>
        {
            var stored = await db.Set<Example>().FindAsync(id);
            stored.Should().BeNull();
        });
    }

    // Adapt to your API's response shape.
    private sealed record ExampleDto(Guid Id, string Name, string? Description);
}
