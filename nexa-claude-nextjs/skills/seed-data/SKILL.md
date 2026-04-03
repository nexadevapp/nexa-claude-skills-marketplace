---
name: seed-data
description: >
  Creates or updates the Prisma seed script (prisma/seed.ts) with reference data and
  test fixtures. Reads the entity model to identify seedable entities (countries, roles,
  categories, statuses, etc.) and generates idempotent upsert statements.
  Use when the user asks to "create seed data", "add reference data", "populate the
  database", "create test fixtures", or when refine-use-cases identifies seed data gaps.
user_invocable: true
arguments: optional — entity names to seed (e.g., "Country, Role, Category")
---

# Seed Data

## Instructions

Create or update the Prisma seed script (`prisma/seed.ts`) with reference data and test fixtures.
The seed script populates the database with baseline data needed for the application to function
and for tests to run.

If $ARGUMENTS is provided, seed only the specified entities. Otherwise, analyze the entity model
and seed all seedable entities.

## Prerequisites

- `prisma/schema.prisma` exists with defined models
- `docs/entity_model.md` exists (optional but recommended for understanding entity purpose)

## Output

- `prisma/seed.ts` — The seed script
- Updated `package.json` with prisma seed configuration (if not present)

## Seedable Entity Categories

| Category | Examples | Characteristics |
|----------|----------|-----------------|
| **Reference data** | Country, Currency, Language, Timezone | Rarely changes, often ISO standards |
| **Configuration** | Role, Permission, Status, Category | Application-specific enums as data |
| **Lookup tables** | Industry, Department, Priority | Business domain classifications |
| **Test fixtures** | Sample User, Sample Organization | Dev/test environment data only |

## DO NOT

- Seed user-generated content (orders, posts, comments)
- Hard-code environment-specific values (URLs, API keys)
- Create non-idempotent operations (use upsert, not create)
- Seed production-inappropriate data in the default seed (keep test fixtures separate)
- Skip null checks for optional relations

## Idempotent Upsert Pattern

All seed operations MUST be idempotent — running the seed multiple times produces the same result.

```typescript
// ✅ Correct: upsert with unique identifier
await prisma.country.upsert({
  where: { code: 'US' },
  update: {}, // No update needed for reference data
  create: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
  },
});

// ❌ Wrong: create throws on duplicate
await prisma.country.create({
  data: { code: 'US', name: 'United States' },
});
```

## Seed Script Structure

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Reference data (order matters for relations)
  await seedCountries();
  await seedCurrencies();
  
  // 2. Configuration data
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  
  // 3. Lookup tables
  await seedCategories();
  await seedStatuses();
  
  // 4. Test fixtures (dev/test only)
  if (process.env.NODE_ENV !== 'production') {
    await seedTestUsers();
    await seedTestOrganizations();
  }

  console.log('✅ Seeding complete');
}

// ── Reference Data ──────────────────────────────────────────────────

async function seedCountries() {
  const countries = [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    // Add more as needed
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log(`  ✓ Countries: ${countries.length}`);
}

// ── Configuration Data ──────────────────────────────────────────────

async function seedRoles() {
  const roles = [
    { name: 'ADMIN', description: 'System administrator' },
    { name: 'USER', description: 'Regular user' },
    { name: 'MODERATOR', description: 'Content moderator' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log(`  ✓ Roles: ${roles.length}`);
}

// ── Test Fixtures ───────────────────────────────────────────────────

async function seedTestUsers() {
  // Only for dev/test environments
  const testUsers = [
    {
      email: 'admin@example.com',
      name: 'Test Admin',
      role: 'ADMIN',
    },
    {
      email: 'user@example.com', 
      name: 'Test User',
      role: 'USER',
    },
  ];

  for (const user of testUsers) {
    const role = await prisma.role.findUnique({ where: { name: user.role } });
    if (!role) continue;

    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: {
        email: user.email,
        name: user.name,
        roleId: role.id,
        // Use a known test password hash or leave auth to the auth system
      },
    });
  }
  console.log(`  ✓ Test users: ${testUsers.length}`);
}

// ── Main ────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## package.json Configuration

Ensure `package.json` has the prisma seed configuration:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

If using `ts-node` instead of `tsx`:

```json
{
  "prisma": {
    "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

## Workflow

1. Read `prisma/schema.prisma` to identify all models
2. Read `docs/entity_model.md` (if exists) to understand entity purposes
3. Categorize entities into: reference data, configuration, lookup tables, user-generated
4. If $ARGUMENTS specified, filter to only those entities
5. For each seedable entity:
   - Identify the unique constraint (for upsert `where` clause)
   - Determine appropriate seed values (ISO standards, business defaults, etc.)
   - Generate upsert function
6. Check if `prisma/seed.ts` exists:
   - **If exists**: Read it and add/update only the new entities, preserving existing seeds
   - **If not exists**: Create from scratch using the template
7. Check `package.json` for prisma seed configuration:
   - **If missing**: Add the configuration
8. Run `npx prisma db seed` to verify the seed works
9. Inform the user what was seeded:

> **Seed script updated: `prisma/seed.ts`**
>
> **Seeded entities:**
> - Countries (250 records)
> - Roles (3 records)
> - Test users (2 records, dev/test only)
>
> **Run manually:** `npx prisma db seed`

## Common Reference Data Sources

| Entity | Source | Notes |
|--------|--------|-------|
| Countries | ISO 3166-1 | Use alpha-2 codes (US, GB, DE) |
| Currencies | ISO 4217 | Use 3-letter codes (USD, EUR, GBP) |
| Languages | ISO 639-1 | Use 2-letter codes (en, de, fr) |
| Timezones | IANA | Use zone names (America/New_York) |

## Handling Relations

When seeding entities with relations, seed in dependency order:

```typescript
// 1. Seed parent first
await seedRoles();

// 2. Then seed child that references parent
await seedUsers(); // Users have roleId FK
```

For many-to-many relations, seed the junction table after both sides:

```typescript
await seedRoles();
await seedPermissions();
await seedRolePermissions(); // Junction table
```

## Environment-Specific Seeding

```typescript
// Production-safe reference data
await seedCountries();
await seedCurrencies();

// Dev/test only
if (process.env.NODE_ENV !== 'production') {
  await seedTestUsers();
  await seedSampleData();
}

// Staging-specific (optional)
if (process.env.NODE_ENV === 'staging') {
  await seedDemoData();
}
```
