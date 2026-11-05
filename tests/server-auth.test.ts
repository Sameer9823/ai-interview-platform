import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession, verifySession } from "@/lib/auth/session-token";
import { rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { profileCompletion } from "@/lib/utils/profile-completion";

describe("password hashing", () => {
  it("never stores the password and verifies correctly", async () => {
    const h = await hashPassword("correct horse 42");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(h).not.toContain("correct horse");
    expect(await verifyPassword("correct horse 42", h)).toBe(true);
    expect(await verifyPassword("wrong horse 42", h)).toBe(false);
  });
  it("uses a fresh salt each time", async () => {
    expect(await hashPassword("same password 1")).not.toBe(await hashPassword("same password 1"));
  });
  it("rejects when the account does not exist, without throwing", async () => {
    expect(await verifyPassword("anything12345", null)).toBe(false);
    expect(await verifyPassword("anything12345", "garbage")).toBe(false);
  });
});

describe("session tokens", () => {
  const secret = "test-secret";
  const now = 1_000_000;
  it("round trips a valid token", () => {
    const t = signSession({ uid: "u1", exp: now + 1000 }, secret);
    expect(verifySession(t, secret, now)?.uid).toBe("u1");
  });
  it("rejects expired, tampered, wrong secret and malformed tokens", () => {
    const t = signSession({ uid: "u1", exp: now + 1000 }, secret);
    expect(verifySession(t, secret, now + 1000)).toBeNull();
    expect(verifySession(t, "other-secret", now)).toBeNull();
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "admin", exp: now + 99999 })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, secret, now)).toBeNull();
    expect(verifySession(`${body}.`, secret, now)).toBeNull();
    expect(verifySession("a.b.c", secret, now)).toBeNull();
    expect(verifySession(undefined, secret, now)).toBeNull();
  });
});

describe("rate limit", () => {
  it("blocks after the limit and recovers after the window", () => {
    resetRateLimit("k");
    for (let i = 0; i < 5; i++) expect(rateLimit("k", 5, 1000, 100 + i).ok).toBe(true);
    const blocked = rateLimit("k", 5, 1000, 200);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rateLimit("k", 5, 1000, 5000).ok).toBe(true);
  });
});

describe("profile completion", () => {
  const empty = { skillsToImprove: [] as string[], preferredLanguage: "en" as const };
  it("counts only real values and explains what is missing", () => {
    const none = profileCompletion({ careerStage: "PROFESSIONAL", profile: empty, goals: [] });
    expect(none.percent).toBe(0);
    expect(none.missing).toContain("Add your target role");
    const some = profileCompletion({
      careerStage: "PROFESSIONAL",
      profile: { ...empty, yearsOfExperience: 0, targetRole: "Lead" },
      goals: ["SYSTEM_DESIGN"],
    });
    expect(some.percent).toBe(43);
    expect(some.missing).not.toContain("Add your years of experience");
  });
  it("uses student checks for students and freshers", () => {
    const r = profileCompletion({
      careerStage: "FRESHER",
      profile: {
        ...empty,
        careerDomain: "X",
        targetRole: "Y",
        experienceLevel: "BEGINNER",
        educationLevel: "BACHELORS",
        degree: "CS",
        graduationYear: 2026,
        primaryProgrammingLanguage: "Python",
      },
      goals: ["CODING_DSA"],
    });
    expect(r.percent).toBe(100);
    expect(r.total).toBe(8);
  });
});
