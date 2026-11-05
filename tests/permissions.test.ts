import { describe, expect, it } from "vitest";
import { authorizeRoute, dashboardFor, groupOf, type CareerStage, type SessionUser } from "@/lib/permissions";

const mk = (careerStage: CareerStage | null, over: Partial<SessionUser> = {}): SessionUser => ({
  id: "u1",
  platformRole: "NONE",
  emailVerified: true,
  onboardingCompleted: careerStage !== null,
  careerStage,
  ...over,
});
const student = mk("STUDENT"),
  fresher = mk("FRESHER"),
  pro = mk("PROFESSIONAL");

const adminUser = mk("PROFESSIONAL", { platformRole: "ADMIN" });

describe("dashboards", () => {
  it("students and freshers share a dashboard, professionals have their own", () => {
    expect(groupOf("STUDENT")).toBe("student");
    expect(groupOf("FRESHER")).toBe("student");
    expect(groupOf("PROFESSIONAL")).toBe("professional");
    expect(dashboardFor("FRESHER")).toBe("/student/dashboard");
    expect(dashboardFor("PROFESSIONAL")).toBe("/professional/dashboard");
  });
});

describe("authorizeRoute", () => {
  it("lets anyone see public pages", () => {
    for (const p of ["/", "/privacy", "/terms"]) expect(authorizeRoute(p, null)).toEqual({ allowed: true });
  });
  it("sends signed out visitors to sign in and remembers the page", () => {
    expect(authorizeRoute("/student/dashboard", null)).toEqual({ allowed: false, redirectTo: "/sign-in?next=%2Fstudent%2Fdashboard" });
    for (const p of ["/profile", "/goals", "/settings/security", "/library"]) expect(authorizeRoute(p, null).allowed).toBe(false);
  });
  it("shows auth pages only to signed out visitors", () => {
    expect(authorizeRoute("/sign-in", null)).toEqual({ allowed: true });
    expect(authorizeRoute("/sign-in", student)).toEqual({ allowed: false, redirectTo: "/student/dashboard" });
  });
  it("lets students and freshers into the student area and blocks the professional area", () => {
    for (const u of [student, fresher]) {
      expect(authorizeRoute("/student/dashboard", u)).toEqual({ allowed: true });
      expect(authorizeRoute("/professional/dashboard", u)).toEqual({ allowed: false, redirectTo: "/student/dashboard" });
    }
  });
  it("blocks professionals from the student area", () => {
    expect(authorizeRoute("/professional/dashboard", pro)).toEqual({ allowed: true });
    expect(authorizeRoute("/student/dashboard", pro)).toEqual({ allowed: false, redirectTo: "/professional/dashboard" });
    expect(authorizeRoute("/student/anything/deep", pro).allowed).toBe(false);
  });
  it("does not confuse look alike prefixes", () => {
    expect(authorizeRoute("/studentx", student).allowed).toBe(false);
    expect(authorizeRoute("/profile-evil", pro).allowed).toBe(false);
  });
  it("requires email verification, then onboarding", () => {
    expect(authorizeRoute("/student/dashboard", mk("STUDENT", { emailVerified: false }))).toEqual({
      allowed: false,
      redirectTo: "/verify-email",
    });
    const fresh = mk(null);
    expect(authorizeRoute("/student/dashboard", fresh)).toEqual({ allowed: false, redirectTo: "/onboarding" });
    expect(authorizeRoute("/profile", fresh)).toEqual({ allowed: false, redirectTo: "/onboarding" });
    expect(authorizeRoute("/onboarding", fresh)).toEqual({ allowed: true });
  });
  it("treats a completed flag without a stage as not onboarded", () => {
    expect(authorizeRoute("/profile", mk(null, { onboardingCompleted: true })).allowed).toBe(false);
  });
  it("sends finished users away from onboarding", () => {
    expect(authorizeRoute("/onboarding", pro)).toEqual({ allowed: false, redirectTo: "/professional/dashboard" });
  });
  it("lets signed in users reach the shared private pages", () => {
    for (const p of ["/profile", "/goals", "/library", "/assessments", "/mock-interviews", "/resume", "/settings/security"]) {
      expect(authorizeRoute(p, student)).toEqual({ allowed: true });
      expect(authorizeRoute(p, pro)).toEqual({ allowed: true });
    }
  });
  it("denies unknown private paths and anything recruiter related", () => {
    for (const p of ["/admin", "/recruiter/dashboard", "/jobs", "/candidates"]) expect(authorizeRoute(p, pro).allowed).toBe(false);
  });
  it("platform admin does not bypass stage routing", () => {
    expect(authorizeRoute("/student/dashboard", mk("PROFESSIONAL", { platformRole: "ADMIN" })).allowed).toBe(false);
  });

  it("published content pages are public, and bookmarks are private", () => {
    for (const p of [
      "/companies",
      "/companies/google",
      "/questions",
      "/questions/two-sum-indices",
      "/interview-experiences",
      "/interview-experiences/x",
      "/topics/sql",
    ]) {
      expect(authorizeRoute(p, null)).toEqual({ allowed: true });
      expect(authorizeRoute(p, student)).toEqual({ allowed: true });
    }
    expect(authorizeRoute("/saved", null).allowed).toBe(false);
    expect(authorizeRoute("/saved", student)).toEqual({ allowed: true });
  });
  it("does not treat look alike prefixes as public", () => {
    for (const p of ["/companies-private", "/questionsx", "/topicsx"]) expect(authorizeRoute(p, null).allowed).toBe(false);
  });
  it("keeps /admin for administrators only, whatever the career stage", () => {
    for (const p of ["/admin", "/admin/questions", "/admin/imports/123"]) {
      expect(authorizeRoute(p, null)).toEqual({ allowed: false, redirectTo: `/sign-in?next=${encodeURIComponent(p)}` });
      expect(authorizeRoute(p, student)).toEqual({ allowed: false, redirectTo: "/student/dashboard" });
      expect(authorizeRoute(p, fresher).allowed).toBe(false);
      expect(authorizeRoute(p, pro)).toEqual({ allowed: false, redirectTo: "/professional/dashboard" });
      expect(authorizeRoute(p, adminUser)).toEqual({ allowed: true });
    }
    expect(authorizeRoute("/administrator", adminUser).allowed).toBe(false);
  });
  it("sends an admin who has not finished onboarding to onboarding first", () => {
    expect(authorizeRoute("/admin", mk(null, { platformRole: "ADMIN" }))).toEqual({ allowed: false, redirectTo: "/onboarding" });
  });
});
