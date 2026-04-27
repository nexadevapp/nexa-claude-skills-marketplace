// TT-001 stub — demo session. Real auth (Argon2id, NFR-007) is out of scope
// for the lead-magnet implementation; the `lnk_demo_session` cookie is set
// by /sign-in for a fixed seed user (maria@example.com).

import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "lnk_demo_session";

export type SessionUser = { id: bigint; email: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const user = await prisma.user.findUnique({
    where: { email: value },
    select: { id: true, email: true },
  });
  return user;
}

export async function setSession(email: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
