// E2E Test User API — TEST-ONLY endpoint for provisioning Playwright users.
//
// This is the ASP.NET Core analog of the Next.js `POST/DELETE /api/e2e/users`
// route. It lets Playwright provision and clean up users WITHOUT touching the
// database directly.
//
// GUARDED so it is only active when ASPNETCORE_ENVIRONMENT=Test:
//   - Each action returns 404 outside the Test environment (defense in depth,
//     mirrors the Next.js `guardTestEnv()` pattern).
//   - For stronger isolation you may additionally register it conditionally in
//     Program.cs — see the note at the bottom.
//
// Passwords are hashed with the app's REAL IPasswordHasher<User> so that a UI
// login verifies against exactly the same hash the app would have produced.
//
// Place at: src/<Project>.Api/Controllers/E2EUsersController.cs
// Adjust namespace, DbContext, and User entity to match your project.

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Data;    // your DbContext
using MyApp.Api.Models;  // your User entity

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/e2e/users")]
public sealed class E2EUsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _hasher;
    private readonly IWebHostEnvironment _env;

    public E2EUsersController(AppDbContext db, IPasswordHasher<User> hasher, IWebHostEnvironment env)
    {
        _db = db;
        _hasher = hasher;
        _env = env;
    }

    public sealed record CreateUserRequest(
        string Email,
        string Password,
        string? AccountType,
        string? Status,
        bool? EmailConfirmed);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest body)
    {
        if (!_env.IsEnvironment("Test")) return NotFound();

        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { error = "email and password are required" });

        // Adjust field names to match your User entity.
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = body.Email,
            AccountType = body.AccountType ?? "BUYER",
            Status = body.Status ?? "ACTIVE",
            EmailConfirmed = body.EmailConfirmed ?? true,
            ConsentTerms = true,
            ConsentPrivacy = true,
            ConsentMarketing = true,
            AuthProvider = "EMAIL",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        // Hash with the app's REAL hasher — login must verify identically.
        user.PasswordHash = _hasher.HashPassword(user, body.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Response is camelCased by default (id, accountType, status) — matches test-user.ts.
        return Created($"/api/e2e/users/{user.Id}",
            new { id = user.Id, email = user.Email, accountType = user.AccountType, status = user.Status });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!_env.IsEnvironment("Test")) return NotFound();

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // If cascade delete is not configured on the relations, remove related
        // records first (adjust to your schema):
        //   _db.Orders.RemoveRange(_db.Orders.Where(o => o.UserId == id));
        //   _db.Sessions.RemoveRange(_db.Sessions.Where(s => s.UserId == id));

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return Ok(new { deleted = true });
    }
}

// ── Program.cs (optional stronger guard) ────────────────────────────────────
//
// The action-level env check above is sufficient. If you also want the routes
// to simply not exist outside Test, exclude this controller's application part
// when not in the Test environment:
//
//   var mvc = builder.Services.AddControllers();
//   if (!builder.Environment.IsEnvironment("Test"))
//   {
//       mvc.PartManager.FeatureProviders.Add(new ExcludeE2EControllersFeatureProvider());
//   }
//
// where the provider drops any controller whose name starts with "E2E".
