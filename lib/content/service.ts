import { companyInput, experienceInput, processInput, questionInput, sourceInput, categoryInput, tagInput } from "./validation";
import { db } from "./store";
import { cleanText, normalizeKey, safeExternalUrl, slugify } from "./sanitize";
import type {
  Category,
  Company,
  ContentKind,
  Experience,
  InterviewProcess,
  Publication,
  Question,
  Revision,
  Source,
  SourceType,
  Tag,
} from "./types";
import type { z } from "zod";

export interface Actor {
  id: string;
  platformRole: "NONE" | "ADMIN";
}
export type ErrorCode = "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "BLOCKED";
export class ContentError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public fieldErrors: Record<string, string> = {},
    public reasons: string[] = [],
  ) {
    super(message);
    this.name = "ContentError";
  }
}

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

/** Every admin operation starts here. The actor comes from the server session, never from the request body. */
export function assertAdmin(actor: Actor | null | undefined): asserts actor is Actor {
  if (!actor || actor.platformRole !== "ADMIN") throw new ContentError("FORBIDDEN", "Administrator access is required");
}

export function audit(actor: Actor, action: string, entityType: string, entityId: string, summary: string) {
  db().audit.unshift({ id: uid(), at: now(), actorId: actor.id, action, entityType, entityId, summary: cleanText(summary, 300) });
  if (db().audit.length > 5000) db().audit.length = 5000;
}

function parse<S extends z.ZodTypeAny>(schema: S, raw: unknown): z.output<S> {
  const r = schema.safeParse(raw);
  if (r.success) return r.data;
  const fieldErrors: Record<string, string> = {};
  for (const i of r.error.issues) {
    const k = String(i.path[0] ?? "form");
    if (!(k in fieldErrors)) fieldErrors[k] = i.message;
  }
  throw new ContentError(
    "VALIDATION",
    `Some fields need attention: ${Object.entries(fieldErrors)
      .map(([k, v]) => `${k} (${v})`)
      .join("; ")}`,
    fieldErrors,
  );
}

const EVIDENCE: SourceType[] = ["OFFICIAL_CAREERS", "OFFICIAL_DOCS", "PUBLIC_EXPERIENCE", "USER_SUBMITTED", "GITHUB_REPO"];
const USABLE = ["APPROVED", "ATTRIBUTION_REQUIRED", "LINK_ONLY"];

function sourcesOf(ids: string[]): Source[] {
  const out: Source[] = [];
  for (const id of ids) {
    const s = db().sources.get(id);
    if (!s) throw new ContentError("VALIDATION", "Unknown source", { sourceIds: "One of the selected sources does not exist" });
    out.push(s);
  }
  return out;
}
/** Unknown or restricted permission is never treated as permission to publish. */
export function sourceBlockers(sources: Source[]): string[] {
  if (!sources.length) return ["Add at least one source so the content can be traced"];
  const out: string[] = [];
  for (const s of sources) {
    if (s.reviewStatus === "REJECTED") out.push(`Source "${s.title}" was rejected in review`);
    else if (!USABLE.includes(s.permission))
      out.push(`Source "${s.title}" is not cleared for use (permission: ${s.permission.toLowerCase().replace(/_/g, " ")})`);
  }
  return out;
}

function uniqueSlug<T extends { slug: string; id: string }>(map: Map<string, T>, base: string, selfId?: string): string {
  const root = slugify(base) || "item";
  let slug = root,
    n = 2;
  while ([...map.values()].some((x) => x.slug === slug && x.id !== selfId)) slug = `${root}-${n++}`;
  return slug;
}
function slugClash<T extends { slug: string; id: string }>(map: Map<string, T>, slug: string, selfId?: string) {
  if ([...map.values()].some((x) => x.slug === slug && x.id !== selfId))
    throw new ContentError("CONFLICT", "That slug is already in use", { slug: "That slug is already in use" });
}
const slugOf = <T extends { slug: string }>(m: Map<string, T>, slug: string) => [...m.values()].find((x) => x.slug === slug);

function snapshot<T>(o: T): T {
  return structuredClone(o);
}
function changedKeys(a: object, b: object): string[] {
  const x = a as Record<string, unknown>,
    y = b as Record<string, unknown>;
  return Object.keys(y).filter(
    (k) => !["updatedAt", "version", "publishedAt"].includes(k) && JSON.stringify(x[k]) !== JSON.stringify(y[k]),
  );
}
function revise(actor: Actor, kind: ContentKind, e: { id: string; version: number }, changed: string[]) {
  const r: Revision = { id: uid(), kind, entityId: e.id, version: e.version, at: now(), actorId: actor.id, changed, snapshot: snapshot(e) };
  db().revisions.unshift(r);
}
export const revisionsFor = (kind: ContentKind, id: string) => db().revisions.filter((r) => r.kind === kind && r.entityId === id);

// ---------- publication workflow ----------
const NEXT: Record<Publication, Publication[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["PUBLISHED", "REJECTED", "DRAFT"],
  PUBLISHED: ["UNPUBLISHED", "ARCHIVED", "IN_REVIEW"],
  UNPUBLISHED: ["IN_REVIEW", "DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
  REJECTED: ["DRAFT", "ARCHIVED"],
};
export const canTransition = (from: Publication, to: Publication) => NEXT[from].includes(to);

type Entity = Company | InterviewProcess | Question | Experience;
const mapFor = (kind: ContentKind) =>
  ({ company: db().companies, process: db().processes, question: db().questions, experience: db().experiences })[kind] as Map<
    string,
    Entity
  >;

export function publishBlockers(kind: ContentKind, e: Entity): string[] {
  const srcs = e.sourceIds.map((i) => db().sources.get(i)).filter((s): s is Source => !!s);
  const out = sourceBlockers(srcs);
  if (kind === "question") {
    const q = e as Question;
    if (q.answerOutline.trim().length < 2) out.push("Add an answer outline");
    if (q.type === "MULTIPLE_CHOICE" && (q.options.length < 2 || !q.options.some((o) => o.correct)))
      out.push("Multiple choice questions need at least two options and one correct option");
    if (q.companyIds.length && (["PLATFORM_ORIGINAL", "AI_GENERATED"].includes(q.origin) || !srcs.some((s) => EVIDENCE.includes(s.type))))
      out.push("Company tags need a source that supports them, and are not allowed on original practice questions");
    if (q.origin === "AI_GENERATED" && q.verification !== "VERIFIED")
      out.push("AI generated questions need a human review marked Verified before publishing");
  }
  if (kind === "company") {
    const c = e as Company;
    if (c.hiringInfo.trim() && !srcs.some((s) => s.type === "OFFICIAL_CAREERS" || s.type === "OFFICIAL_DOCS"))
      out.push("Publicly documented hiring information needs an official source");
  }
  if (kind === "experience") {
    const x = e as Experience;
    if (!["CANDIDATE_REPORTED", "COMMUNITY_REPORTED"].includes(x.origin))
      out.push("Interview experiences must be labeled candidate reported or community reported");
    if (!x.sourceUrl && !x.sourceRef.trim()) out.push("Keep the original source URL or submission reference");
    if (!db().companies.has(x.companyId)) out.push("The company no longer exists");
  }
  if (kind === "process") {
    const p = e as InterviewProcess;
    if (!db().companies.has(p.companyId)) out.push("The company no longer exists");
    if (p.origin === "OFFICIAL" && !srcs.some((s) => s.type === "OFFICIAL_CAREERS" || s.type === "OFFICIAL_DOCS"))
      out.push("Officially documented processes need an official source");
  }
  return out;
}

export function setPublication(actor: Actor | null, kind: ContentKind, id: string, to: Publication, note = "") {
  assertAdmin(actor);
  const e = mapFor(kind).get(id);
  if (!e) throw new ContentError("NOT_FOUND", "Content not found");
  if (e.publication === to) return e;
  if (!canTransition(e.publication, to))
    throw new ContentError("BLOCKED", `Cannot move from ${e.publication} to ${to}`, {}, [
      `Allowed from ${e.publication}: ${NEXT[e.publication].join(", ")}`,
    ]);
  if (to === "PUBLISHED") {
    const b = publishBlockers(kind, e);
    if (b.length) throw new ContentError("BLOCKED", "This content cannot be published yet", {}, b);
  }
  if (to === "REJECTED" && !note.trim())
    throw new ContentError("VALIDATION", "Add a note explaining the rejection", { note: "A rejection needs a note" });
  const from = e.publication;
  e.publication = to;
  e.updatedAt = now();
  if (to === "PUBLISHED") e.publishedAt = now();
  if (note.trim())
    e.moderatorNotes = `${e.moderatorNotes}${e.moderatorNotes ? "\n" : ""}[${now().slice(0, 10)}] ${cleanText(note, 500)}`.slice(-2000);
  audit(actor, `status.${to.toLowerCase()}`, kind, id, `${kind} moved ${from} to ${to}`);
  return e;
}

export interface BulkResult {
  id: string;
  ok: boolean;
  reason?: string;
}
/** Bulk changes go through exactly the same gates as single changes. A confirmation is required. */
export function bulkSetPublication(
  actor: Actor | null,
  kind: ContentKind,
  ids: string[],
  to: Publication,
  confirmed: boolean,
): BulkResult[] {
  assertAdmin(actor);
  if (!confirmed) throw new ContentError("VALIDATION", "Confirm the bulk change first", { confirm: "Tick the box to confirm" });
  if (!ids.length || ids.length > 100)
    throw new ContentError("VALIDATION", "Select between 1 and 100 items", { ids: "Select between 1 and 100 items" });
  const results = [...new Set(ids)].map((id): BulkResult => {
    try {
      setPublication(actor, kind, id, to);
      return { id, ok: true };
    } catch (e) {
      return { id, ok: false, reason: e instanceof ContentError ? [e.message, ...e.reasons].join(": ") : "Failed" };
    }
  });
  audit(
    actor,
    "bulk.status",
    kind,
    "-",
    `Bulk move to ${to}: ${results.filter((r) => r.ok).length} applied, ${results.filter((r) => !r.ok).length} refused`,
  );
  return results;
}

// ---------- sources ----------
export function saveSource(actor: Actor | null, raw: unknown, id?: string): Source {
  assertAdmin(actor);
  const d = parse(sourceInput, raw);
  const url = safeExternalUrl(d.url)!;
  const existing = id ? db().sources.get(id) : undefined;
  if (id && !existing) throw new ContentError("NOT_FOUND", "Source not found");
  if ([...db().sources.values()].some((s) => s.url === url && s.id !== id))
    throw new ContentError("CONFLICT", "A source with this URL already exists", { url: "A source with this URL already exists" });
  const at = now();
  const next: Source = {
    id: existing?.id ?? uid(),
    slug: existing?.slug ?? uniqueSlug(db().sources, d.title),
    ...d,
    url,
    domain: new URL(url).hostname,
    lastCheckedAt: existing?.lastCheckedAt ?? null,
    lastImportAt: existing?.lastImportAt ?? null,
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  };
  const before = existing ? snapshot(existing) : null;
  db().sources.set(next.id, next);
  audit(
    actor,
    existing ? "source.update" : "source.create",
    "source",
    next.id,
    `${existing ? "Updated" : "Registered"} source ${next.title} (permission ${next.permission})`,
  );
  if (before && (before.permission !== next.permission || before.reviewStatus !== next.reviewStatus)) flagDependents(actor, next);
  return next;
}
export function markSourceChecked(actor: Actor | null, id: string) {
  assertAdmin(actor);
  const s = db().sources.get(id);
  if (!s) throw new ContentError("NOT_FOUND", "Source not found");
  s.lastCheckedAt = now();
  s.updatedAt = now();
  audit(actor, "source.checked", "source", id, `Marked ${s.title} as checked`);
}
/** When a source stops being usable, published content that depends on it goes back to review. */
export function flagDependents(actor: Actor, source: Source): number {
  if (!sourceBlockers([source]).length) return 0;
  let n = 0;
  for (const kind of ["company", "process", "question", "experience"] as ContentKind[]) {
    for (const e of mapFor(kind).values()) {
      if (e.publication === "PUBLISHED" && e.sourceIds.includes(source.id)) {
        e.publication = "IN_REVIEW";
        e.updatedAt = now();
        e.moderatorNotes =
          `${e.moderatorNotes}\n[${now().slice(0, 10)}] Returned to review: source "${source.title}" is no longer cleared for use.`.slice(
            -2000,
          );
        audit(actor, "status.in_review", kind, e.id, `Returned to review because source ${source.title} changed`);
        n++;
      }
    }
  }
  return n;
}
export const dependentsOf = (sourceId: string) =>
  (["company", "process", "question", "experience"] as ContentKind[]).flatMap((k) =>
    [...mapFor(k).values()].filter((e) => e.sourceIds.includes(sourceId)).map((e) => ({ kind: k, id: e.id })),
  );

// ---------- taxonomy ----------
export function createCategory(actor: Actor | null, raw: unknown): Category {
  assertAdmin(actor);
  const d = parse(categoryInput, raw);
  const parent = d.parentSlug ? slugOf(db().categories, d.parentSlug) : null;
  if (d.parentSlug && !parent)
    throw new ContentError("VALIDATION", "Unknown parent", { parentSlug: "That parent category does not exist" });
  const slug = d.slug || uniqueSlug(db().categories, d.name);
  slugClash(db().categories, slug);
  const c: Category = {
    id: uid(),
    slug,
    name: d.name,
    parentId: parent?.id ?? null,
    description: d.description,
    order: db().categories.size,
  };
  db().categories.set(c.id, c);
  audit(actor, "category.create", "category", c.id, `Created category ${c.name}`);
  return c;
}
export function createTag(actor: Actor | null, raw: unknown): Tag {
  assertAdmin(actor);
  const d = parse(tagInput, raw);
  const slug = slugify(d.name);
  if (!slug) throw new ContentError("VALIDATION", "Invalid tag", { name: "Use letters or numbers" });
  const existing = slugOf(db().tags, slug);
  if (existing) return existing;
  const t: Tag = { id: uid(), slug, name: d.name };
  db().tags.set(t.id, t);
  audit(actor, "tag.create", "tag", t.id, `Created tag ${t.name}`);
  return t;
}
export function ensureTags(slugs: string[]) {
  for (const s of slugs)
    if (!slugOf(db().tags, s)) {
      const t = { id: uid(), slug: s, name: s };
      db().tags.set(t.id, t);
    }
}

// ---------- companies ----------
function afterEdit(kind: ContentKind, e: Entity) {
  if (e.publication === "PUBLISHED") {
    const b = publishBlockers(kind, e);
    if (b.length) throw new ContentError("BLOCKED", "Published content must keep meeting the publishing rules", {}, b);
  }
}
function stamp<T extends Entity>(kind: ContentKind, actor: Actor, map: Map<string, T>, existing: T | undefined, next: T, label: string) {
  const changed = existing ? changedKeys(existing, next) : ["created"];
  if (existing) {
    next.version = existing.version + 1;
    next.createdAt = existing.createdAt;
    next.publishedAt = existing.publishedAt;
  }
  next.updatedAt = now();
  afterEdit(kind, next);
  map.set(next.id, next);
  revise(actor, kind, next, changed);
  audit(
    actor,
    existing ? `${kind}.update` : `${kind}.create`,
    kind,
    next.id,
    `${existing ? "Updated" : "Created"} ${label}${existing ? ` (${changed.join(", ")})` : ""}`,
  );
  return next;
}
export function saveCompany(actor: Actor | null, raw: unknown, id?: string): Company {
  assertAdmin(actor);
  const d = parse(companyInput, raw);
  const existing = id ? db().companies.get(id) : undefined;
  if (id && !existing) throw new ContentError("NOT_FOUND", "Company not found");
  const slug = d.slug || existing?.slug || uniqueSlug(db().companies, d.name);
  slugClash(db().companies, slug, existing?.id);
  sourcesOf(d.sourceIds);
  const cats = d.prepCategories.filter((s) => !slugOf(db().categories, s));
  if (cats.length) throw new ContentError("VALIDATION", "Unknown categories", { prepCategories: `Unknown category: ${cats[0]}` });
  const at = now();
  const verifiedNow = d.verification === "VERIFIED" && existing?.verification !== "VERIFIED";
  const next: Company = {
    ...d,
    id: existing?.id ?? uid(),
    slug,
    website: safeExternalUrl(d.website)!,
    careersUrl: safeExternalUrl(d.careersUrl)!,
    logoUrl: d.logoUrl ? safeExternalUrl(d.logoUrl)! : "",
    publication: existing?.publication ?? "DRAFT",
    publishedAt: existing?.publishedAt ?? null,
    lastVerifiedAt:
      d.verification === "VERIFIED" ? (verifiedNow ? at : (existing?.lastVerifiedAt ?? at)) : (existing?.lastVerifiedAt ?? null),
    version: 1,
    createdAt: at,
    updatedAt: at,
  };
  return stamp("company", actor, db().companies, existing, next, `company ${next.name}`);
}
export function saveProcess(actor: Actor | null, raw: unknown, id?: string): InterviewProcess {
  assertAdmin(actor);
  const d = parse(processInput, raw);
  const existing = id ? db().processes.get(id) : undefined;
  if (id && !existing) throw new ContentError("NOT_FOUND", "Process not found");
  if (!db().companies.has(d.companyId))
    throw new ContentError("VALIDATION", "Unknown company", { companyId: "Choose an existing company" });
  sourcesOf(d.sourceIds);
  const at = now();
  const next: InterviewProcess = {
    id: existing?.id ?? uid(),
    ...d,
    sequence: d.sequence ?? null,
    publication: existing?.publication ?? "DRAFT",
    publishedAt: existing?.publishedAt ?? null,
    lastReviewedAt: d.verification === "VERIFIED" ? at : (existing?.lastReviewedAt ?? null),
    version: 1,
    createdAt: at,
    updatedAt: at,
  };
  return stamp("process", actor, db().processes, existing, next, `interview round ${next.title}`);
}

// ---------- questions ----------
export function saveQuestion(actor: Actor | null, raw: unknown, id?: string): Question {
  assertAdmin(actor);
  const d = parse(questionInput, raw);
  const existing = id ? db().questions.get(id) : undefined;
  if (id && !existing) throw new ContentError("NOT_FOUND", "Question not found");
  const cat = slugOf(db().categories, d.categorySlug);
  if (!cat) throw new ContentError("VALIDATION", "Unknown category", { categorySlug: "Choose an existing category" });
  const companies = d.companySlugs.map((s) => slugOf(db().companies, s));
  const missing = d.companySlugs.find((_, i) => !companies[i]);
  if (missing) throw new ContentError("VALIDATION", "Unknown company", { companySlugs: `Unknown company: ${missing}` });
  const srcs = sourcesOf(d.sourceIds);
  if (companies.length && (["PLATFORM_ORIGINAL", "AI_GENERATED"].includes(d.origin) || !srcs.some((s) => EVIDENCE.includes(s.type)))) {
    throw new ContentError("VALIDATION", "Company tag not supported", {
      companySlugs:
        "Company tags need a source that supports them (an official page or a public report) and cannot be used on original practice questions",
    });
  }
  if (d.type === "MULTIPLE_CHOICE" && (d.options.length < 2 || !d.options.some((o) => o.correct)))
    throw new ContentError("VALIDATION", "Options needed", {
      options: "Add at least two options, one per line, and mark the correct one with *",
    });
  if (d.codeSolution && !d.codeLanguage)
    throw new ContentError("VALIDATION", "Language needed", { codeLanguage: "Name the programming language of the solution" });
  const slug = d.slug || existing?.slug || uniqueSlug(db().questions, d.text.slice(0, 60));
  slugClash(db().questions, slug, existing?.id);
  ensureTags(d.tags.map(slugify).filter(Boolean));
  const at = now();
  const { categorySlug: _c, companySlugs: _s, tags, slug: _slug, ...rest } = d;
  const next: Question = {
    ...rest,
    id: existing?.id ?? uid(),
    slug,
    categoryId: cat.id,
    companyIds: companies.map((c) => c!.id),
    tagSlugs: tags.map(slugify).filter(Boolean),
    publication: existing?.publication ?? "DRAFT",
    publishedAt: existing?.publishedAt ?? null,
    version: 1,
    createdAt: at,
    updatedAt: at,
  };
  return stamp("question", actor, db().questions, existing, next, `question ${next.slug}`);
}
export function findDuplicateQuestions(text: string, exceptId?: string): Question[] {
  const key = normalizeKey(text);
  return [...db().questions.values()].filter((q) => q.id !== exceptId && normalizeKey(q.text) === key);
}

// ---------- experiences ----------
export function saveExperience(actor: Actor | null, raw: unknown, id?: string): Experience {
  assertAdmin(actor);
  const d = parse(experienceInput, raw);
  const existing = id ? db().experiences.get(id) : undefined;
  if (id && !existing) throw new ContentError("NOT_FOUND", "Experience not found");
  const company = db().companies.get(d.companyId);
  if (!company) throw new ContentError("VALIDATION", "Unknown company", { companyId: "Choose an existing company" });
  sourcesOf(d.sourceIds);
  if (!["CANDIDATE_REPORTED", "COMMUNITY_REPORTED"].includes(d.origin))
    throw new ContentError("VALIDATION", "Wrong origin", { origin: "Interview experiences are candidate reported or community reported" });
  const slug = d.slug || existing?.slug || uniqueSlug(db().experiences, `${company.name} ${d.role}`);
  slugClash(db().experiences, slug, existing?.id);
  const at = now();
  const next: Experience = {
    id: existing?.id ?? uid(),
    ...d,
    slug,
    sourceUrl: d.sourceUrl ? safeExternalUrl(d.sourceUrl)! : "",
    reportedYear: d.reportedYear ?? null,
    publication: existing?.publication ?? "DRAFT",
    publishedAt: existing?.publishedAt ?? null,
    lastReviewedAt: d.verification === "VERIFIED" ? at : (existing?.lastReviewedAt ?? null),
    version: 1,
    createdAt: at,
    updatedAt: at,
  };
  return stamp("experience", actor, db().experiences, existing, next, `experience ${next.slug}`);
}

// ---------- review queue, stats, audit ----------
export const adminHref = (kind: ContentKind, e: Entity) =>
  kind === "process"
    ? `/admin/processes/${e.id}`
    : kind === "company"
      ? `/admin/companies/${e.id}`
      : kind === "question"
        ? `/admin/questions/${e.id}`
        : `/admin/experiences/${e.id}`;

export function reviewQueue(actor: Actor | null) {
  assertAdmin(actor);
  return (["company", "process", "question", "experience"] as ContentKind[])
    .flatMap((kind) =>
      [...mapFor(kind).values()]
        .filter((e) => e.publication === "IN_REVIEW")
        .map((e) => ({
          kind,
          id: e.id,
          href: adminHref(kind, e),
          title: "name" in e ? e.name : "text" in e ? e.text : "title" in e ? e.title : e.role,
          updatedAt: e.updatedAt,
          blockers: publishBlockers(kind, e),
          notes: e.moderatorNotes,
        })),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function adminStats(actor: Actor | null) {
  assertAdmin(actor);
  const d = db(),
    qs = [...d.questions.values()],
    jobs = [...d.imports.values()];
  const inReview = (["company", "process", "question", "experience"] as ContentKind[]).reduce(
    (n, k) => n + [...mapFor(k).values()].filter((e) => e.publication === "IN_REVIEW").length,
    0,
  );
  const recent = (["company", "process", "question", "experience"] as ContentKind[])
    .flatMap((k) =>
      [...mapFor(k).values()].map((e) => ({
        kind: k,
        id: e.id,
        href: adminHref(k, e),
        updatedAt: e.updatedAt,
        title: "name" in e ? e.name : "text" in e ? e.text.slice(0, 80) : "title" in e ? e.title : e.role,
      })),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);
  return {
    publishedQuestions: qs.filter((q) => q.publication === "PUBLISHED").length,
    draftQuestions: qs.filter((q) => q.publication === "DRAFT").length,
    pendingReviews: inReview,
    publishedCompanies: [...d.companies.values()].filter((c) => c.publication === "PUBLISHED").length,
    sources: d.sources.size,
    failedImports: jobs.filter((j) => j.status === "FAILED").length,
    recent,
  };
}
export function listAudit(actor: Actor | null, limit = 100) {
  assertAdmin(actor);
  return db().audit.slice(0, Math.min(limit, 500));
}
export function listAdmin<T extends ContentKind>(
  actor: Actor | null,
  kind: T,
  o: { status?: Publication; q?: string; page?: number; pageSize?: number } = {},
) {
  assertAdmin(actor);
  const q = normalizeKey(o.q ?? "").slice(0, 100);
  const all = [...mapFor(kind).values()]
    .filter(
      (e) =>
        (!o.status || e.publication === o.status) &&
        (!q ||
          normalizeKey(
            JSON.stringify([
              ("name" in e && e.name) || "",
              ("text" in e && e.text) || "",
              ("title" in e && e.title) || "",
              ("role" in e && e.role) || "",
            ]),
          ).includes(q)),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  const pageSize = Math.min(Math.max(o.pageSize ?? 20, 1), 50),
    page = Math.max(o.page ?? 1, 1);
  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    total: all.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
  };
}
export const getEntity = (actor: Actor | null, kind: ContentKind, id: string) => {
  assertAdmin(actor);
  return mapFor(kind).get(id) ?? null;
};
