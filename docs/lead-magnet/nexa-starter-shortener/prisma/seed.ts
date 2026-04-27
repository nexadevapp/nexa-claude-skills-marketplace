import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoEmail = "maria@example.com";

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      // Demo seed only. Real signup goes through Argon2id (NFR-007).
      // Value below is the literal string "demo" — never accepted by login.
      passwordHash: "$argon2id$seed-only-not-a-real-hash$demo",
    },
  });

  await prisma.link.deleteMany({ where: { ownerId: user.id } });

  await prisma.link.createMany({
    data: [
      {
        slug: "launch-2026",
        destinationUrl: "https://maria.example/launch-announcement-spring-2026",
        ownerId: user.id,
        creatorIp: "127.0.0.1",
        expiresAt: null,
      },
      {
        slug: "cv",
        destinationUrl: "https://maria.example/cv.pdf",
        ownerId: user.id,
        creatorIp: "127.0.0.1",
        expiresAt: null,
      },
      {
        slug: "talk-london",
        destinationUrl: "https://conf.example/sessions/maria-popescu-keynote",
        ownerId: user.id,
        creatorIp: "127.0.0.1",
        expiresAt: null,
      },
    ],
  });

  console.log(`Seeded user ${demoEmail} with 3 owned links.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
