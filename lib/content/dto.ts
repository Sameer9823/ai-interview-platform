import { db } from "./store";
import { LABELS, type Company, type Experience, type InterviewProcess, type Question, type Source } from "./types";

/**
 * Public shapes are built field by field. Nothing is spread from the stored record, so private fields
 * (moderator notes, source ids, internal status history) cannot leak by accident when a model grows.
 */
export interface PublicSource {
  title: string;
  url: string | null;
  domain: string;
  typeLabel: string;
  publisher: string;
  attribution: string;
  permissionLabel: string;
}
const sources = (ids: string[]): PublicSource[] =>
  ids
    .map((i) => db().sources.get(i))
    .filter((s): s is Source => !!s)
    .map((s) => ({
      title: s.title,
      url: s.domain.endsWith(".invalid") ? null : s.url,
      domain: s.domain.endsWith(".invalid") ? "" : s.domain,
      typeLabel: LABELS.sourceType[s.type],
      publisher: s.publisher,
      attribution: s.attribution,
      permissionLabel: LABELS.permission[s.permission],
    }));
const provenance = (e: { origin: keyof typeof LABELS.origin; verification: keyof typeof LABELS.verification; sourceIds: string[] }) => ({
  origin: e.origin,
  originLabel: LABELS.origin[e.origin],
  originNote: LABELS.originNote[e.origin],
  verification: e.verification,
  verificationLabel: LABELS.verification[e.verification],
  sources: sources(e.sourceIds),
});
export const categoryPath = (id: string): { slug: string; name: string }[] => {
  const out: { slug: string; name: string }[] = [];
  let c = db().categories.get(id);
  while (c) {
    out.unshift({ slug: c.slug, name: c.name });
    c = c.parentId ? db().categories.get(c.parentId) : undefined;
  }
  return out;
};
const companyRefs = (ids: string[]) =>
  ids
    .map((i) => db().companies.get(i))
    .filter((c): c is Company => !!c && c.publication === "PUBLISHED")
    .map((c) => ({ slug: c.slug, name: c.name }));

export function toQuestionCard(q: Question) {
  const path = categoryPath(q.categoryId);
  return {
    slug: q.slug,
    text: q.text,
    category: path[path.length - 1] ?? null,
    type: q.type,
    typeLabel: LABELS.questionType[q.type],
    difficulty: q.difficulty,
    difficultyLabel: LABELS.difficulty[q.difficulty],
    estimatedMinutes: q.estimatedMinutes,
    skills: q.skills.slice(0, 4),
    companies: companyRefs(q.companyIds),
    originLabel: LABELS.origin[q.origin],
    origin: q.origin,
    verification: q.verification,
    verificationLabel: LABELS.verification[q.verification],
    publication: q.publication,
  };
}
export function toPublicQuestion(q: Question) {
  return {
    ...toQuestionCard(q),
    path: categoryPath(q.categoryId),
    roles: q.roles,
    careerStages: q.careerStages.map((s) => LABELS.careerStage[s]),
    experienceLevels: q.experienceLevels.map((s) => LABELS.level[s]),
    skills: q.skills,
    tags: q.tagSlugs,
    answerOutline: q.answerOutline,
    explanation: q.explanation,
    exampleAnswer: q.exampleAnswer,
    codeSolution: q.codeSolution,
    codeLanguage: q.codeLanguage,
    testCases: q.testCases.map((t) => ({ input: t.input, expected: t.expected })),
    hints: q.hints,
    options: q.options.map((o) => ({ text: o.text, correct: o.correct })),
    updatedAt: q.updatedAt,
    ...provenance(q),
  };
}
export function toPublicProcess(p: InterviewProcess) {
  return {
    id: p.id,
    title: p.title,
    roleFamily: p.roleFamily,
    experienceLevels: p.experienceLevels.map((s) => LABELS.level[s]),
    careerStages: p.careerStages.map((s) => LABELS.careerStage[s]),
    sequence: p.sequence,
    kindLabel: LABELS.roundKind[p.kind],
    description: p.description,
    skillsEvaluated: p.skillsEvaluated,
    prepRecommendations: p.prepRecommendations,
    lastReviewedAt: p.lastReviewedAt,
    ...provenance(p),
  };
}
export function toCompanyCard(c: Company) {
  const d = db();
  return {
    slug: c.slug,
    name: c.name,
    industry: c.industry,
    logoUrl: c.logoUrl,
    roleCategories: c.roleCategories,
    verification: c.verification,
    verificationLabel: LABELS.verification[c.verification],
    originLabel: LABELS.origin[c.origin],
    counts: {
      questions: [...d.questions.values()].filter((q) => q.publication === "PUBLISHED" && q.companyIds.includes(c.id)).length,
      experiences: [...d.experiences.values()].filter((e) => e.publication === "PUBLISHED" && e.companyId === c.id).length,
      processes: [...d.processes.values()].filter((p) => p.publication === "PUBLISHED" && p.companyId === c.id).length,
    },
    publication: c.publication,
  };
}
export function toPublicCompany(c: Company) {
  return {
    ...toCompanyCard(c),
    website: c.website,
    careersUrl: c.careersUrl,
    description: c.description,
    headquarters: c.headquarters,
    hiringInfo: c.hiringInfo,
    lastVerifiedAt: c.lastVerifiedAt,
    updatedAt: c.updatedAt,
    prepCategories: c.prepCategories
      .map((s) => [...db().categories.values()].find((x) => x.slug === s))
      .filter((x) => !!x)
      .map((x) => ({ slug: x!.slug, name: x!.name })),
    ...provenance(c),
  };
}
export function toExperienceCard(e: Experience) {
  const c = db().companies.get(e.companyId);
  return {
    slug: e.slug,
    company: c ? { slug: c.slug, name: c.name } : null,
    role: e.role,
    careerStage: e.careerStage ? LABELS.careerStage[e.careerStage] : null,
    level: e.experienceLevel ? LABELS.level[e.experienceLevel] : null,
    reportedYear: e.reportedYear,
    summary: e.summary.slice(0, 220),
    originLabel: LABELS.origin[e.origin],
    verificationLabel: LABELS.verification[e.verification],
    publication: e.publication,
  };
}
export function toPublicExperience(e: Experience) {
  return {
    ...toExperienceCard(e),
    summary: e.summary,
    rounds: e.rounds.map((r) => ({ title: r.title, description: r.description })),
    topics: e.topics,
    reportedQuestions: e.reportedQuestions,
    advice: e.advice,
    sourceUrl: e.sourceUrl || null,
    sourceRef: e.sourceRef,
    lastReviewedAt: e.lastReviewedAt,
    ...provenance(e),
  };
}
