import { z } from "zod";
import {
  CAREER_STAGES,
  DIFFICULTY,
  EXPERIENCE_LEVEL,
  ORIGIN,
  PERMISSION,
  PUBLICATION,
  QUESTION_TYPE,
  RELIABILITY,
  ROUND_KIND,
  SOURCE_REVIEW,
  SOURCE_TYPE,
  VERIFICATION,
} from "./types";
import { cleanText, safeExternalUrl } from "./sanitize";

const text = (max: number, min = 0) =>
  z.preprocess(
    (v) => cleanText(v, max + 1),
    z
      .string()
      .min(min, min ? `Enter at least ${min} characters` : "Required")
      .max(max, `Use ${max} characters or fewer`),
  );
const optText = (max: number) =>
  z.preprocess((v) => (v == null ? "" : cleanText(v, max + 1)), z.string().max(max, `Use ${max} characters or fewer`));
const url = (label: string, required = true) =>
  z.preprocess(
    (v) => (v == null ? "" : typeof v === "string" ? v.trim() : v),
    z.string().refine((v) => (v === "" ? !required : safeExternalUrl(v) !== null), {
      message: `Enter a public http or https address for ${label}`,
    }),
  );
const list = (max: number, itemMax = 60, sep = /[,\n]/) =>
  z.preprocess(
    // Web forms send "" for an empty list field. Blank items are dropped before they are validated.
    (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(sep) : []).map((x) => cleanText(x, itemMax + 1)).filter(Boolean),
    z
      .array(z.string().max(itemMax, `Each item must be ${itemMax} characters or fewer`))
      .transform((a) => [...new Set(a)])
      .pipe(z.array(z.string()).max(max, `Add up to ${max} items`)),
  );
const multi = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]),
    z.array(z.enum(values)).transform((a) => [...new Set(a)]),
  );
const ids = z.preprocess(
  (v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.string().min(1).max(64)).max(20, "Add up to 20 sources"),
);
const slug = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : ""),
  z
    .string()
    .max(80)
    .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), { message: "Use lowercase letters, numbers and single hyphens" }),
);
const int = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ message: "Enter a number" }).int("Enter a whole number").min(min, `Enter ${min} or more`).max(max, `Enter ${max} or less`),
  );
const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(min).max(max).optional());

export const sourceInput = z.object({
  title: text(160, 2),
  url: url("the source"),
  type: z.enum(SOURCE_TYPE, { message: "Choose a source type" }),
  publisher: optText(120),
  description: optText(600),
  licenseNotes: optText(1000),
  attribution: optText(300),
  permission: z.enum(PERMISSION),
  commercialUse: z.enum(PERMISSION),
  redistribution: z.enum(PERMISSION),
  accessMethod: optText(200),
  reliability: z.enum(RELIABILITY),
  reviewStatus: z.enum(SOURCE_REVIEW),
  notes: optText(1000),
});

const moderated = {
  origin: z.enum(ORIGIN, { message: "Choose an origin" }),
  verification: z.enum(VERIFICATION).default("NOT_VERIFIED"),
  sourceIds: ids,
  moderatorNotes: optText(2000),
};

export const companyInput = z.object({
  name: text(120, 2),
  slug,
  website: url("the website"),
  careersUrl: url("the careers page"),
  logoUrl: url("the logo", false),
  industry: text(80, 2),
  description: optText(600),
  headquarters: optText(120),
  hiringInfo: optText(2000),
  roleCategories: list(20),
  prepCategories: list(20, 80),
  ...moderated,
});
export const processInput = z.object({
  companyId: text(64, 1),
  title: text(160, 2),
  roleFamily: optText(120),
  experienceLevels: multi(EXPERIENCE_LEVEL),
  careerStages: multi(CAREER_STAGES),
  sequence: optInt(1, 30),
  kind: z.enum(ROUND_KIND, { message: "Choose a round type" }),
  description: text(2000, 10),
  skillsEvaluated: list(20),
  prepRecommendations: optText(2000),
  ...moderated,
});

/** One option per line. A leading * marks a correct option. */
export function parseOptions(raw: unknown): { text: string; correct: boolean }[] {
  const lines = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n|\|/) : [];
  return lines
    .map((l) => String(l).trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((l) => ({ correct: l.startsWith("*"), text: cleanText(l.replace(/^\*\s*/, ""), 300) }))
    .filter((o) => o.text);
}
export function parseTestCases(raw: unknown): { input: string; expected: string }[] {
  const lines = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
  return lines
    .map((l) => (typeof l === "string" ? l : ""))
    .filter((l) => l.includes("=>"))
    .slice(0, 20)
    .map((l) => {
      const [a = "", ...b] = l.split("=>");
      return { input: cleanText(a, 300), expected: cleanText(b.join("=>"), 300) };
    });
}

export const questionInput = z.object({
  text: text(2000, 10),
  slug,
  categorySlug: text(80, 1),
  type: z.enum(QUESTION_TYPE, { message: "Choose a question type" }),
  difficulty: z.enum(DIFFICULTY, { message: "Choose a difficulty" }),
  companySlugs: list(10, 80),
  roles: list(10),
  careerStages: multi(CAREER_STAGES),
  experienceLevels: multi(EXPERIENCE_LEVEL),
  skills: list(15),
  tags: list(15, 40),
  answerOutline: text(3000, 2),
  explanation: optText(5000),
  exampleAnswer: optText(5000),
  codeSolution: optText(8000),
  codeLanguage: optText(30),
  testCases: z.preprocess(parseTestCases, z.array(z.object({ input: z.string(), expected: z.string() }))),
  hints: list(5, 300, /\r?\n/),
  options: z.preprocess(parseOptions, z.array(z.object({ text: z.string(), correct: z.boolean() }))),
  estimatedMinutes: int(1, 240),
  ...moderated,
});
export const experienceInput = z.object({
  slug,
  companyId: text(64, 1),
  role: text(120, 2),
  careerStage: z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(CAREER_STAGES).nullable()),
  experienceLevel: z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(EXPERIENCE_LEVEL).nullable()),
  reportedYear: optInt(1990, new Date().getFullYear()),
  summary: text(3000, 20),
  rounds: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v
            .split(/\r?\n/)
            .filter((l) => l.trim())
            .slice(0, 10)
            .map((l) => {
              const [t = "", ...d] = l.split(":");
              return { title: cleanText(t, 120), description: cleanText(d.join(":"), 600) };
            })
        : [],
    z.array(z.object({ title: z.string().min(1), description: z.string() })),
  ),
  topics: list(15),
  reportedQuestions: list(15, 300, /\r?\n/),
  advice: optText(2000),
  sourceUrl: url("the source", false),
  sourceRef: optText(300),
  ...moderated,
});
export const categoryInput = z.object({ name: text(80, 2), slug, parentSlug: optText(80), description: optText(300) });
export const tagInput = z.object({ name: text(40, 2) });

const csvList = (max: number) =>
  z.preprocess(
    (v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : typeof v === "string" ? v.split("|") : []),
    z.array(z.string()).max(max),
  );
export const publicationInput = z.object({ to: z.enum(PUBLICATION), note: optText(500) });

/** Public query. Everything is bounded: query length, page size, page number, list sizes. */
export const questionQuery = z.object({
  q: z.preprocess((v) => (typeof v === "string" ? v.trim().slice(0, 200) : ""), z.string()),
  category: z.string().max(80).optional().catch(undefined),
  difficulty: z.enum(DIFFICULTY).optional().catch(undefined),
  type: z.enum(QUESTION_TYPE).optional().catch(undefined),
  company: z.string().max(80).optional().catch(undefined),
  role: z.string().max(80).optional().catch(undefined),
  stage: z.enum(CAREER_STAGES).optional().catch(undefined),
  level: z.enum(EXPERIENCE_LEVEL).optional().catch(undefined),
  skill: z.string().max(60).optional().catch(undefined),
  origin: z.enum(ORIGIN).optional().catch(undefined),
  verification: z.enum(VERIFICATION).optional().catch(undefined),
  sort: z.enum(["relevance", "newest", "difficulty", "time"]).catch("relevance"),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
});
export type QuestionQuery = z.infer<typeof questionQuery>;
export const companyQuery = z.object({
  q: z.preprocess((v) => (typeof v === "string" ? v.trim().slice(0, 100) : ""), z.string()),
  industry: z.string().max(80).optional().catch(undefined),
  role: z.string().max(80).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
});
export const experienceQuery = z.object({
  company: z.string().max(80).optional().catch(undefined),
  level: z.enum(EXPERIENCE_LEVEL).optional().catch(undefined),
  stage: z.enum(CAREER_STAGES).optional().catch(undefined),
  q: z.preprocess((v) => (typeof v === "string" ? v.trim().slice(0, 100) : ""), z.string()),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
});

export const importQuestionRow = z.object({
  text: text(2000, 10),
  category: text(80, 1),
  type: z.preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase() : v), z.enum(QUESTION_TYPE)),
  difficulty: z.preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase() : v), z.enum(DIFFICULTY)),
  roles: csvList(10),
  careerStages: z.preprocess(
    (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? v.split("|").map((s) => s.trim().toUpperCase()) : []),
    z.array(z.enum(CAREER_STAGES)),
  ),
  experienceLevels: z.preprocess(
    (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? v.split("|").map((s) => s.trim().toUpperCase()) : []),
    z.array(z.enum(EXPERIENCE_LEVEL)),
  ),
  skills: csvList(15),
  tags: csvList(15),
  companies: csvList(10),
  answerOutline: text(3000, 2),
  explanation: optText(5000),
  exampleAnswer: optText(5000),
  codeSolution: optText(8000),
  codeLanguage: optText(30),
  hints: csvList(5),
  options: csvList(8),
  estimatedMinutes: z.preprocess((v) => (v === "" || v == null ? 5 : Number(v)), z.number().int().min(1).max(240)),
});
export const importCompanyRow = z.object({
  name: text(120, 2),
  website: url("the website"),
  careersUrl: url("the careers page"),
  industry: text(80, 2),
  description: optText(600),
  headquarters: optText(120),
  roleCategories: csvList(20),
});
export type CompanyQuery = z.infer<typeof companyQuery>;
export type ExperienceQuery = z.infer<typeof experienceQuery>;
