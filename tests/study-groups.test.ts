import { describe, expect, it } from "vitest";
import { roleLevel, requireRole, type GroupRole } from "@/lib/community/study-groups";

describe("study group role levels", () => {
  it("assigns correct levels to each role", () => {
    expect(roleLevel("MEMBER")).toBe(1);
    expect(roleLevel("MODERATOR")).toBe(2);
    expect(roleLevel("ADMIN")).toBe(3);
    expect(roleLevel("OWNER")).toBe(4);
  });

  it("uses level comparison for permission checks", () => {
    expect(roleLevel("OWNER")).toBeGreaterThan(roleLevel("ADMIN"));
    expect(roleLevel("ADMIN")).toBeGreaterThan(roleLevel("MODERATOR"));
    expect(roleLevel("MODERATOR")).toBeGreaterThan(roleLevel("MEMBER"));
  });
});

describe("requireRole", () => {
  it("does not throw when the actual role meets or exceeds the minimum", () => {
    expect(() => requireRole("MEMBER", "MEMBER")).not.toThrow();
    expect(() => requireRole("MEMBER", "MODERATOR")).not.toThrow();
    expect(() => requireRole("MODERATOR", "ADMIN")).not.toThrow();
    expect(() => requireRole("ADMIN", "OWNER")).not.toThrow();
    expect(() => requireRole("MEMBER", "OWNER")).not.toThrow();
  });

  it("throws when the actual role is below the minimum", () => {
    expect(() => requireRole("MODERATOR", "MEMBER")).toThrow("Requires MODERATOR role or higher");
    expect(() => requireRole("ADMIN", "MODERATOR")).toThrow("Requires ADMIN role or higher");
    expect(() => requireRole("OWNER", "ADMIN")).toThrow("Requires OWNER role or higher");
  });

  it("throws when the user is not a member", () => {
    expect(() => requireRole("MEMBER", null)).toThrow("Not a member of this group");
    expect(() => requireRole("MODERATOR", null)).toThrow("Not a member of this group");
  });
});
