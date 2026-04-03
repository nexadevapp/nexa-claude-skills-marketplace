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

  // ── Test Users ──────────────────────────────────────────────────────
  // await seedTestUsers(passwordHash);

  // ── Sample Entities ─────────────────────────────────────────────────
  // await seedSampleOrganizations();
  // await seedSampleProjects();

  console.log('✅ Test fixtures seeding complete');
  console.log(`\n📝 Test credentials:\n   Password for all test users: ${TEST_PASSWORD}`);
}

// ── Example: Test Users ─────────────────────────────────────────────────

// async function seedTestUsers(passwordHash: string) {
//   const testUsers = [
//     {
//       email: 'admin@example.com',
//       name: 'Test Admin',
//       roleName: 'ADMIN',
//       status: 'ACTIVE',
//     },
//     {
//       email: 'user@example.com',
//       name: 'Test User',
//       roleName: 'USER',
//       status: 'ACTIVE',
//     },
//     {
//       email: 'suspended@example.com',
//       name: 'Suspended User',
//       roleName: 'USER',
//       status: 'SUSPENDED',
//     },
//   ];
//
//   for (const user of testUsers) {
//     const role = await prisma.role.findUnique({ where: { name: user.roleName } });
//     if (!role) {
//       console.warn(`  ⚠ Skipping ${user.email}: role ${user.roleName} not found`);
//       continue;
//     }
//
//     await prisma.user.upsert({
//       where: { email: user.email },
//       update: { name: user.name, passwordHash },
//       create: {
//         email: user.email,
//         name: user.name,
//         passwordHash,
//         roleId: role.id,
//         status: user.status ?? 'ACTIVE',
//         emailConfirmed: true,
//       },
//     });
//   }
//   console.log(`  ✓ Test users: ${testUsers.length}`);
// }

// ── Example: Sample Organizations ───────────────────────────────────────

// async function seedSampleOrganizations() {
//   const orgs = [
//     { slug: 'acme-corp', name: 'Acme Corporation' },
//     { slug: 'test-startup', name: 'Test Startup Inc' },
//   ];
//
//   for (const org of orgs) {
//     await prisma.organization.upsert({
//       where: { slug: org.slug },
//       update: { name: org.name },
//       create: org,
//     });
//   }
//   console.log(`  ✓ Sample organizations: ${orgs.length}`);
// }

// ── Main Entry Point ────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Test seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
