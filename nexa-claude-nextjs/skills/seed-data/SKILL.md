---
name: seed-data
description: >
  Creates or updates the Prisma seed script (prisma/seed.ts) with production reference data
  (countries, currencies, roles, statuses, etc.). This is runtime seeding — data that must
  exist for the application to function in any environment including production.
  For test-only fixtures, use /seed-test-data instead.
  Use when the user asks to "create seed data", "add reference data", "populate lookup tables",
  or when refine-use-cases identifies reference data gaps.
user_invocable: true
arguments: optional — entity names to seed (e.g., "Country, Role, Category")
---

# Seed Data (Production Reference Data)

## Instructions

Create or update the Prisma seed script (`prisma/seed.ts`) with **production reference data**.
This is data that must exist for the application to function — lookup tables, configuration,
and reference entities.

**This skill is for production-safe data only.** For test fixtures (sample users, mock data),
use `/seed-test-data` instead.

## What Belongs Here vs. seed-test-data

| This skill (seed-data) | seed-test-data |
|------------------------|----------------|
| Countries, currencies, languages | Test users with known passwords |
| Roles, permissions | Sample organizations |
| Status enums, categories | Mock transactions/orders |
| Industry codes, priorities | Fake content for UI testing |
| **Runs in ALL environments** | **Runs in dev/test ONLY** |

## Prerequisites

- `prisma/schema.prisma` exists with defined models
- `docs/entity_model.md` exists (optional but recommended)

## Output

- `prisma/seed.ts` — The seed script (production reference data only)
- Updated `package.json` with prisma seed configuration (if not present)

## Seedable Entity Categories

| Category | Examples | Characteristics |
|----------|----------|-----------------|
| **Reference data** | Country, Currency, Language, Timezone | ISO standards, rarely changes |
| **Configuration** | Role, Permission, Status, Priority | Application-specific enums as data |
| **Lookup tables** | Industry, Department, Category | Business domain classifications |

## DO NOT

- Include test fixtures (users, sample content) — use `/seed-test-data` for those
- Hard-code environment-specific values (URLs, API keys)
- Create non-idempotent operations (use upsert, not create)
- Include any data that wouldn't be appropriate in production

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
  console.log('🌱 Seeding reference data...');

  // Reference data (order matters for relations)
  await seedCountries();
  await seedCurrencies();
  
  // Configuration data
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  
  // Lookup tables
  await seedCategories();
  await seedStatuses();

  console.log('✅ Reference data seeding complete');
}

// ── Reference Data ──────────────────────────────────────────────────

async function seedCountries() {
  const countries = [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'RO', name: 'Romania', currency: 'RON' },
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

## Workflow

1. Read `prisma/schema.prisma` to identify all models
2. Read `docs/entity_model.md` (if exists) to understand entity purposes
3. Identify reference data entities (exclude user-generated content)
4. If $ARGUMENTS specified, filter to only those entities
5. For each seedable entity:
   - Identify the unique constraint (for upsert `where` clause)
   - Determine appropriate seed values (ISO standards, business defaults)
   - Generate upsert function
6. Check if `prisma/seed.ts` exists:
   - **If exists**: Read it, add/update only new reference entities
   - **If not exists**: Create from scratch using the template
7. Check `package.json` for prisma seed configuration
8. Run `npx prisma db seed` to verify the seed works
9. Inform the user what was seeded

## Common Reference Data Sources

| Entity | Source | Notes |
|--------|--------|-------|
| Countries | ISO 3166-1 | Use alpha-2 codes (US, GB, DE) |
| Currencies | ISO 4217 | Use 3-letter codes (USD, EUR, GBP) |
| Languages | ISO 639-1 | Use 2-letter codes (en, de, fr) |
| Timezones | IANA | Use zone names (America/New_York) |

## Handling Relations

Seed in dependency order:

```typescript
// 1. Seed parent first
await seedRoles();

// 2. Then seed child that references parent
await seedPermissions();
await seedRolePermissions(); // Junction table
```
