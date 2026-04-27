// UC-002 step 7 / UC-003 path A3 — abuse blocklist.

import { describe, it, expect } from "vitest";
import { isBlocked } from "@/lib/blocklist";

describe("isBlocked", () => {
  it.each([
    "https://phishing.example/anything",
    "http://phishing.example",
    "https://malware.example/path",
    "https://blocked.example",
  ])("blocks known abusive host: %s", (url) => {
    expect(isBlocked(url)).toBe(true);
  });

  it.each([
    "https://example.com",
    "https://safe.example",
    "https://github.com/user/repo",
  ])("allows non-blocked host: %s", (url) => {
    expect(isBlocked(url)).toBe(false);
  });

  it("matches host case-insensitively", () => {
    expect(isBlocked("https://PHISHING.example")).toBe(true);
  });

  it("returns false for malformed URLs (the URL validator gates earlier)", () => {
    expect(isBlocked("not-a-url")).toBe(false);
  });

  it("only matches exact host (no substring escape)", () => {
    expect(isBlocked("https://safephishing.example")).toBe(false);
    expect(isBlocked("https://phishing.example.evil.com")).toBe(false);
  });
});
