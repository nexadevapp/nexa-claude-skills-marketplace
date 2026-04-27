// UC-002 spec step 8 — generated slug is 7 chars, URL-safe.
// Custom slugs follow `^[a-z0-9-]{3,32}$` (BR-01) — generated slugs use the same charset minus `-`.

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const GENERATED_LENGTH = 7;
export const SLUG_PATTERN = /^[a-z0-9-]{3,32}$/;

export function generateSlug(length: number = GENERATED_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function isValidCustomSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
