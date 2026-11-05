import { createHash } from "node:crypto";
import { db } from "../store";
import { ContentError, assertAdmin, audit, ensureTags, type Actor } from "../service";
import { importCompanyRow, importQuestionRow, parseOptions } from "../validation";
import { csvCell, normalizeKey, safeExternalUrl, slugify } from "../sanitize";
import { rateLimit } from "@/lib/auth/rate-limit";
import { CsvError, LIMITS, parseCsv } from "./csv";
import type { Company, ImportJob, Origin, Question, Source, SourceType, StagedRecord } from "../types";

/**
 * Authorized import pipeline: file upload only. It never fetches a URL, so there is no SSRF surface and nothing is scraped.
 * Records are validated into a staging area, previewed, and only created as DRAFTS after an explicit confirmation.
 * Large imports: commitImport already works in bounded batches. To move it off the web request, call it from a queue worker (for example BullMQ).
 */
export const MAX_BYTES = 1_000_000;
export const BATCH = 100;
const EVIDENCE: SourceType[] = ["OFFICIAL_CAREERS", "OFFICIAL_DOCS", "PUBLIC_EXPERIENCE", "USER_SUBMITTED", "GITHUB_REPO"];
const IMPORTABLE = ["APPROVED", "ATTRIBUTION_REQUIRED"];
const ORIGIN_FOR: Record<SourceType, Origin> = {
  OFFICIAL_CAREERS: "OFFICIAL",
  OFFICIAL_DOCS: "OFFICIAL",
  PUBLIC_EXPERIENCE: "COMMUNITY_REPORTED",
  USER_SUBMITTED: "COMMUNITY_REPORTED",
  EDUCATIONAL: "ADMIN_CURATED",
  OPEN_DATASET: "ADMIN_CURATED",
  GITHUB_REPO: "ADMIN_CURATED",
  MANUAL_CURATION: "ADMIN_CURATED",
  PLATFORM_ORIGINAL: "PLATFORM_ORIGINAL",
};
const ALLOWED_MIME = new Set([
  "",
  "text/csv",
  "application/csv",
  "application/json",
  "text/json",
  "text/plain",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);

export function importBlocker(source: Source): string | null {
  if (source.reviewStatus === "REJECTED") return "This source was rejected in review.";
  if (!IMPORTABLE.includes(source.permission))
    return `This source cannot be imported from (permission: ${source.permission.toLowerCase().replace(/_/g, " ")}). Register it as link only, or complete a permission review first.`;
  return null;
}

const preview = (o: unknown) => JSON.stringify(o).slice(0, 160);
const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const now = () => new Date().toISOString();

function readRows(filename: string, bytes: Uint8Array): { rows: Record<string, unknown>[]; firstRow: number } {
  const ext = filename.toLowerCase().match(/\.(csv|json)$/)?.[1];
  if (!ext) throw new ContentError("VALIDATION", "Upload a .csv or .json file", { file: "Only .csv and .json files are accepted" });
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ContentError("VALIDATION", "Not UTF-8", { file: "The file is not valid UTF-8 text" });
  }
  if (text.includes("\u0000")) throw new ContentError("VALIDATION", "Binary content", { file: "The file contains binary data" });
  if (ext === "json") {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new ContentError("VALIDATION", "Invalid JSON", { file: `The file is not valid JSON: ${(e as Error).message.slice(0, 120)}` });
    }
    if (!Array.isArray(data))
      throw new ContentError("VALIDATION", "Expected an array", { file: "The JSON file must be an array of records" });
    if (data.length === 0 || data.length > LIMITS.maxRows)
      throw new ContentError("VALIDATION", "Row limit", { file: `The file must contain between 1 and ${LIMITS.maxRows} records` });
    return {
      rows: data.map((r) => (r && typeof r === "object" && !Array.isArray(r) ? (r as Record<string, unknown>) : { __invalid: true })),
      firstRow: 1,
    };
  }
  try {
    return { rows: parseCsv(text).rows, firstRow: 2 };
  } catch (e) {
    if (e instanceof CsvError) throw new ContentError("VALIDATION", "Invalid CSV", { file: `Line ${e.line}: ${e.message}` });
    throw e;
  }
}

const catBySlugOrName = (v: string) => {
  const k = normalizeKey(v);
  return [...db().categories.values()].find((c) => c.slug === slugify(v) || normalizeKey(c.name) === k);
};
const companyByName = (v: string) => {
  const k = normalizeKey(v),
    s = slugify(v);
  return [...db().companies.values()].find(
    (c) =>
      c.slug === s ||
      normalizeKey(c.name) === k ||
      normalizeKey(c.name)
        .replace(/\(.*\)/, "")
        .trim() === k,
  );
};

export function stageImport(i: {
  actor: Actor | null;
  kind: "questions" | "companies";
  sourceId: string;
  filename: string;
  mime: string;
  bytes: Uint8Array;
}): ImportJob {
  assertAdmin(i.actor);
  const actor = i.actor;
  const limit = rateLimit(`import:${actor.id}`, 10, 60_000);
  if (!limit.ok) throw new ContentError("BLOCKED", `Too many import attempts. Try again in ${limit.retryAfterSec} seconds.`);
  const source = db().sources.get(i.sourceId);
  if (!source) throw new ContentError("VALIDATION", "Choose a source", { sourceId: "Choose a registered source" });
  if (!i.bytes.length) throw new ContentError("VALIDATION", "Empty file", { file: "The file is empty" });
  if (i.bytes.length > MAX_BYTES)
    throw new ContentError("VALIDATION", "Too large", { file: `The file is larger than ${MAX_BYTES / 1000} KB` });
  if (!ALLOWED_MIME.has(i.mime.toLowerCase().split(";")[0]!.trim()))
    throw new ContentError("VALIDATION", "Wrong type", { file: "That file type is not accepted" });
  const { rows, firstRow } = readRows(i.filename.slice(0, 200), i.bytes);
  const fileHash = sha(i.bytes);
  const base = {
    id: crypto.randomUUID(),
    sourceId: source.id,
    kind: i.kind,
    filename: i.filename.replace(/[^\w.\- ]/g, "_").slice(0, 120),
    fileHash,
    createdBy: actor.id,
    createdAt: now(),
    committedAt: null,
  };

  const prior = [...db().imports.values()].find(
    (j) => j.status === "COMMITTED" && j.sourceId === source.id && j.kind === i.kind && j.fileHash === fileHash,
  );
  if (prior) {
    const job: ImportJob = {
      ...base,
      status: "ALREADY_IMPORTED",
      counts: { total: rows.length, valid: 0, invalid: 0, duplicate: 0, skipped: rows.length, created: 0 },
      staged: [],
      message: "This exact file was already imported from this source. Nothing was staged.",
    };
    db().imports.set(job.id, job);
    audit(actor, "import.duplicate_file", "import", job.id, `Blocked a repeat of an imported file (${job.filename})`);
    return job;
  }

  const seenKeys = new Set<string>();
  const evidence = EVIDENCE.includes(source.type);
  const staged: StagedRecord[] = rows.map((raw, idx): StagedRecord => {
    const row = firstRow + idx;
    if ((raw as { __invalid?: boolean }).__invalid)
      return { row, status: "INVALID", data: null, errors: ["This row is not an object"], preview: "" };
    return i.kind === "questions" ? stageQuestion(row, raw, source, evidence, seenKeys) : stageCompany(row, raw, seenKeys);
  });
  const count = (s: StagedRecord["status"]) => staged.filter((r) => r.status === s).length;
  const blocker = importBlocker(source);
  const job: ImportJob = {
    ...base,
    status: blocker ? "BLOCKED" : "PREVIEWED",
    staged,
    message: blocker ?? "Review the preview, then confirm to create draft records.",
    counts: {
      total: staged.length,
      valid: count("VALID"),
      invalid: count("INVALID"),
      duplicate: count("DUPLICATE"),
      skipped: count("SKIPPED"),
      created: 0,
    },
  };
  db().imports.set(job.id, job);
  audit(
    actor,
    "import.stage",
    "import",
    job.id,
    `Staged ${job.counts.total} ${i.kind} from ${source.title}: ${job.counts.valid} valid, ${job.counts.invalid} invalid, ${job.counts.duplicate} duplicate`,
  );
  return job;
}

function stageQuestion(row: number, raw: Record<string, unknown>, source: Source, evidence: boolean, seen: Set<string>): StagedRecord {
  const p = importQuestionRow.safeParse(raw);
  const pv = preview({ text: String(raw.text ?? "").slice(0, 100) });
  if (!p.success)
    return {
      row,
      status: "INVALID",
      data: null,
      errors: p.error.issues.map((x) => `${String(x.path[0] ?? "row")}: ${x.message}`),
      preview: pv,
    };
  const d = p.data,
    errors: string[] = [];
  const cat = catBySlugOrName(d.category);
  if (!cat) errors.push(`category: unknown category "${d.category}"`);
  const options = parseOptions(d.options);
  if (d.type === "MULTIPLE_CHOICE" && (options.length < 2 || !options.some((o) => o.correct)))
    errors.push("options: multiple choice needs two or more options and one marked with *");
  if (d.codeSolution && !d.codeLanguage) errors.push("codeLanguage: name the language of the solution");
  const companySlugs: string[] = [];
  for (const name of d.companies) {
    const c = companyByName(name);
    if (c) companySlugs.push(c.slug);
    else errors.push(`companies: unknown company "${name}"`);
  }
  if (companySlugs.length && !evidence)
    errors.push("companies: company tags need a source that supports them (an official page or public report)");
  const key = normalizeKey(d.text);
  const existing = [...db().questions.values()].find((q) => normalizeKey(q.text) === key);
  if (errors.length) return { row, status: "INVALID", data: null, errors, preview: pv };
  if (existing || seen.has(key))
    return {
      row,
      status: "DUPLICATE",
      data: null,
      errors: [existing ? "Matches an existing question" : "Repeated earlier in this file"],
      duplicateOf: existing?.slug,
      preview: pv,
    };
  seen.add(key);
  return {
    row,
    status: "VALID",
    errors: [],
    preview: pv,
    data: {
      text: d.text,
      categorySlug: cat!.slug,
      type: d.type,
      difficulty: d.difficulty,
      roles: d.roles,
      careerStages: d.careerStages,
      experienceLevels: d.experienceLevels,
      skills: d.skills,
      tags: d.tags.map(slugify).filter(Boolean),
      companySlugs,
      answerOutline: d.answerOutline,
      explanation: d.explanation,
      exampleAnswer: d.exampleAnswer,
      codeSolution: d.codeSolution,
      codeLanguage: d.codeLanguage,
      hints: d.hints,
      options,
      estimatedMinutes: d.estimatedMinutes,
    },
  };
}
function stageCompany(row: number, raw: Record<string, unknown>, seen: Set<string>): StagedRecord {
  const p = importCompanyRow.safeParse(raw);
  const pv = preview({ name: String(raw.name ?? "").slice(0, 100) });
  if (!p.success)
    return {
      row,
      status: "INVALID",
      data: null,
      errors: p.error.issues.map((x) => `${String(x.path[0] ?? "row")}: ${x.message}`),
      preview: pv,
    };
  const d = p.data,
    key = normalizeKey(d.name),
    slug = slugify(d.name);
  const existing = [...db().companies.values()].find((c) => c.slug === slug || normalizeKey(c.name) === key);
  if (existing || seen.has(key))
    return {
      row,
      status: "DUPLICATE",
      data: null,
      errors: [existing ? "Matches an existing company" : "Repeated earlier in this file"],
      duplicateOf: existing?.slug,
      preview: pv,
    };
  seen.add(key);
  return {
    row,
    status: "VALID",
    errors: [],
    preview: pv,
    data: {
      name: d.name,
      website: safeExternalUrl(d.website)!,
      careersUrl: safeExternalUrl(d.careersUrl)!,
      industry: d.industry,
      description: d.description,
      headquarters: d.headquarters,
      roleCategories: d.roleCategories,
    },
  };
}

const uniq = (taken: Set<string>, base: string) => {
  const root = slugify(base) || "item";
  let s = root,
    n = 2;
  while (taken.has(s)) s = `${root}-${n++}`;
  taken.add(s);
  return s;
};

/** All or nothing: every batch is inserted, and if any batch fails everything this commit inserted is rolled back. */
export function commitImport(
  actor: Actor | null,
  jobId: string,
  opts: { confirm: boolean; beforeInsert?: (batch: number) => void },
): ImportJob {
  assertAdmin(actor);
  const job = db().imports.get(jobId);
  if (!job) throw new ContentError("NOT_FOUND", "Import not found");
  if (!opts.confirm) throw new ContentError("VALIDATION", "Confirm the import first", { confirm: "Tick the box to confirm" });
  if (job.status !== "PREVIEWED")
    throw new ContentError("BLOCKED", `This import cannot be committed (status: ${job.status})`, {}, [job.message]);
  const source = db().sources.get(job.sourceId);
  const blocker = source ? importBlocker(source) : "The source no longer exists";
  if (!source || blocker) {
    job.status = "BLOCKED";
    job.message = blocker ?? "";
    throw new ContentError("BLOCKED", "The source is no longer cleared for import", {}, [job.message]);
  }
  if (!rateLimit(`import-commit:${actor.id}`, 10, 60_000).ok)
    throw new ContentError("BLOCKED", "Too many import attempts. Try again shortly.");

  const d = db(),
    at = now(),
    origin = ORIGIN_FOR[source.type];
  const slugs = new Set([...(job.kind === "questions" ? d.questions : d.companies).values()].map((e) => e.slug));
  let skipped = 0;
  const entities: (Question | Company)[] = [];
  for (const r of job.staged) {
    if (r.status !== "VALID" || !r.data) continue;
    const x = r.data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (job.kind === "questions") {
      const key = normalizeKey(String(x.text));
      if ([...d.questions.values()].some((q) => normalizeKey(q.text) === key)) {
        skipped++;
        continue;
      } // created since the preview
      const cat = [...d.categories.values()].find((c) => c.slug === x.categorySlug);
      if (!cat) {
        skipped++;
        continue;
      }
      const q: Question = {
        id: crypto.randomUUID(),
        slug: uniq(slugs, String(x.text).slice(0, 60)),
        text: x.text,
        categoryId: cat.id,
        type: x.type,
        difficulty: x.difficulty,
        companyIds: (x.companySlugs as string[])
          .map((s) => [...d.companies.values()].find((c) => c.slug === s)?.id)
          .filter((v): v is string => !!v),
        roles: x.roles,
        careerStages: x.careerStages,
        experienceLevels: x.experienceLevels,
        skills: x.skills,
        tagSlugs: x.tags,
        answerOutline: x.answerOutline,
        explanation: x.explanation,
        exampleAnswer: x.exampleAnswer,
        codeSolution: x.codeSolution,
        codeLanguage: x.codeLanguage,
        testCases: [],
        hints: x.hints,
        options: x.options,
        estimatedMinutes: x.estimatedMinutes,
        origin,
        verification: "NOT_VERIFIED",
        publication: "DRAFT",
        publishedAt: null,
        sourceIds: [source.id],
        moderatorNotes: `Imported from ${source.title} (import ${job.id.slice(0, 8)}, row ${r.row}).`,
        version: 1,
        createdAt: at,
        updatedAt: at,
      };
      entities.push(q);
    } else {
      const key = normalizeKey(String(x.name));
      if ([...d.companies.values()].some((c) => c.slug === slugify(String(x.name)) || normalizeKey(c.name) === key)) {
        skipped++;
        continue;
      }
      const c: Company = {
        id: crypto.randomUUID(),
        slug: uniq(slugs, String(x.name)),
        name: x.name,
        website: x.website,
        careersUrl: x.careersUrl,
        logoUrl: "",
        industry: x.industry,
        description: x.description,
        headquarters: x.headquarters,
        hiringInfo: "",
        roleCategories: x.roleCategories,
        prepCategories: [],
        origin,
        verification: "NOT_VERIFIED",
        publication: "DRAFT",
        publishedAt: null,
        lastVerifiedAt: null,
        sourceIds: [source.id],
        moderatorNotes: `Imported from ${source.title} (import ${job.id.slice(0, 8)}, row ${r.row}).`,
        version: 1,
        createdAt: at,
        updatedAt: at,
      };
      entities.push(c);
    }
  }

  const inserted: string[] = [];
  const map = (job.kind === "questions" ? d.questions : d.companies) as Map<string, Question | Company>;
  try {
    for (let b = 0; b * BATCH < entities.length; b++) {
      const batch = entities.slice(b * BATCH, (b + 1) * BATCH);
      opts.beforeInsert?.(b);
      for (const e of batch) {
        map.set(e.id, e);
        inserted.push(e.id);
      }
    }
  } catch (err) {
    for (const id of inserted) map.delete(id);
    job.status = "FAILED";
    job.message = `The import failed and was rolled back. No records were created. (${(err as Error).message.slice(0, 160)})`;
    audit(actor, "import.failed", "import", job.id, `Import rolled back after a failure (${inserted.length} records removed)`);
    return job;
  }
  if (job.kind === "questions") ensureTags(entities.flatMap((e) => (e as Question).tagSlugs));
  for (const e of entities)
    d.revisions.unshift({
      id: crypto.randomUUID(),
      kind: job.kind === "questions" ? "question" : "company",
      entityId: e.id,
      version: 1,
      at,
      actorId: actor.id,
      changed: ["imported"],
      snapshot: structuredClone(e),
    });
  source.lastImportAt = at;
  source.updatedAt = at;
  job.status = "COMMITTED";
  job.committedAt = at;
  job.counts.created = entities.length;
  job.counts.skipped += skipped;
  job.message = `Created ${entities.length} draft ${job.kind}. Nothing is published until it passes review.`;
  audit(actor, "import.commit", "import", job.id, `Committed ${entities.length} draft ${job.kind} from ${source.title}`);
  return job;
}

/** Error report for download. Every cell is neutralised against spreadsheet formula injection. */
export function errorReportCsv(job: ImportJob): string {
  const lines = ["row,status,details,preview"];
  for (const r of job.staged.filter((x) => x.status !== "VALID"))
    lines.push([r.row, r.status, r.errors.join("; "), r.preview].map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}
