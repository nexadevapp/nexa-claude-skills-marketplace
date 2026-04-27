// UC-003 — Redirect to destination.
// Spec: docs/use_cases/UC-003.md
// Design: docs/designs/UC-003-design.html

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isBlocked } from "@/lib/blocklist";
import {
  renderNotFoundPage,
  renderExpiredPage,
  renderBlockedPage,
} from "./failure-pages";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const link = await prisma.link.findUnique({
    where: { slug },
    select: { destinationUrl: true, expiresAt: true },
  });

  // A1 — slug never existed (404, distinct from 410 per BR-003).
  if (!link) {
    return htmlResponse(renderNotFoundPage(), 404);
  }

  // A2 — link expired.
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) {
    return htmlResponse(renderExpiredPage(), 410);
  }

  // A3 — destination on the blocklist (BR-04: generic message).
  if (isBlocked(link.destinationUrl)) {
    return htmlResponse(renderBlockedPage(), 451);
  }

  // Success — server-side 302. BR-001: no Set-Cookie, no body, no trackers.
  return NextResponse.redirect(link.destinationUrl, {
    status: 302,
    headers: { "cache-control": "private, no-store" },
  });
}

function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
}
