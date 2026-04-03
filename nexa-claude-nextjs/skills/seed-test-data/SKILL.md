---
name: seed-test-data
description: >
  Creates test fixtures for development and testing environments (prisma/seed-test.ts).
  Includes sample users, mock organizations, fake transactions — data that should NEVER
  run in production. For production reference data (countries, roles), use /seed-data instead.
  Use when the user asks to "create test users", "add sample data", "populate dev database",
  or needs fixtures for integration/E2E tests.
user_invocable: true
arguments: optional — fixture types to create (e.g., "users, organizations")
---

# Seed Test Data (Development/Test Fixtures)

## Instructions

Create or update the test fixtures script (`prisma/seed-test.ts`) with sample data for
development and testing. This data helps developers see the UI with realistic content
and provides known entities for integration and E2E tests.

**This skill is for dev/test environments only.** For production reference data (countries,
roles, currencies), use `/seed-data` instead.

## What Belongs Here vs. seed-data

| seed-data (production) | This skill (seed-test-data) |
|------------------------|----------------------------|
| Countries, currencies | Test users with known passwords |
| Roles, permissions | Sample organizations |
| Status enums, categories | Mock transactions/orders |
| **Runs in ALL environments** | **Runs in dev/test ONLY** |

## Prerequisites

- `prisma/schema.prisma` exists with defined models
- Reference data seed exists (`prisma/seed.ts`) — test fixtures often depend on roles, etc.

## Output

- `prisma/seed-test.ts` — Test fixtures script
- Updated npm script for running test seeds

## Test Fixture Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Test users** | admin@example.com, user@example.com | Known credentials for manual testing and E2E |
| **Sample entities** | Sample Organization, Test Project | UI looks realistic during development |
| **Edge cases** | User with max-length name, empty org | Test boundary conditions |
| **State variations** | Active user, suspended user, pending user | Test all status states |

## DO NOT

- Include real personal data (use fake/example domains only)
- Create data that could be mistaken for production (use obvious test prefixes)
- Run in production (script must check NODE_ENV)
- Duplicate reference data (that belongs in `/seed-data`)

## Environment Guard

The script MUST refuse to run in production:

```typescript
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Test fixtures cannot run in production');
  process.exit(1);
}
```

## Test Fixtures Script Structure

```typescript
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Known test password (same for all test users)
const TEST_PASSWORD = 'TestPassword123!';

async function main() {
  // Guard against production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Test fixtures cannot run in production');
    process.exit(1);
  }

  console.log('🧪 Seeding test fixtures...');

  const passwordHash = await hash(TEST_PASSWORD, 10);

  // Test users
  await seedTestUsers(passwordHash);
  
  // Sample entities
  await seedSampleOrganizations();
  await seedSampleProjects();

  console.log('✅ Test fixtures seeding complete');
  console.log(`\n📝 Test credentials:\n   Password for all test users: ${TEST_PASSWORD}`);
}

// ── Test Users ──────────────────────────────────────────────────────

async function seedTestUsers(passwordHash: string) {
  const testUsers = [
    {
      email: 'admin@example.com',
      name: 'Test Admin',
      roleName: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      email: 'user@example.com',
      name: 'Test User',
      roleName: 'USER',
      status: 'ACTIVE',
    },
    {
      email: 'suspended@example.com',
      name: 'Suspended User',
      roleName: 'USER',
      status: 'SUSPENDED',
    },
    {
      email: 'pending@example.com',
      name: 'Pending User',
      roleName: 'USER',
      status: 'PENDING',
      emailConfirmed: false,
    },
  ];

  for (const user of testUsers) {
    const role = await prisma.role.findUnique({ where: { name: user.roleName } });
    if (!role) {
      console.warn(`  ⚠ Skipping ${user.email}: role ${user.roleName} not found`);
      continue;
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        status: user.status,
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        roleId: role.id,
        status: user.status ?? 'ACTIVE',
        emailConfirmed: user.emailConfirmed ?? true,
      },
    });
  }
  console.log(`  ✓ Test users: ${testUsers.length}`);
}

// ── Sample Organizations ────────────────────────────────────────────

async function seedSampleOrganizations() {
  const orgs = [
    {
      slug: 'acme-corp',
      name: 'Acme Corporation',
      description: 'A sample organization for testing',
    },
    {
      slug: 'test-startup',
      name: 'Test Startup Inc',
      description: 'Another sample organization',
    },
  ];

  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: { name: org.name, description: org.description },
      create: org,
    });
  }
  console.log(`  ✓ Sample organizations: ${orgs.length}`);
}

// ── Main ────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Test seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:seed": "npx prisma db seed",
    "db:seed:test": "npx tsx prisma/seed-test.ts"
  },
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

**Workflow for setting up a dev environment:**
```bash
npx prisma migrate dev     # Apply migrations
npm run db:seed            # Reference data (countries, roles)
npm run db:seed:test       # Test fixtures (test users, sample data)
```

## Workflow

1. Read `prisma/schema.prisma` to identify models that need test fixtures
2. Check that reference data seed exists (`prisma/seed.ts`)
3. If $ARGUMENTS specified, create only those fixture types
4. For each fixture type:
   - Generate realistic but obviously fake data
   - Use `@example.com` domain for emails
   - Use upsert for idempotent seeding
   - Include status variations (active, suspended, pending)
5. Check if `prisma/seed-test.ts` exists:
   - **If exists**: Add new fixtures, preserve existing
   - **If not exists**: Create from template
6. Add npm script if not present
7. Run the seed to verify it works
8. Output the test credentials for reference

## Test User Conventions

| Email | Purpose |
|-------|---------|
| `admin@example.com` | Admin role, full access |
| `user@example.com` | Regular user, standard access |
| `suspended@example.com` | Test suspended account flows |
| `pending@example.com` | Test email verification flows |
| `readonly@example.com` | Test read-only permissions |

All test users share the same password: `TestPassword123!`

## E2E Test Integration

The Playwright test skill (`/playwright-test`) uses these fixtures:
- Tests can rely on `admin@example.com` existing
- Known password means no need to create users per test (for happy paths)
- State variations allow testing error flows

For tests that need isolated users (to avoid state pollution), use the test API
endpoint pattern from `/playwright-test` instead of these shared fixtures.
