import { resetContentDb } from "@/lib/content/store";
import { resetRateLimit } from "@/lib/auth/rate-limit";
import { saveSource, type Actor } from "@/lib/content/service";

export const admin: Actor = { id: "admin-1", platformRole: "ADMIN" };
export const user: Actor = { id: "user-1", platformRole: "NONE" };
export function fresh(seed = false) {
  resetContentDb(seed);
  resetRateLimit(`import:${admin.id}`);
  resetRateLimit(`import-commit:${admin.id}`);
}
export const srcInput = (o: Record<string, unknown> = {}) => ({
  title: "Test source",
  url: "https://example.org/a",
  type: "PUBLIC_EXPERIENCE",
  publisher: "Example",
  description: "",
  licenseNotes: "",
  attribution: "Example",
  permission: "ATTRIBUTION_REQUIRED",
  commercialUse: "UNKNOWN",
  redistribution: "UNKNOWN",
  accessMethod: "manual",
  reliability: "UNRATED",
  reviewStatus: "REVIEWED",
  notes: "",
  ...o,
});
export const makeSource = (o: Record<string, unknown> = {}) => saveSource(admin, srcInput(o));
export const companyIn = (sourceIds: string[], o: Record<string, unknown> = {}) => ({
  name: "Test Co",
  website: "https://testco.example.com",
  careersUrl: "https://testco.example.com/careers",
  industry: "Software",
  origin: "ADMIN_CURATED",
  sourceIds,
  ...o,
});
export const questionIn = (sourceIds: string[], o: Record<string, unknown> = {}) => ({
  text: "Explain how a hash map handles collisions.",
  categorySlug: "data-structures-algorithms",
  type: "SHORT_ANSWER",
  difficulty: "BEGINNER",
  answerOutline: "Chaining or open addressing resolve collisions.",
  estimatedMinutes: 5,
  origin: "ADMIN_CURATED",
  sourceIds,
  ...o,
});
export const experienceIn = (companyId: string, sourceIds: string[], o: Record<string, unknown> = {}) => ({
  companyId,
  role: "Software engineer",
  summary: "A candidate described an online test followed by two technical conversations.",
  origin: "CANDIDATE_REPORTED",
  sourceIds,
  sourceRef: "Submission reference 42",
  ...o,
});
