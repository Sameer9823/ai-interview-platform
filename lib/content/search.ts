import { db } from "./store";
import { normalizeKey } from "./sanitize";
import type { CompanyQuery, ExperienceQuery, QuestionQuery } from "./validation";
import {
  toCompanyCard,
  toExperienceCard,
  toPublicCompany,
  toPublicExperience,
  toPublicProcess,
  toPublicQuestion,
  toQuestionCard,
} from "./dto";
import type { Company, Question } from "./types";

/** Every list is server side paginated, bounded and deterministically sorted. User input is only ever tokenized, never turned into a pattern. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
const page = <T>(all: T[], p: number, size: number): Paged<T> => {
  const totalPages = Math.max(1, Math.ceil(all.length / size));
  const current = Math.min(p, totalPages);
  return { items: all.slice((current - 1) * size, current * size), total: all.length, page: current, pageSize: size, totalPages };
};
const tokens = (q: string) =>
  normalizeKey(q)
    .split(" ")
    .filter((t) => t.length > 1)
    .slice(0, 8)
    .map((t) => t.slice(0, 40));
const RANK = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 } as const;
const ok = (publication: string, all: boolean) => all || publication === "PUBLISHED";

export function descendantIds(slug: string): Set<string> | null {
  const cats = [...db().categories.values()];
  const root = cats.find((c) => c.slug === slug);
  if (!root) return null;
  const ids = new Set([root.id]);
  for (let grew = true; grew;) {
    grew = false;
    for (const c of cats)
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
  }
  return ids;
}
const pathNames = (q: Question) => {
  const out: string[] = [];
  let c = db().categories.get(q.categoryId);
  while (c) {
    out.push(c.name);
    c = c.parentId ? db().categories.get(c.parentId) : undefined;
  }
  return out.join(" ");
};

function score(q: Question, toks: string[]): number {
  if (!toks.length) return 0;
  const companyNames = q.companyIds.map((i) => db().companies.get(i)?.name ?? "").join(" ");
  const fields: [string, number][] = [
    [q.text, 5],
    [q.tagSlugs.join(" "), 3],
    [q.skills.join(" "), 3],
    [pathNames(q), 2],
    [companyNames, 2],
    [q.roles.join(" "), 2],
    [q.answerOutline, 1],
  ];
  const hay = fields.map(([s, w]) => [normalizeKey(s), w] as const);
  let total = 0;
  for (const t of toks) {
    const hit = hay.filter(([h]) => h.includes(t));
    if (!hit.length) return 0; // every word must match somewhere
    total += Math.max(...hit.map(([, w]) => w));
  }
  return total;
}

export function searchQuestions(
  query: QuestionQuery,
  opts: { includeUnpublished?: boolean } = {},
): Paged<ReturnType<typeof toQuestionCard>> {
  const all = !!opts.includeUnpublished,
    toks = tokens(query.q);
  const cats = query.category ? descendantIds(query.category) : null;
  const company = query.company ? [...db().companies.values()].find((c) => c.slug === query.company) : null;
  if ((query.category && !cats) || (query.company && !company)) return page([], query.page, query.pageSize);
  const rows = [...db().questions.values()]
    .filter(
      (q) =>
        ok(q.publication, all) &&
        (!cats || cats.has(q.categoryId)) &&
        (!query.difficulty || q.difficulty === query.difficulty) &&
        (!query.type || q.type === query.type) &&
        (!company || q.companyIds.includes(company.id)) &&
        (!query.role || q.roles.some((r) => r.toLowerCase() === query.role!.toLowerCase())) &&
        (!query.stage || !q.careerStages.length || q.careerStages.includes(query.stage)) &&
        (!query.level || !q.experienceLevels.length || q.experienceLevels.includes(query.level)) &&
        (!query.skill || q.skills.some((s) => s.toLowerCase().includes(query.skill!.toLowerCase()))) &&
        (!query.origin || q.origin === query.origin) &&
        (!query.verification || q.verification === query.verification),
    )
    .map((q) => ({ q, s: score(q, toks) }))
    .filter((r) => !toks.length || r.s > 0);
  const byNewest = (a: Question, b: Question) =>
    (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt) || a.id.localeCompare(b.id);
  rows.sort((a, b) =>
    query.sort === "difficulty"
      ? RANK[a.q.difficulty] - RANK[b.q.difficulty] || byNewest(a.q, b.q)
      : query.sort === "time"
        ? a.q.estimatedMinutes - b.q.estimatedMinutes || a.q.id.localeCompare(b.q.id)
        : query.sort === "relevance" && toks.length
          ? b.s - a.s || byNewest(a.q, b.q)
          : byNewest(a.q, b.q),
  );
  const p = page(rows, query.page, query.pageSize);
  return { ...p, items: p.items.map((r) => toQuestionCard(r.q)) };
}

export function searchCompanies(query: CompanyQuery, opts: { includeUnpublished?: boolean } = {}): Paged<ReturnType<typeof toCompanyCard>> {
  const toks = tokens(query.q),
    all = !!opts.includeUnpublished;
  const rows = [...db().companies.values()]
    .filter(
      (c) =>
        ok(c.publication, all) &&
        (!query.industry || c.industry.toLowerCase() === query.industry.toLowerCase()) &&
        (!query.role || c.roleCategories.some((r) => r.toLowerCase() === query.role!.toLowerCase())) &&
        toks.every((t) => normalizeKey(`${c.name} ${c.industry} ${c.roleCategories.join(" ")}`).includes(t)),
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const p = page(rows, query.page, query.pageSize);
  return { ...p, items: p.items.map(toCompanyCard) };
}
export const industries = () =>
  [...new Set([...db().companies.values()].filter((c) => c.publication === "PUBLISHED").map((c) => c.industry))].sort();

export function searchExperiences(
  query: ExperienceQuery,
  opts: { includeUnpublished?: boolean } = {},
): Paged<ReturnType<typeof toExperienceCard>> {
  const toks = tokens(query.q),
    all = !!opts.includeUnpublished;
  const company = query.company ? [...db().companies.values()].find((c) => c.slug === query.company) : null;
  if (query.company && !company) return page([], query.page, query.pageSize);
  const rows = [...db().experiences.values()]
    .filter(
      (e) =>
        ok(e.publication, all) &&
        (!company || e.companyId === company.id) &&
        (!query.level || e.experienceLevel === query.level) &&
        (!query.stage || e.careerStage === query.stage) &&
        toks.every((t) =>
          normalizeKey(`${e.role} ${e.summary} ${e.topics.join(" ")} ${db().companies.get(e.companyId)?.name ?? ""}`).includes(t),
        ),
    )
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt) || a.id.localeCompare(b.id));
  const p = page(rows, query.page, query.pageSize);
  return { ...p, items: p.items.map(toExperienceCard) };
}

export function relatedQuestions(q: Question, limit = 5) {
  return [...db().questions.values()]
    .filter((o) => o.id !== q.id && o.publication === "PUBLISHED")
    .map((o) => ({
      o,
      s:
        (o.categoryId === q.categoryId ? 3 : 0) +
        o.tagSlugs.filter((t) => q.tagSlugs.includes(t)).length * 2 +
        o.skills.filter((t) => q.skills.some((x) => x.toLowerCase() === t.toLowerCase())).length * 2 +
        o.companyIds.filter((c) => q.companyIds.includes(c)).length * 3 +
        (o.difficulty === q.difficulty ? 1 : 0),
    }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.o.id.localeCompare(b.o.id))
    .slice(0, Math.min(limit, 10))
    .map((r) => toQuestionCard(r.o));
}

export function getQuestion(slug: string, o: { includeUnpublished?: boolean } = {}) {
  const q = [...db().questions.values()].find((x) => x.slug === slug);
  return q && ok(q.publication, !!o.includeUnpublished) ? { question: toPublicQuestion(q), related: relatedQuestions(q), id: q.id } : null;
}
export function getCompany(slug: string, o: { includeUnpublished?: boolean } = {}) {
  const d = db(),
    c = [...d.companies.values()].find((x) => x.slug === slug);
  if (!c || !ok(c.publication, !!o.includeUnpublished)) return null;
  const all = !!o.includeUnpublished;
  const processes = [...d.processes.values()]
    .filter((p) => p.companyId === c.id && ok(p.publication, all))
    .sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99) || a.id.localeCompare(b.id))
    .map(toPublicProcess);
  const questions = [...d.questions.values()]
    .filter((q) => q.companyIds.includes(c.id) && ok(q.publication, all))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 10)
    .map(toQuestionCard);
  const experiences = [...d.experiences.values()]
    .filter((e) => e.companyId === c.id && ok(e.publication, all))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 10)
    .map(toExperienceCard);
  return { company: toPublicCompany(c), processes, questions, experiences };
}
export function getExperience(slug: string, o: { includeUnpublished?: boolean } = {}) {
  const e = [...db().experiences.values()].find((x) => x.slug === slug);
  return e && ok(e.publication, !!o.includeUnpublished) ? toPublicExperience(e) : null;
}
export function getTopic(slug: string) {
  const c = [...db().categories.values()].find((x) => x.slug === slug);
  if (!c) return null;
  const children = [...db().categories.values()]
    .filter((x) => x.parentId === c.id)
    .sort((a, b) => a.order - b.order)
    .map((x) => ({ slug: x.slug, name: x.name }));
  return { slug: c.slug, name: c.name, description: c.description, children };
}
export function topicTree() {
  const cats = [...db().categories.values()].sort((a, b) => a.order - b.order);
  const pub = [...db().questions.values()].filter((q) => q.publication === "PUBLISHED");
  const count = (id: string) => {
    const ids = new Set([id]);
    for (let g = true; g;) {
      g = false;
      for (const c of cats)
        if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          g = true;
        }
    }
    return pub.filter((q) => ids.has(q.categoryId)).length;
  };
  return cats
    .filter((c) => !c.parentId)
    .map((root) => ({
      slug: root.slug,
      name: root.name,
      count: count(root.id),
      children: cats.filter((c) => c.parentId === root.id).map((c) => ({ slug: c.slug, name: c.name, count: count(c.id) })),
    }));
}
export const allCompanyOptions = (): Company[] => [...db().companies.values()].sort((a, b) => a.name.localeCompare(b.name));

// ---------- bookmarks ----------
export function toggleSaved(userId: string, questionId: string): boolean {
  const q = db().questions.get(questionId);
  if (!q || q.publication !== "PUBLISHED") throw new Error("Question not available");
  const set = db().saved.get(userId) ?? new Set<string>();
  const saved = !set.has(questionId);
  if (saved) set.add(questionId);
  else set.delete(questionId);
  db().saved.set(userId, set);
  return saved;
}
export const isSaved = (userId: string, questionId: string) => db().saved.get(userId)?.has(questionId) ?? false;
export function listSaved(userId: string, p = 1, size = 12) {
  const ids = [...(db().saved.get(userId) ?? [])];
  const qs = ids
    .map((i) => db().questions.get(i))
    .filter((q): q is Question => !!q && q.publication === "PUBLISHED")
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const hidden = ids.length - qs.length;
  return { ...page(qs.map(toQuestionCard), p, size), hidden };
}
export const clearSaved = (userId: string) => db().saved.delete(userId);

// ---------- option lists for filter forms ----------
export function categoryOptions(): { slug: string; label: string }[] {
  const cats = [...db().categories.values()].sort((a, b) => a.order - b.order);
  const out: { slug: string; label: string }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of cats.filter((x) => x.parentId === parent)) {
      out.push({ slug: c.slug, label: `${"\u2003".repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
export const publishedCompanyOptions = () =>
  [...db().companies.values()]
    .filter((c) => c.publication === "PUBLISHED")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ slug: c.slug, name: c.name }));
