// Prints what the sample seed creates. Used to keep docs/PHASE2.md accurate.
import { seedContent } from "../lib/content/seed";
import type { ContentDb } from "../lib/content/store";

const db = {
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
} as unknown as ContentDb;
const first = seedContent(db),
  again = seedContent(db);
const count = <T>(m: Map<string, T>, f: (x: T) => string) =>
  Object.entries([...m.values()].reduce<Record<string, number>>((a, x) => ((a[f(x)] = (a[f(x)] ?? 0) + 1), a), {}));
console.log(
  JSON.stringify(
    {
      createdFirstRun: first.created,
      createdSecondRun: again.created,
      sources: db.sources.size,
      categories: db.categories.size,
      tags: db.tags.size,
      companies: db.companies.size,
      questions: db.questions.size,
      experiences: db.experiences.size,
      processes: db.processes.size,
      sourcePermissions: count(db.sources, (s: { permission: string }) => s.permission),
      sourceTypes: count(db.sources, (s: { type: string }) => s.type),
      questionDifficulty: count(db.questions, (q: { difficulty: string }) => q.difficulty),
      questionTypes: count(db.questions, (q: { type: string }) => q.type),
    },
    null,
    1,
  ),
);
