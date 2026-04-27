// NFR-004 / UC-002 BR-003 — a single IP cannot create more than 20 links per hour.
// Production: Redis or DB-backed. Demo: query the LINK table directly via the
// (creatorIp, createdAt) index.

import { prisma } from "./db";

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR ?? 20);

export async function isRateLimited(creatorIp: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.link.count({
    where: { creatorIp, createdAt: { gte: since } },
  });
  return count >= LIMIT;
}
