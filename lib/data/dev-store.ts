/**
 * DEV ONLY in memory store. Stands in for Prisma until the database is connected.
 * Resets when the server restarts. Replace these functions with Prisma queries;
 * the rest of the app only talks to this file.
 */
import type { CareerStage } from "@/lib/permissions";

export interface Profile {
  careerDomain?: string;
  targetRole?: string;
  preferredLanguage: "en";
  experienceLevel?: string;
  educationLevel?: string;
  degree?: string;
  graduationYear?: number;
  primaryProgrammingLanguage?: string;
  currentRole?: string;
  yearsOfExperience?: number;
  skills?: string[];
  skillsToImprove: string[];
}
export interface DevUser {
  id: string;
  email: string;
  name: string;
  careerStage: CareerStage | null;
  passwordHash: string;
  emailVerified: boolean;
  onboardingDone: boolean;
  platformRole: "NONE" | "ADMIN";
  profile: Profile;
  goals: string[];
  prefs: { theme: "LIGHT" | "DARK"; emailNotifications: boolean; productUpdates: boolean };
  activity: { id: string; title: string; at: string }[];
  notifications: { id: string; title: string; at: string; read: boolean }[];
}

export const emptyProfile = (): Profile => ({ preferredLanguage: "en", skillsToImprove: [] });

const g = globalThis as unknown as { __ipUsers?: Map<string, DevUser> };
const users = (g.__ipUsers ??= new Map<string, DevUser>());
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_STORE !== "1") {
  console.warn("[dev-store] In memory store active in production. Connect Prisma before real use.");
}

const uid = () => crypto.randomUUID();

export function findById(id: string) {
  return users.get(id) ?? null;
}
export function findByEmail(email: string) {
  for (const u of users.values()) if (u.email === email) return u;
  return null;
}
/**
 * DEV AND TEST ONLY. Grants admin to one email when ALLOW_DEV_ADMIN=1 and DEV_ADMIN_EMAIL matches.
 * Not safe with real users because email verification is not built yet. Production grants admin with
 * `npm run admin:grant -- someone@example.com` against the database. Nobody is ever promoted automatically.
 */
const devAdmin = (email: string) =>
  process.env.ALLOW_DEV_ADMIN === "1" && !!process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_EMAIL.trim().toLowerCase() === email;

export function createUser(input: { email: string; name: string; passwordHash: string }): DevUser {
  const u: DevUser = {
    id: uid(),
    ...input,
    careerStage: null,
    emailVerified: true /* dev: verification flow not built yet */,
    onboardingDone: false,
    platformRole: devAdmin(input.email) ? "ADMIN" : "NONE",
    profile: emptyProfile(),
    goals: [],
    prefs: { theme: "DARK", emailNotifications: true, productUpdates: false },
    activity: [],
    notifications: [],
  };
  users.set(u.id, u);
  return u;
}
export function deleteUser(id: string) {
  users.delete(id);
}
export function addActivity(u: DevUser, title: string, notify = false) {
  const at = new Date().toISOString();
  u.activity.unshift({ id: uid(), title, at });
  if (notify) u.notifications.unshift({ id: uid(), title, at, read: false });
}
