import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Raw token for an emailed link. Store only hashToken(raw). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function tokenMatches(raw: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(raw), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
