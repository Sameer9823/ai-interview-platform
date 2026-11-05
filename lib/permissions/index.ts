export type CareerStage = "STUDENT" | "FRESHER" | "PROFESSIONAL";
export type PlatformRole = "NONE" | "ADMIN";
export type DashboardGroup = "student" | "professional";

/** Students and freshers share one dashboard. Professionals have their own. */
export const groupOf = (stage: CareerStage): DashboardGroup => (stage === "PROFESSIONAL" ? "professional" : "student");
export const dashboardFor = (stage: CareerStage): string => `/${groupOf(stage)}/dashboard`;

/** Built on the server from the verified session and database, never from client input. */
export interface SessionUser {
  id: string;
  careerStage: CareerStage | null;
  platformRole: PlatformRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

const PUBLIC_EXACT = new Set(["/", "/privacy", "/terms"]);
const AUTH_PAGES = new Set(["/sign-in", "/sign-up", "/forgot-password", "/reset-password"]);
const SHARED_PRIVATE = ["/profile", "/goals", "/library", "/saved", "/assessments", "/mock-interviews", "/resume", "/settings", "/plan", "/practice", "/community", "/study-groups", "/applications", "/opportunities"];
/** Published content is public. Unpublished content is filtered out by the data layer, not by the route. */
const PUBLIC_PREFIXES = ["/companies", "/questions", "/interview-experiences", "/topics"];

export type RouteDecision = { allowed: true } | { allowed: false; redirectTo: string };
const allow: RouteDecision = { allowed: true };
const deny = (redirectTo: string): RouteDecision => ({ allowed: false, redirectTo });
const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

export function authorizeRoute(pathname: string, user: SessionUser | null): RouteDecision {
  const isAuthPage = AUTH_PAGES.has(pathname);
  if (PUBLIC_EXACT.has(pathname) || under(pathname, "/verify-email") || PUBLIC_PREFIXES.some((p) => under(pathname, p))) return allow;

  if (!user) return isAuthPage ? allow : deny(`/sign-in?next=${encodeURIComponent(pathname)}`);
  if (!user.emailVerified) return deny("/verify-email");

  const stage = user.careerStage;
  if (!user.onboardingCompleted || !stage) return under(pathname, "/onboarding") ? allow : deny("/onboarding");
  if (isAuthPage || under(pathname, "/onboarding")) return deny(dashboardFor(stage));

  const group = groupOf(stage);
  if (under(pathname, "/student")) return group === "student" ? allow : deny(dashboardFor(stage));
  if (under(pathname, "/professional")) return group === "professional" ? allow : deny(dashboardFor(stage));
  // Administration is a separate permission. A career stage never grants it.
  if (under(pathname, "/admin")) return user.platformRole === "ADMIN" ? allow : deny(dashboardFor(stage));
  if (SHARED_PRIVATE.some((p) => under(pathname, p))) return allow;

  // Unknown private paths are denied by default.
  return deny(dashboardFor(stage));
}
