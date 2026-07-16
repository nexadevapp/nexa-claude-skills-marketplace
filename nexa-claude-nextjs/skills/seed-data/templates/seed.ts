import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding reference data...');

  // ── Reference Data ──────────────────────────────────────────────────
  // Seed these first — they have no dependencies
  // await seedCountries();
  // await seedCurrencies();

  // ── Configuration Data ──────────────────────────────────────────────
  // Seed after reference data if they have FKs
  // await seedRoles();
  // await seedPermissions();
  // await seedRolePermissions();

  // ── Lookup Tables ───────────────────────────────────────────────────
  // Business domain classifications
  // await seedCategories();
  // await seedStatuses();

  console.log('✅ Reference data seeding complete');
}

// ── Example: Reference Data ─────────────────────────────────────────────

// async function seedCountries() {
//   const countries = [
//     { code: 'US', name: 'United States' },
//     { code: 'GB', name: 'United Kingdom' },
//     { code: 'DE', name: 'Germany' },
//   ];
//
//   for (const country of countries) {
//     await prisma.country.upsert({
//       where: { code: country.code },
//       update: {},
//       create: country,
//     });
//   }
//   console.log(`  ✓ Countries: ${countries.length}`);
// }

// ── Example: Configuration Data ─────────────────────────────────────────

// async function seedRoles() {
//   const roles = [
//     { name: 'ADMIN', description: 'System administrator' },
//     { name: 'USER', description: 'Regular user' },
//   ];
//
//   for (const role of roles) {
//     await prisma.role.upsert({
//       where: { name: role.name },
//       update: { description: role.description },
//       create: role,
//     });
//   }
//   console.log(`  ✓ Roles: ${roles.length}`);
// }

// ── Main Entry Point ────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
