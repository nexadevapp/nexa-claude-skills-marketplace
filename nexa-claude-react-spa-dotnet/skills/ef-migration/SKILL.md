---
name: ef-migration
description: >
  Creates EF Core entity classes and DbContext configuration and generates
  database migrations from the entity model. Use when the user asks to "create a
  migration", "update the schema", "add an EF Core migration", "set up database
  tables", or mentions schema migration, DB migration, database versioning, or
  EF Core / DbContext schema changes.
---

# EF Core Migration

## When to use

Create or update EF Core entity classes and `DbContext` configuration, then generate a migration, based on `docs/entity_model.md`. Run this whenever the entity model changes or new entities need database tables in the .NET backend (`src/<Project>.Api/`).

## DO NOT

- Hand-edit the generated migration `*.cs`/`*.Designer.cs` files (regenerate them with `dotnet ef migrations add`)
- Drop existing tables or entities without explicit user confirmation (`dotnet ef migrations remove` / destructive `DROP`)
- Skip relations defined in the entity model
- Use auto-increment/`ValueGeneratedOnAdd()` integer keys unless the entity model explicitly requires them (prefer `Guid` primary keys with a default value strategy — `Guid.NewGuid()` on the property or `.HasDefaultValueSql("gen_random_uuid()")`)

## Nexa Rules Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/NEXA_RULES_GATE.md`.

## Sprint Branch Gate

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/readiness/SPRINT_BRANCH_GATE.md`.

## Locations

```
src/<Project>.Api/Models/           # entity classes
src/<Project>.Api/Data/<Name>Context.cs   # DbContext + Fluent API
src/<Project>.Api/Migrations/       # generated migrations
```

## Example

Entity class (data annotations for validation, `Guid` primary key):

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.Api.Models;

[Table("RoomTypes")]
public class RoomType
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public int Capacity { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
}
```

DbContext registration + Fluent API for indexes and relations:

```csharp
public DbSet<RoomType> RoomTypes { get; set; }
public DbSet<Room> Rooms { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<RoomType>(entity =>
    {
        entity.HasIndex(e => e.Name).IsUnique();
    });

    modelBuilder.Entity<Room>(entity =>
    {
        entity.HasIndex(e => e.Number).IsUnique();
        entity.HasOne(e => e.RoomType)
            .WithMany(t => t.Rooms)
            .HasForeignKey(e => e.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    });
}
```

## Process

1. Read `docs/entity_model.md`.
2. Read the existing `DbContext` and entity classes under `src/<Project>.Api/` (if they exist) to match naming, namespace, and Fluent API conventions already in use.
3. Create or update entity classes with properties, types, relations, and navigation properties. Prefer `Guid` primary keys.
4. Map entity model validation rules to EF: `[Required]`, `[StringLength]`/`HasMaxLength`, `[Column(TypeName = "...")]` or `HasPrecision` for decimals, unique indexes (`HasIndex(...).IsUnique()`), check constraints (`ToTable(t => t.HasCheckConstraint(...))`), and defaults (`HasDefaultValue`/`HasDefaultValueSql`).
5. Register each entity as a `DbSet<>` and configure relations and cardinality in `OnModelCreating` (`HasOne`/`WithMany`/`HasForeignKey`, `HasMany`/`WithMany` for many-to-many, `OnDelete` behavior).
6. Generate the migration: `dotnet ef migrations add <DescriptiveName>` (from the `src/<Project>.Api/` project directory).
7. Apply it against local PostgreSQL: `dotnet ef database update`. This requires a running local Postgres instance and a valid `ConnectionStrings:DefaultConnection` (Npgsql). If the `dotnet-ef` tool is missing, install it with `dotnet tool install --global dotnet-ef` (or add a local tool manifest via `dotnet new tool-manifest && dotnet tool install dotnet-ef`).

For current EF Core 8 / Npgsql API syntax (Fluent API, migration commands, provider options), query the **context7** MCP server rather than relying on memory.

## Verification

- Every entity and attribute from `docs/entity_model.md` has a corresponding entity class / property and a `DbSet<>`.
- Relations and cardinality (one-to-many, many-to-many, optional vs required) match the entity model, and navigation properties are present on both sides where needed.
- Types map faithfully: string lengths, decimal precision/scale, nullability, unique constraints, and check constraints reflect the model's validation rules.
- The migration was generated under `Migrations/` and `dotnet ef database update` applied cleanly against local PostgreSQL with no pending model changes (`dotnet ef migrations has-pending-model-changes` reports none).
