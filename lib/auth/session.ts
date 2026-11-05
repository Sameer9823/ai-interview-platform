import "server-only";
import { cookies } from "next/headers";
import { signSession, verifySession } from "./session-token";
import { db } from "@/lib/db/client";
import type { SessionUser } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth/types";

const COOKIE = "ip_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s !== "replace-me") return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production");
  return "dev-only-insecure-secret-change-me";
}

export async function createSession(userId: string) {
  const token = signSession({ uid: userId, exp: Date.now() + MAX_AGE * 1000 }, secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** Identity always comes from the signed cookie plus the database. Never from client supplied values. */
export async function getCurrent(): Promise<{ record: CurrentUser | null; session: SessionUser | null }> {
  const payload = verifySession((await cookies()).get(COOKIE)?.value, secret());
  if (!payload) return { record: null, session: null };

  const user = await db.user.findUnique({
    where: { id: payload.uid },
    include: {
      profile: true,
      goals: true,
      preference: true,
      activityLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      notifications: { orderBy: { createdAt: "desc" }, take: 10, where: { readAt: null } },
    },
  });

  if (!user) return { record: null, session: null };

  // Map Prisma user to CurrentUser type
  const currentUser: CurrentUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    careerStage: user.careerStage,
    passwordHash: user.passwordHash ?? "",
    emailVerified: !!user.emailVerified,
    onboardingDone: !!user.onboardingCompletedAt,
    platformRole: user.platformRole,
    profile: user.profile ? {
      careerDomain: user.profile.careerDomain ?? undefined,
      targetRole: user.profile.targetRole ?? undefined,
      preferredLanguage: "en",
      experienceLevel: user.profile.experienceLevel ?? undefined,
      educationLevel: user.profile.educationLevel ?? undefined,
      degree: user.profile.degree ?? undefined,
      graduationYear: user.profile.graduationYear ?? undefined,
      primaryProgrammingLanguage: user.profile.primaryProgrammingLanguage ?? undefined,
      currentRole: user.profile.currentRole ?? undefined,
      yearsOfExperience: user.profile.yearsOfExperience ?? undefined,
      skills: [],
      skillsToImprove: user.profile.skillsToImprove,
    } : {
      preferredLanguage: "en",
      skills: [],
      skillsToImprove: [],
    },
    goals: user.goals.map((g) => g.category),
    prefs: user.preference ? {
      theme: user.preference.theme,
      emailNotifications: user.preference.emailNotifications,
      productUpdates: user.preference.productUpdates,
    } : { theme: "DARK", emailNotifications: true, productUpdates: false },
    activity: user.activityLogs.map((a) => ({ id: a.id, title: a.type, at: a.createdAt.toISOString() })),
    notifications: user.notifications.map((n) => ({ id: n.id, title: n.title, at: n.createdAt.toISOString(), read: !!n.readAt })),
  };

  return {
    record: currentUser,
    session: {
      id: user.id,
      careerStage: user.careerStage,
      platformRole: user.platformRole,
      emailVerified: !!user.emailVerified,
      onboardingCompleted: !!user.onboardingCompletedAt,
    },
  };
}
