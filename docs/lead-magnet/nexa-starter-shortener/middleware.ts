// TT-001 — Auth middleware (stub).
// Real implementation belongs to /setup-web-middleware. This stub gates
// /dashboard/* on the demo session cookie (see lib/session.ts) and adds
// security headers per NFR-006 / NFR-008.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const PROTECTED_PREFIXES = ["/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const session = request.cookies.get(SESSION_COOKIE_NAME);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "geolocation=(), camera=(), microphone=()");
  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
