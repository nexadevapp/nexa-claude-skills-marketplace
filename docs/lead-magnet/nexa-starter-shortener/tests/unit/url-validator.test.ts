// UC-002 spec step 6 — destination URL validation.

import { describe, it, expect } from "vitest";
import { isValidDestinationUrl } from "@/lib/url-validator";

describe("isValidDestinationUrl", () => {
  it.each([
    "https://example.com",
    "http://example.com",
    "https://example.com/path/to/article?q=1#frag",
    "https://sub.example.com:8080/x",
  ])("accepts valid http(s) URL: %s", (url) => {
    expect(isValidDestinationUrl(url)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["not-a-url", "not parseable"],
    ["ftp://example.com", "wrong scheme"],
    ["javascript:alert(1)", "javascript scheme"],
    ["file:///etc/passwd", "file scheme"],
    ["data:text/html,<script>1</script>", "data scheme"],
    ["mailto:foo@bar.com", "mailto scheme"],
    ["//example.com", "protocol-relative"],
  ])("rejects %s: %s", (url) => {
    expect(isValidDestinationUrl(url)).toBe(false);
  });

  it("rejects URLs longer than 2048 chars", () => {
    const long = "https://example.com/" + "a".repeat(2050);
    expect(isValidDestinationUrl(long)).toBe(false);
  });
});
