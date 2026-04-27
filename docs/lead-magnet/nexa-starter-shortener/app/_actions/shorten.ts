"use server";

// Implements UC-002 — Shorten a URL.
// Spec: docs/use_cases/UC-002.md
// Design: docs/designs/UC-002-design.html

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isValidDestinationUrl } from "@/lib/url-validator";
import { isBlocked } from "@/lib/blocklist";
import { isRateLimited } from "@/lib/rate-limit";
import { generateSlug, isValidCustomSlug } from "@/lib/slug";
import { getCreatorIp } from "@/lib/request";
import { getSessionUser } from "@/lib/session";

const ANONYMOUS_TTL_DAYS = Number(process.env.ANONYMOUS_LINK_TTL_DAYS ?? 30);
const MAX_GENERATION_ATTEMPTS = 5;

export type ShortenResult =
  | { ok: true; slug: string; shortUrl: string; expiresAt: string | null }
  | { ok: false; error: ShortenError };

export type ShortenError =
  | { kind: "INVALID_URL"; field: "destinationUrl" }
  | { kind: "INVALID_SLUG"; field: "slug" }
  | { kind: "SLUG_TAKEN"; field: "slug" }
  | { kind: "BLOCKED" }
  | { kind: "RATE_LIMITED" }
  | { kind: "SLUG_GENERATION_EXHAUSTED" };

const InputSchema = z.object({
  destinationUrl: z.string().min(1).max(2048),
  customSlug: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function shortenAction(
  formData: FormData,
): Promise<ShortenResult> {
  const parsed = InputSchema.safeParse({
    destinationUrl: formData.get("destinationUrl"),
    customSlug: formData.get("customSlug") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: { kind: "INVALID_URL", field: "destinationUrl" } };
  }
  const { destinationUrl, customSlug } = parsed.data;

  // Step 6 — destination URL validation.
  if (!isValidDestinationUrl(destinationUrl)) {
    return { ok: false, error: { kind: "INVALID_URL", field: "destinationUrl" } };
  }

  // Step 4 / BR-01 — custom slug validation.
  if (customSlug && !isValidCustomSlug(customSlug)) {
    return { ok: false, error: { kind: "INVALID_SLUG", field: "slug" } };
  }

  // A2 — blocklist (BR-04 generic message).
  if (isBlocked(destinationUrl)) {
    return { ok: false, error: { kind: "BLOCKED" } };
  }

  const creatorIp = await getCreatorIp();

  // A5 — rate limit (NFR-004, BR-003).
  if (await isRateLimited(creatorIp)) {
    return { ok: false, error: { kind: "RATE_LIMITED" } };
  }

  const sessionUser = await getSessionUser();
  const ownerId = sessionUser?.id ?? null;
  const expiresAt = ownerId
    ? null
    : new Date(Date.now() + ANONYMOUS_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Step 7/8 — slug generation. Custom slug: insert once and let the unique
  // index decide. Generated: retry up to 5 times on collision.
  if (customSlug) {
    try {
      const link = await prisma.link.create({
        data: { slug: customSlug, destinationUrl, ownerId, creatorIp, expiresAt },
        select: { slug: true, expiresAt: true },
      });
      return successResult(link.slug, link.expiresAt);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, error: { kind: "SLUG_TAKEN", field: "slug" } };
      }
      throw error;
    }
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    try {
      const link = await prisma.link.create({
        data: { slug, destinationUrl, ownerId, creatorIp, expiresAt },
        select: { slug: true, expiresAt: true },
      });
      return successResult(link.slug, link.expiresAt);
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  return { ok: false, error: { kind: "SLUG_GENERATION_EXHAUSTED" } };
}

function successResult(slug: string, expiresAt: Date | null): ShortenResult {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return {
    ok: true,
    slug,
    shortUrl: `${base}/${slug}`,
    expiresAt: expiresAt?.toISOString() ?? null,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
