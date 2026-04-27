// UC-002 spec step 6 — destination URL must be syntactically valid (RFC 3986)
// with scheme http or https. Length capped at 2048 (matches LINK.destinationUrl).

const MAX_URL_LENGTH = 2048;

export function isValidDestinationUrl(input: string): boolean {
  if (!input || input.length > MAX_URL_LENGTH) return false;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}
