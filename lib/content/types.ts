import type { CareerStage } from "@/lib/permissions";

export const PUBLICATION = ["DRAFT", "IN_REVIEW", "PUBLISHED", "UNPUBLISHED", "ARCHIVED", "REJECTED"] as const;
export const VERIFICATION = ["NOT_VERIFIED", "VERIFIED", "OUTDATED", "REJECTED"] as const;
export const ORIGIN = [
  "OFFICIAL",
  "CANDIDATE_REPORTED",
  "COMMUNITY_REPORTED",
  "ADMIN_CURATED",
  "PLATFORM_ORIGINAL",
  "AI_GENERATED",
] as const;
export const SOURCE_TYPE = [
  "OFFICIAL_CAREERS",
  "OFFICIAL_DOCS",
  "PUBLIC_EXPERIENCE",
  "EDUCATIONAL",
  "OPEN_DATASET",
  "GITHUB_REPO",
  "MANUAL_CURATION",
  "PLATFORM_ORIGINAL",
  "USER_SUBMITTED",
] as const;
export const PERMISSION = ["APPROVED", "ATTRIBUTION_REQUIRED", "LINK_ONLY", "MANUAL_REVIEW_REQUIRED", "NOT_APPROVED", "UNKNOWN"] as const;
export const RELIABILITY = ["HIGH", "MEDIUM", "LOW", "UNRATED"] as const;
export const SOURCE_REVIEW = ["UNREVIEWED", "REVIEWED", "REJECTED"] as const;
export const QUESTION_TYPE = [
  "MULTIPLE_CHOICE",
  "SINGLE_ANSWER",
  "SHORT_ANSWER",
  "LONG_ANSWER",
  "CODING",
  "SQL",
  "SCENARIO",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "COMMUNICATION",
] as const;
export const DIFFICULTY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const ROUND_KIND = [
  "ONLINE_ASSESSMENT",
  "APTITUDE",
  "CODING",
  "TECHNICAL",
  "SYSTEM_DESIGN",
  "MANAGERIAL",
  "HR_BEHAVIORAL",
  "CASE_STUDY",
  "OTHER",
] as const;
export const EXPERIENCE_LEVEL = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const CAREER_STAGES = ["STUDENT", "FRESHER", "PROFESSIONAL"] as const;

export type Publication = (typeof PUBLICATION)[number];
export type Verification = (typeof VERIFICATION)[number];
export type Origin = (typeof ORIGIN)[number];
export type SourceType = (typeof SOURCE_TYPE)[number];
export type Permission = (typeof PERMISSION)[number];
export type QuestionType = (typeof QUESTION_TYPE)[number];
export type Difficulty = (typeof DIFFICULTY)[number];
export type RoundKind = (typeof ROUND_KIND)[number];
export type Level = (typeof EXPERIENCE_LEVEL)[number];
export type ContentKind = "company" | "process" | "question" | "experience";

export const LABELS = {
  publication: {
    DRAFT: "Draft",
    IN_REVIEW: "In review",
    PUBLISHED: "Published",
    UNPUBLISHED: "Unpublished",
    ARCHIVED: "Archived",
    REJECTED: "Rejected",
  },
  verification: { NOT_VERIFIED: "Not yet verified", VERIFIED: "Verified", OUTDATED: "Outdated", REJECTED: "Rejected" },
  origin: {
    OFFICIAL: "Officially documented",
    CANDIDATE_REPORTED: "Candidate reported",
    COMMUNITY_REPORTED: "Community reported",
    ADMIN_CURATED: "Administrator curated",
    PLATFORM_ORIGINAL: "Original practice content",
    AI_GENERATED: "AI generated practice content",
  },
  originNote: {
    OFFICIAL: "Published by the company itself.",
    CANDIDATE_REPORTED: "Reported by a candidate. Not confirmed by the company. Processes vary between candidates.",
    COMMUNITY_REPORTED: "Reported by a community source. Not confirmed by the company.",
    ADMIN_CURATED: "Added by a platform administrator from the listed sources.",
    PLATFORM_ORIGINAL: "Written for this platform. It is not a real company interview question.",
    AI_GENERATED: "Drafted with AI and reviewed by an administrator. It is not a real company interview question.",
  },
  difficulty: { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" },
  questionType: {
    MULTIPLE_CHOICE: "Multiple choice",
    SINGLE_ANSWER: "Single answer",
    SHORT_ANSWER: "Short answer",
    LONG_ANSWER: "Long answer",
    CODING: "Coding problem",
    SQL: "SQL problem",
    SCENARIO: "Scenario",
    BEHAVIORAL: "Behavioral",
    SYSTEM_DESIGN: "System design",
    COMMUNICATION: "Communication prompt",
  },
  roundKind: {
    ONLINE_ASSESSMENT: "Online assessment",
    APTITUDE: "Aptitude and reasoning",
    CODING: "Coding assessment",
    TECHNICAL: "Technical interview",
    SYSTEM_DESIGN: "System design",
    MANAGERIAL: "Managerial interview",
    HR_BEHAVIORAL: "HR or behavioral interview",
    CASE_STUDY: "Case study or domain round",
    OTHER: "Other",
  },
  permission: {
    APPROVED: "Approved",
    ATTRIBUTION_REQUIRED: "Attribution required",
    LINK_ONLY: "Link only",
    MANUAL_REVIEW_REQUIRED: "Manual review required",
    NOT_APPROVED: "Not approved",
    UNKNOWN: "Unknown",
  },
  sourceType: {
    OFFICIAL_CAREERS: "Official company careers page",
    OFFICIAL_DOCS: "Official documentation",
    PUBLIC_EXPERIENCE: "Public interview experience",
    EDUCATIONAL: "Educational resource",
    OPEN_DATASET: "Open license dataset",
    GITHUB_REPO: "GitHub repository",
    MANUAL_CURATION: "Manually curated content",
    PLATFORM_ORIGINAL: "Original platform content",
    USER_SUBMITTED: "User submitted content",
  },
  reliability: { HIGH: "High", MEDIUM: "Medium", LOW: "Low", UNRATED: "Unrated" },
  sourceReview: { UNREVIEWED: "Not yet reviewed", REVIEWED: "Reviewed", REJECTED: "Rejected" },
  careerStage: { STUDENT: "Student", FRESHER: "Fresher", PROFESSIONAL: "Working professional" },
  level: { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" },
} as const;

interface Stamped {
  createdAt: string;
  updatedAt: string;
}

export interface Source extends Stamped {
  id: string;
  slug: string;
  title: string;
  url: string;
  domain: string;
  type: SourceType;
  publisher: string;
  description: string;
  licenseNotes: string;
  attribution: string;
  permission: Permission;
  commercialUse: Permission;
  redistribution: Permission;
  accessMethod: string;
  lastCheckedAt: string | null;
  lastImportAt: string | null;
  reliability: (typeof RELIABILITY)[number];
  reviewStatus: (typeof SOURCE_REVIEW)[number];
  notes: string;
}
export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  description: string;
  order: number;
}
export interface Tag {
  id: string;
  slug: string;
  name: string;
}

interface Moderated extends Stamped {
  id: string;
  origin: Origin;
  verification: Verification;
  publication: Publication;
  sourceIds: string[];
  /** Private. Never included in public DTOs. */ moderatorNotes: string;
  version: number;
  publishedAt: string | null;
}
export interface Company extends Moderated {
  slug: string;
  name: string;
  website: string;
  careersUrl: string;
  logoUrl: string;
  industry: string;
  description: string;
  headquarters: string;
  hiringInfo: string;
  roleCategories: string[];
  prepCategories: string[];
  lastVerifiedAt: string | null;
}
export interface InterviewProcess extends Moderated {
  companyId: string;
  title: string;
  roleFamily: string;
  experienceLevels: Level[];
  careerStages: CareerStage[];
  sequence: number | null;
  kind: RoundKind;
  description: string;
  skillsEvaluated: string[];
  prepRecommendations: string;
  lastReviewedAt: string | null;
}
export interface McqOption {
  text: string;
  correct: boolean;
}
export interface TestCase {
  input: string;
  expected: string;
}
export interface Question extends Moderated {
  slug: string;
  text: string;
  categoryId: string;
  type: QuestionType;
  difficulty: Difficulty;
  companyIds: string[];
  roles: string[];
  careerStages: CareerStage[];
  experienceLevels: Level[];
  skills: string[];
  tagSlugs: string[];
  answerOutline: string;
  explanation: string;
  exampleAnswer: string;
  codeSolution: string;
  codeLanguage: string;
  testCases: TestCase[];
  hints: string[];
  options: McqOption[];
  estimatedMinutes: number;
}
export interface Experience extends Moderated {
  slug: string;
  companyId: string;
  role: string;
  careerStage: CareerStage | null;
  experienceLevel: Level | null;
  reportedYear: number | null;
  summary: string;
  rounds: { title: string; description: string }[];
  topics: string[];
  reportedQuestions: string[];
  advice: string;
  sourceUrl: string;
  sourceRef: string;
  lastReviewedAt: string | null;
}
export interface Revision {
  id: string;
  kind: ContentKind;
  entityId: string;
  version: number;
  at: string;
  actorId: string;
  changed: string[];
  snapshot: unknown;
}
export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}

export interface RowError {
  row: number;
  messages: string[];
  preview: string;
}
export interface StagedRecord {
  row: number;
  status: "VALID" | "INVALID" | "DUPLICATE" | "SKIPPED";
  data: Record<string, unknown> | null;
  errors: string[];
  duplicateOf?: string;
  preview: string;
}
export interface ImportJob {
  id: string;
  sourceId: string;
  kind: "questions" | "companies";
  filename: string;
  fileHash: string;
  createdBy: string;
  createdAt: string;
  committedAt: string | null;
  status: "PREVIEWED" | "COMMITTED" | "FAILED" | "BLOCKED" | "ALREADY_IMPORTED";
  counts: { total: number; valid: number; invalid: number; duplicate: number; skipped: number; created: number };
  staged: StagedRecord[];
  message: string;
}
