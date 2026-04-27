// UC-002 step 7 / UC-003 path A3 — abuse blocklist.
// Production: persisted, moderated. Demo: in-memory hostname set.
// BR-004 (UC-002, UC-003): never expose which entry matched.

const BLOCKED_HOSTS: ReadonlySet<string> = new Set([
  "phishing.example",
  "malware.example",
  "blocked.example",
]);

export function isBlocked(destinationUrl: string): boolean {
  let host: string;
  try {
    host = new URL(destinationUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  return BLOCKED_HOSTS.has(host);
}
