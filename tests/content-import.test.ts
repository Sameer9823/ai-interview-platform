import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/content/store";
import { ContentError } from "@/lib/content/service";
import { commitImport, errorReportCsv, MAX_BYTES, stageImport } from "@/lib/content/import/pipeline";
import { LIMITS, parseCsv, CsvError } from "@/lib/content/import/csv";
import { resetRateLimit } from "@/lib/auth/rate-limit";
import type { ImportJob } from "@/lib/content/types";
import { admin, user, fresh, makeSource } from "./content-helpers";

const enc = (s: string) => new TextEncoder().encode(s);
const HEADER =
  "text,category,type,difficulty,roles,careerStages,experienceLevels,skills,tags,answerOutline,estimatedMinutes,options,companies";
const row = (text: string, o: Partial<Record<string, string>> = {}) =>
  [
    text,
    o.category ?? "sql",
    o.type ?? "SHORT_ANSWER",
    o.difficulty ?? "BEGINNER",
    "Data analyst",
    "STUDENT|FRESHER",
    "",
    "joins",
    "sql|databases",
    o.outline ?? "Join the tables on the shared key",
    "5",
    o.options ?? "",
    o.companies ?? "",
  ]
    .map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
    .join(",");
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");
const stage = (text: string, o: { name?: string; kind?: "questions" | "companies"; sourceId: string; mime?: string }) =>
  stageImport({
    actor: admin,
    kind: o.kind ?? "questions",
    sourceId: o.sourceId,
    filename: o.name ?? "q.csv",
    mime: o.mime ?? "text/csv",
    bytes: enc(text),
  });
const approved = () => makeSource({ permission: "APPROVED", url: "https://example.org/dataset", title: "Open set", type: "OPEN_DATASET" });

describe("csv parser", () => {
  it("handles quotes, escaped quotes, embedded newlines, CRLF and a BOM", () => {
    const r = parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n"line1\nline2",z\r\n');
    expect(r.rows).toEqual([
      { a: "x, y", b: 'say "hi"' },
      { a: "line1\nline2", b: "z" },
    ]);
  });
  it("reports line numbers for malformed files", () => {
    for (const [text, msg] of [
      ['a,b\n"open,1\n', "never closed"],
      ['a,b\nx"y,1\n', "quote"],
      ["a,b\n1,2,3\n", "3 values"],
      ["a,a\n1,2\n", "Duplicate"],
      ["a\n", "header row"],
      ["__proto__,b\n1,2\n", "Column names"],
      ['a,b\n"x"y,1\n', "after a closing quote"],
    ] as const) {
      try {
        parseCsv(text);
        expect.unreachable(text);
      } catch (e) {
        expect(e).toBeInstanceOf(CsvError);
        expect((e as CsvError).message).toContain(msg);
        expect((e as CsvError).line).toBeGreaterThan(0);
      }
    }
  });
  it("enforces size limits", () => {
    expect(() => parseCsv("a\n" + Array.from({ length: LIMITS.maxRows + 1 }, () => "x").join("\n"))).toThrow(/rows/);
    expect(() => parseCsv("a\n" + "x".repeat(LIMITS.maxCell + 1))).toThrow(/cell/);
    expect(() => parseCsv(Array.from({ length: LIMITS.maxCols + 1 }, (_, i) => `c${i}`).join(",") + "\n1")).toThrow(/columns/);
  });
});

describe("staging and preview", () => {
  beforeEach(() => fresh(true));
  it("parses valid CSV and reports valid, invalid and duplicate counts with row numbers", () => {
    const s = approved();
    const job = stage(
      csv(
        row("What is the difference between UNION and UNION ALL in SQL?"),
        row("Short", {}),
        row("What does a primary key guarantee in a table?", { category: "no-such-category" }),
        row("What is the difference between UNION and UNION ALL in SQL?"),
        row("Explain the ACID properties of a database transaction."),
      ),
      { sourceId: s.id },
    );
    expect(job.status).toBe("PREVIEWED");
    expect(job.counts).toMatchObject({ total: 5, valid: 1, invalid: 2, duplicate: 2 });
    const byRow = Object.fromEntries(job.staged.map((r) => [r.row, r]));
    expect(byRow[2]!.status).toBe("VALID");
    expect(byRow[3]!.errors.join()).toContain("text");
    expect(byRow[4]!.errors.join()).toContain('unknown category "no-such-category"');
    expect(byRow[5]!.errors[0]).toContain("Repeated earlier");
    expect(byRow[6]!.duplicateOf).toBe("acid-properties");
  });
  it("parses valid JSON with native arrays", () => {
    const s = approved();
    const json = JSON.stringify([
      {
        text: "What is a foreign key and why is it useful?",
        category: "dbms",
        type: "short_answer",
        difficulty: "beginner",
        careerStages: ["STUDENT"],
        answerOutline: "It links rows between tables.",
        tags: ["dbms"],
      },
    ]);
    const job = stage(json, { sourceId: s.id, name: "q.json", mime: "application/json" });
    expect(job.counts.valid).toBe(1);
    expect(job.staged[0]!.row).toBe(1);
  });
  it("checks multiple choice options, unknown companies and company evidence", () => {
    const evidence = makeSource({ permission: "APPROVED", url: "https://example.org/pub", type: "PUBLIC_EXPERIENCE" });
    const j = stage(
      csv(
        row("Which keyword removes duplicate rows in a SELECT?", { type: "MULTIPLE_CHOICE", options: "DISTINCT|UNIQUE" }),
        row("Which of these is a valid SQL aggregate function?", { type: "MULTIPLE_CHOICE", options: "*SUM|CALC" }),
        row("Name one use of an index in a database.", { companies: "Atlantis Corp" }),
        row("Name one downside of too many indexes on a table.", { companies: "Google" }),
      ),
      { sourceId: evidence.id },
    );
    expect(j.staged.map((r) => r.status)).toEqual(["INVALID", "VALID", "INVALID", "VALID"]);
    expect(j.staged[0]!.errors.join()).toContain("marked with *");
    expect(j.staged[2]!.errors.join()).toContain('unknown company "Atlantis Corp"');
    const edu = makeSource({ permission: "APPROVED", url: "https://example.org/edu", type: "EDUCATIONAL" });
    expect(
      stage(csv(row("Name one downside of too many indexes on a table.", { companies: "Google" })), {
        sourceId: edu.id,
      }).staged[0]!.errors.join(),
    ).toContain("company tags need a source");
  });
  it("strips markup from imported text", () => {
    const s = approved();
    const job = stage(csv(row("Explain <script>alert(1)</script>what a <b>view</b> is in SQL.")), { sourceId: s.id });
    expect((job.staged[0]!.data as { text: string }).text).toBe("Explain what a view is in SQL.");
  });
  it("blocks the commit for sources that are not cleared for import, but still previews", () => {
    for (const permission of ["LINK_ONLY", "UNKNOWN", "MANUAL_REVIEW_REQUIRED", "NOT_APPROVED"]) {
      const s = makeSource({ permission, url: `https://example.org/${permission}`, title: permission });
      const job = stage(csv(row(`A question for the ${permission} source to preview only.`)), { sourceId: s.id });
      expect(job.status).toBe("BLOCKED");
      expect(job.counts.valid).toBe(1);
      expect(() => commitImport(admin, job.id, { confirm: true })).toThrowError(expect.objectContaining({ code: "BLOCKED" }));
    }
    expect([...db().questions.values()].filter((q) => q.text.includes("preview only")).length).toBe(0);
  });
  it("rejects bad files before parsing them", () => {
    const s = approved();
    const bad =
      (b: Uint8Array | string, o = {}) =>
      () =>
        stageImport({
          actor: admin,
          kind: "questions",
          sourceId: s.id,
          filename: "q.csv",
          mime: "text/csv",
          bytes: typeof b === "string" ? enc(b) : b,
          ...o,
        });
    const rejects = (fn: () => unknown, pattern: RegExp) => {
      resetRateLimit(`import:${admin.id}`);
      try {
        fn();
        expect.unreachable("should have been rejected");
      } catch (e) {
        expect(e).toBeInstanceOf(ContentError);
        expect(Object.values((e as ContentError).fieldErrors).join(" ")).toMatch(pattern);
      }
    };
    rejects(bad(""), /empty/i);
    rejects(bad(new Uint8Array(MAX_BYTES + 1).fill(97)), /larger/);
    rejects(bad(new Uint8Array([0xff, 0xfe, 0xfd, 0x80])), /UTF-8/);
    rejects(bad("a,b\n1\u00002\n"), /binary/);
    rejects(bad("a\n1", { filename: "q.exe" }), /\.csv and \.json/);
    rejects(bad("a\n1", { filename: "q.csv.html" }), /\.csv and \.json/);
    rejects(bad("a\n1", { mime: "application/x-msdownload" }), /not accepted/);
    rejects(bad("{}", { filename: "q.json", mime: "application/json" }), /array/);
    rejects(bad("[not json", { filename: "q.json" }), /not valid JSON/);
    rejects(bad("[]", { filename: "q.json" }), /between 1 and/);
    rejects(bad('a,b\n"open,1\n'), /Line 2.*never closed/);
  });
  it("is not vulnerable to prototype pollution through JSON keys", () => {
    const s = approved();
    stage(
      '[{"__proto__":{"polluted":true},"constructor":{"prototype":{"x":1}},"text":"A valid question about primary keys in tables?","category":"dbms","type":"SHORT_ANSWER","difficulty":"BEGINNER","answerOutline":"Uniquely identifies a row."}]',
      { sourceId: s.id, name: "p.json", mime: "application/json" },
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});

describe("commit", () => {
  beforeEach(() => fresh(true));
  const prepared = (n = 2) => {
    const s = approved();
    const rows = Array.from({ length: n }, (_, i) => row(`Imported practice question number ${i} about relational joins and keys?`));
    return { s, job: stage(csv(...rows), { sourceId: s.id }) };
  };
  it("needs explicit confirmation", () => {
    const { job } = prepared();
    expect(() => commitImport(admin, job.id, { confirm: false })).toThrowError(expect.objectContaining({ code: "VALIDATION" }));
    expect(job.status).toBe("PREVIEWED");
  });
  it("creates draft records with provenance and never publishes", () => {
    const { s, job } = prepared();
    const before = db().questions.size;
    const done = commitImport(admin, job.id, { confirm: true });
    expect(done.status).toBe("COMMITTED");
    expect(done.counts.created).toBe(2);
    expect(db().questions.size).toBe(before + 2);
    const made = [...db().questions.values()].filter((q) => q.text.startsWith("Imported practice"));
    for (const q of made) {
      expect(q.publication).toBe("DRAFT");
      expect(q.sourceIds).toEqual([s.id]);
      expect(q.origin).toBe("ADMIN_CURATED");
      expect(q.verification).toBe("NOT_VERIFIED");
      expect(q.moderatorNotes).toContain("Imported from Open set");
    }
    expect(db().sources.get(s.id)!.lastImportAt).not.toBeNull();
    expect(db().audit.some((a) => a.action === "import.commit")).toBe(true);
  });
  it("refuses a second commit and a repeat of the same file", () => {
    const { s, job } = prepared();
    commitImport(admin, job.id, { confirm: true });
    expect(() => commitImport(admin, job.id, { confirm: true })).toThrowError(expect.objectContaining({ code: "BLOCKED" }));
    const again = stage(
      csv(...Array.from({ length: 2 }, (_, i) => row(`Imported practice question number ${i} about relational joins and keys?`))),
      { sourceId: s.id },
    );
    expect(again.status).toBe("ALREADY_IMPORTED");
    expect(() => commitImport(admin, again.id, { confirm: true })).toThrow();
  });
  it("skips records that became duplicates after the preview", () => {
    const { job } = prepared(1);
    const text = (job.staged[0]!.data as { text: string }).text;
    const [cat] = [...db().categories.values()];
    db().questions.set("late", { ...[...db().questions.values()][0]!, id: "late", slug: "late", text, categoryId: cat!.id });
    const done = commitImport(admin, job.id, { confirm: true });
    expect(done.counts.created).toBe(0);
    expect(done.counts.skipped).toBeGreaterThan(0);
  });
  it("rolls everything back when a later batch fails", () => {
    const s = approved();
    const rows = Array.from({ length: 250 }, (_, i) => row(`Bulk import practice question ${i} on indexing strategy?`));
    const job = stage(csv(...rows), { sourceId: s.id });
    expect(job.counts.valid).toBe(250);
    const before = db().questions.size;
    const out = commitImport(admin, job.id, {
      confirm: true,
      beforeInsert: (b) => {
        if (b === 2) throw new Error("disk full");
      },
    });
    expect(out.status).toBe("FAILED");
    expect(out.message).toContain("rolled back");
    expect(db().questions.size).toBe(before);
    expect(db().audit.some((a) => a.action === "import.failed")).toBe(true);
    expect(db().sources.get(s.id)!.lastImportAt).toBeNull();
  });
  it("commits large imports in bounded batches", () => {
    const s = approved();
    const rows = Array.from({ length: 250 }, (_, i) => row(`Batched practice question ${i} on caching and eviction?`));
    const job = stage(csv(...rows), { sourceId: s.id });
    const seen: number[] = [];
    commitImport(admin, job.id, { confirm: true, beforeInsert: (b) => seen.push(b) });
    expect(seen).toEqual([0, 1, 2]);
  });
  it("re-checks the source permission at commit time", () => {
    const { s, job } = prepared(1);
    db().sources.get(s.id)!.permission = "NOT_APPROVED";
    expect(() => commitImport(admin, job.id, { confirm: true })).toThrowError(expect.objectContaining({ code: "BLOCKED" }));
    expect([...db().questions.values()].some((q) => q.text.startsWith("Imported practice"))).toBe(false);
  });
  it("imports companies as drafts and rejects duplicates by name", () => {
    const s = makeSource({ permission: "APPROVED", url: "https://example.org/co", type: "MANUAL_CURATION" });
    const text =
      "name,website,careersUrl,industry\nNewCo Labs,https://newco.example.com,https://newco.example.com/jobs,Software\nGoogle,https://www.google.com,https://careers.google.com,Technology\nBadCo,javascript:alert(1),https://x.example.com,Software\n";
    const job = stage(text, { sourceId: s.id, kind: "companies" });
    expect(job.staged.map((r) => r.status)).toEqual(["VALID", "DUPLICATE", "INVALID"]);
    commitImport(admin, job.id, { confirm: true });
    const c = [...db().companies.values()].find((x) => x.name === "NewCo Labs")!;
    expect(c.publication).toBe("DRAFT");
    expect(c.origin).toBe("ADMIN_CURATED");
  });
});

describe("import security", () => {
  beforeEach(() => fresh(true));
  it("rejects everyone who is not an admin", () => {
    const s = approved();
    const job = stage(csv(row("A valid question for the permission test, please?")), { sourceId: s.id });
    for (const actor of [null, user]) {
      expect(() =>
        stageImport({ actor, kind: "questions", sourceId: s.id, filename: "q.csv", mime: "text/csv", bytes: enc(csv(row("x"))) }),
      ).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
      expect(() => commitImport(actor, job.id, { confirm: true })).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    }
  });
  it("rate limits repeated uploads", () => {
    const s = approved();
    resetRateLimit(`import:${admin.id}`);
    let blocked: unknown;
    for (let i = 0; i < 12; i++) {
      try {
        stage(csv(row(`Rate limit probe question number ${i} about joins?`)), { sourceId: s.id });
      } catch (e) {
        blocked = e;
      }
    }
    expect(blocked).toBeInstanceOf(ContentError);
    expect((blocked as ContentError).message).toContain("Too many");
  });
  it("neutralises spreadsheet formulas in the error report", () => {
    const job = {
      staged: [
        { row: 2, status: "INVALID", data: null, errors: ['=HYPERLINK("http://evil")', "+cmd|calc"], preview: "@SUM(1)" },
        { row: 3, status: "VALID", data: {}, errors: [], preview: "" },
      ],
    } as unknown as ImportJob;
    const out = errorReportCsv(job);
    const lines = out.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(out).toContain("\"'=HYPERLINK");
    expect(out).not.toMatch(/,=|,\+|,@|,"=/);
  });
  it("never fetches URLs: there is no url import path", async () => {
    const mod = await import("@/lib/content/import/pipeline");
    expect(Object.keys(mod).some((k) => /url|fetch|scrape|crawl/i.test(k))).toBe(false);
  });
});
