// Resolves the visitor's IP from request headers. UC-002 spec step 9:
// `creatorIp` is the X-Forwarded-For first hop (max 45 chars for IPv6).

import { headers } from "next/headers";

const FALLBACK_IP = "0.0.0.0";

export async function getCreatorIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim().slice(0, 45);
  const real = h.get("x-real-ip");
  if (real) return real.slice(0, 45);
  return FALLBACK_IP;
}
