import { describe, expect, it } from "vitest";
import { safeRedirect } from "@/lib/utils/safe-redirect";
import { generateToken, hashToken, isExpired, tokenMatches } from "@/lib/auth/tokens";

describe("safeRedirect", () => {
  it("keeps same site paths", () => {
    expect(safeRedirect("/student/dashboard")).toBe("/student/dashboard");
    expect(safeRedirect("/settings/profile?tab=a#x")).toBe("/settings/profile?tab=a#x");
  });
  it("blocks external and tricky targets", () => {
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "evil.com",
      "/%0d%0aHeader",
      "/\nfoo",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(safeRedirect(bad as unknown, "/home")).toBe("/home");
    }
  });
  it("uses the fallback for oversized input", () => {
    expect(safeRedirect("/" + "a".repeat(3000), "/home")).toBe("/home");
  });
});

describe("tokens", () => {
  it("generates unique url safe tokens", () => {
    const a = generateToken(),
      b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it("stores only a hash that matches the raw token", () => {
    const raw = generateToken(),
      hash = hashToken(raw);
    expect(hash).not.toContain(raw);
    expect(hash).toHaveLength(64);
    expect(tokenMatches(raw, hash)).toBe(true);
    expect(tokenMatches(raw + "x", hash)).toBe(false);
    expect(tokenMatches(raw, "not-hex")).toBe(false);
  });
  it("detects expiry", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(isExpired(new Date("2025-12-31T23:59:59Z"), now)).toBe(true);
    expect(isExpired(new Date("2026-01-01T00:00:01Z"), now)).toBe(false);
  });
});
