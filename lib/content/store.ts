import { seedContent } from "./seed";
import type { AuditEntry, Category, Company, Experience, ImportJob, InterviewProcess, Question, Revision, Source, Tag } from "./types";

export interface ContentDb {
  sources: Map<string, Source>;
  categories: Map<string, Category>;
  tags: Map<string, Tag>;
  companies: Map<string, Company>;
  processes: Map<string, InterviewProcess>;
  questions: Map<string, Question>;
  experiences: Map<string, Experience>;
  revisions: Revision[];
  audit: AuditEntry[];
  imports: Map<string, ImportJob>;
  saved: Map<string, Set<string>>;
}

const g = globalThis as unknown as { __ipContent?: ContentDb };

export function emptyDb(): ContentDb {
  return {
    sources: new Map(),
    categories: new Map(),
    tags: new Map(),
    companies: new Map(),
    processes: new Map(),
    questions: new Map(),
    experiences: new Map(),
    revisions: [],
    audit: [],
    imports: new Map(),
    saved: new Map(),
  };
}

/** DEV ONLY in memory content store, same pattern as the Phase 1 user store. Replace with Prisma queries. Seeded once, idempotently. */
export function db(): ContentDb {
  if (!g.__ipContent) {
    g.__ipContent = emptyDb();
    seedContent(g.__ipContent);
  }
  return g.__ipContent;
}

/** Test helper: replace the store with a fresh one. */
export function resetContentDb(seed = false): ContentDb {
  g.__ipContent = emptyDb();
  if (seed) seedContent(g.__ipContent);
  return g.__ipContent;
}
