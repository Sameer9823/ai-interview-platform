import type { ContentDb } from "./store";
import { SEED_CATEGORIES, SEED_COMPANIES, SEED_QUESTIONS, SEED_SOURCES } from "./seed-data";
import { parseOptions, parseTestCases } from "./validation";
import type { Company, Question, Source } from "./types";

/** Idempotent: every record is keyed by slug, so running it twice creates nothing new. Sample data only, never mixed with imports. */
export function seedContent(db: ContentDb): { created: number } {
  const at = new Date().toISOString();
  const id = () => crypto.randomUUID();
  let created = 0;
  const bySlug = <T extends { slug: string }>(m: Map<string, T>, slug: string) => [...m.values()].find((x) => x.slug === slug);

  for (const s of SEED_SOURCES) {
    if (bySlug(db.sources, s.slug)) continue;
    const row: Source = {
      id: id(),
      slug: s.slug,
      title: s.title,
      url: s.url,
      domain: new URL(s.url).hostname,
      type: s.type,
      publisher: s.publisher,
      description: "",
      licenseNotes: "",
      attribution: s.publisher && s.permission !== "APPROVED" ? `Link to ${s.publisher}` : "",
      permission: s.permission,
      commercialUse: s.permission === "APPROVED" ? "APPROVED" : "UNKNOWN",
      redistribution: s.permission === "APPROVED" ? "APPROVED" : "UNKNOWN",
      accessMethod: "Manual link",
      lastCheckedAt: null,
      lastImportAt: null,
      reliability: "UNRATED",
      reviewStatus: s.permission === "APPROVED" ? "REVIEWED" : "UNREVIEWED",
      notes: s.note,
      createdAt: at,
      updatedAt: at,
    };
    db.sources.set(row.id, row);
    created++;
  }
  const src = (slug: string) => bySlug(db.sources, slug)!;

  SEED_CATEGORIES.forEach(([slug, name, parent], order) => {
    if (bySlug(db.categories, slug)) return;
    const c = { id: id(), slug, name, parentId: parent ? bySlug(db.categories, parent)!.id : null, description: "", order };
    db.categories.set(c.id, c);
    created++;
  });
  const tagSlugs = new Set(SEED_QUESTIONS.flatMap((q) => q.tags ?? []));
  for (const slug of tagSlugs)
    if (!bySlug(db.tags, slug)) {
      const t = { id: id(), slug, name: slug };
      db.tags.set(t.id, t);
      created++;
    }

  for (const c of SEED_COMPANIES) {
    if (bySlug(db.companies, c.slug)) continue;
    const s = src(c.source);
    const row: Company = {
      id: id(),
      slug: c.slug,
      name: c.name,
      website: c.website,
      careersUrl: s.url,
      logoUrl: "",
      industry: c.industry,
      description: "",
      headquarters: "",
      hiringInfo: "",
      roleCategories: [],
      prepCategories: [],
      origin: "ADMIN_CURATED",
      verification: "NOT_VERIFIED",
      publication: "PUBLISHED",
      publishedAt: at,
      lastVerifiedAt: null,
      sourceIds: [s.id],
      moderatorNotes: "Sample entry. Name, industry and links have not been verified by an administrator.",
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    db.companies.set(row.id, row);
    created++;
  }

  const platform = src("platform-original");
  for (const q of SEED_QUESTIONS) {
    if (bySlug(db.questions, q.slug)) continue;
    const cat = bySlug(db.categories, q.cat);
    if (!cat) throw new Error(`Seed question ${q.slug} uses unknown category ${q.cat}`);
    const row: Question = {
      id: id(),
      slug: q.slug,
      text: q.text,
      categoryId: cat.id,
      type: q.type,
      difficulty: q.diff,
      companyIds: [],
      roles: q.roles ?? [],
      careerStages: q.stages ?? [],
      experienceLevels: [],
      skills: q.skills ?? [],
      tagSlugs: q.tags ?? [],
      answerOutline: q.outline,
      explanation: q.explanation ?? "",
      exampleAnswer: q.example ?? "",
      codeSolution: q.code ?? "",
      codeLanguage: q.lang ?? "",
      testCases: parseTestCases((q.tests ?? []).join("\n")),
      hints: q.hints ?? [],
      options: parseOptions(q.options ?? []),
      estimatedMinutes: q.minutes,
      origin: "PLATFORM_ORIGINAL",
      verification: "NOT_VERIFIED",
      publication: "PUBLISHED",
      publishedAt: at,
      sourceIds: [platform.id],
      moderatorNotes: "Sample practice question written for the platform. Answer not yet independently reviewed.",
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    db.questions.set(row.id, row);
    created++;
  }
  return { created };
}
