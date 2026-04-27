// Unit tests for the slug utilities.
// UC-002 spec — BR-01 (immutable), step 4 (custom slug regex), step 8 (generated 7-char URL-safe).

import { describe, it, expect } from "vitest";
import { generateSlug, isValidCustomSlug, SLUG_PATTERN } from "@/lib/slug";

describe("generateSlug", () => {
  it("returns 7 characters by default", () => {
    expect(generateSlug()).toHaveLength(7);
  });

  it("returns the requested length", () => {
    expect(generateSlug(10)).toHaveLength(10);
    expect(generateSlug(3)).toHaveLength(3);
  });

  it("only contains URL-safe characters [a-z0-9]", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSlug()).toMatch(/^[a-z0-9]{7}$/);
    }
  });

  it("produces different slugs across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateSlug());
    // Birthday-paradox safe at this scale: 36^7 = ~78 billion.
    expect(seen.size).toBeGreaterThan(995);
  });

  it("generated slugs match the wider [a-z0-9-] pattern", () => {
    expect(SLUG_PATTERN.test(generateSlug())).toBe(true);
  });
});

describe("isValidCustomSlug", () => {
  it.each([
    ["abc", true],
    ["my-launch", true],
    ["a-b-c-1-2-3", true],
    ["123456", true],
    ["a".repeat(32), true],
  ])("accepts valid slug: %s", (slug, expected) => {
    expect(isValidCustomSlug(slug)).toBe(expected);
  });

  it.each([
    ["ab", "too short"],
    ["a".repeat(33), "too long"],
    ["UPPER", "uppercase not allowed"],
    ["with space", "space not allowed"],
    ["under_score", "underscore not allowed"],
    ["dot.dot", "dot not allowed"],
    ["", "empty"],
  ])("rejects invalid slug: %s (%s)", (slug) => {
    expect(isValidCustomSlug(slug)).toBe(false);
  });
});
