import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Returns a PrismaClient connected to the Testcontainers database.
 * DATABASE_URL is set by the global setup before tests run.
 */
export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
