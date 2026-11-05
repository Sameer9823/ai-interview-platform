import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/content/store";
import { seedContent } from "@/lib/content/seed";
import * as svc from "@/lib/content/service";
import { searchCompanies, getCompany, getExperience, getQuestion } from "@/lib/content/search";
import { companyQuery } from "@/lib/content/validation";
import { admin, user, fresh, makeSource, companyIn, questionIn, experienceIn } from "./content-helpers";

const publish = (kind: svc.ContentKindAlias, id: string) => {
  svc.setPublication(admin, kind, id, "IN_REVIEW");
  return svc.setPublication(admin, kind, id, "PUBLISHED");
};
declare module "@/lib/content/service" {
  type ContentKindAlias = "company" | "process" | "question" | "experience";
}

describe("seed data", () => {
  beforeEach(() => fresh(true));
  it("is idempotent", () => {
    const n = db().questions.size + db().companies.size + db().sources.size;
    expect(seedContent(db()).created).toBe(0);
    expect(db().questions.size + db().companies.size + db().sources.size).toBe(n);
  });
  it("approves nothing it has not reviewed", () => {
    const approved = [...db().sources.values()].filter((s) => s.permission === "APPROVED");
    expect(approved.map((s) => s.slug)).toEqual(["platform-original"]);
    for (const s of db().sources.values())
      if (s.slug !== "platform-original") {
        expect(s.reviewStatus).toBe("UNREVIEWED");
        expect(s.lastCheckedAt).toBeNull();
      }
    expect(
      [...db().sources.values()].filter((s) => s.type === "PUBLIC_EXPERIENCE").every((s) => s.permission === "MANUAL_REVIEW_REQUIRED"),
    ).toBe(true);
  });
  it("invents no experiences, processes or company claims", () => {
    expect(db().experiences.size).toBe(0);
    expect(db().processes.size).toBe(0);
    for (const c of db().companies.values()) {
      expect(c.verification).toBe("NOT_VERIFIED");
      expect(c.hiringInfo).toBe("");
      expect(c.description).toBe("");
      expect(c.lastVerifiedAt).toBeNull();
    }
    for (const q of db().questions.values()) {
      expect(q.origin).toBe("PLATFORM_ORIGINAL");
      expect(q.companyIds).toEqual([]);
    }
  });
  it("covers sixteen companies, every difficulty and several categories", () => {
    expect(db().companies.size).toBe(16);
    expect(new Set([...db().questions.values()].map((q) => q.difficulty))).toEqual(new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]));
    expect(new Set([...db().questions.values()].map((q) => q.categoryId)).size).toBeGreaterThan(10);
  });
  it("every seeded multiple choice question is publishable and every seeded question passes the publish rules", () => {
    for (const q of db().questions.values()) expect(svc.publishBlockers("question", q)).toEqual([]);
  });
});

describe("administration is admin only", () => {
  beforeEach(() => fresh());
  it("rejects missing and ordinary users on every admin operation", () => {
    const s = makeSource();
    const ops: (() => unknown)[] = [
      () => svc.saveCompany(null, companyIn([s.id])),
      () => svc.saveCompany(user, companyIn([s.id])),
      () => svc.saveQuestion(user, questionIn([s.id])),
      () => svc.saveSource(user, {}),
      () => svc.setPublication(user, "question", "x", "PUBLISHED"),
      () => svc.bulkSetPublication(user, "question", ["x"], "ARCHIVED", true),
      () => svc.reviewQueue(user),
      () => svc.listAudit(user),
      () => svc.adminStats(user),
      () => svc.createCategory(user, { name: "Nope" }),
      () => svc.saveExperience(user, {}),
      () => svc.saveProcess(user, {}),
    ];
    for (const op of ops) expect(op).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    expect(db().companies.size).toBe(0);
  });
  it("a role claimed in the payload does nothing", () => {
    const s = makeSource();
    expect(() => svc.saveCompany({ id: "x", platformRole: "NONE" }, { ...companyIn([s.id]), platformRole: "ADMIN" })).toThrow();
  });
  it("records an audit entry for every admin mutation", () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, companyIn([s.id]));
    publish("company", c.id);
    svc.saveCompany(admin, companyIn([s.id], { industry: "Fintech" }), c.id);
    svc.createCategory(admin, { name: "New area" });
    const actions = svc.listAudit(admin).map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        "source.create",
        "company.create",
        "status.in_review",
        "status.published",
        "company.update",
        "category.create",
      ]),
    );
    expect(svc.listAudit(admin).every((a) => a.actorId === admin.id)).toBe(true);
  });
});

describe("company workflow and visibility", () => {
  beforeEach(() => fresh());
  it("creates a draft with a generated unique slug and rejects a clashing slug", () => {
    const s = makeSource();
    const a = svc.saveCompany(admin, companyIn([s.id]));
    const b = svc.saveCompany(admin, companyIn([s.id]));
    expect(a.slug).toBe("test-co");
    expect(b.slug).toBe("test-co-2");
    expect(a.publication).toBe("DRAFT");
    expect(() => svc.saveCompany(admin, companyIn([s.id], { name: "Other", slug: "test-co" }))).toThrowError(
      expect.objectContaining({ code: "CONFLICT" }),
    );
  });
  it("validates urls and rejects unsafe ones", () => {
    const s = makeSource();
    for (const bad of ["javascript:alert(1)", "http://localhost/x", "http://169.254.169.254/", "ftp://x.com"])
      expect(() => svc.saveCompany(admin, companyIn([s.id], { website: bad }))).toThrowError(
        expect.objectContaining({ code: "VALIDATION" }),
      );
  });
  it("cannot jump from draft to published, and needs a note to reject", () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, companyIn([s.id]));
    expect(() => svc.setPublication(admin, "company", c.id, "PUBLISHED")).toThrowError(expect.objectContaining({ code: "BLOCKED" }));
    svc.setPublication(admin, "company", c.id, "IN_REVIEW");
    expect(() => svc.setPublication(admin, "company", c.id, "REJECTED")).toThrowError(expect.objectContaining({ code: "VALIDATION" }));
    svc.setPublication(admin, "company", c.id, "REJECTED", "Duplicate of an existing entry");
    expect(svc.setPublication(admin, "company", c.id, "DRAFT").publication).toBe("DRAFT");
  });
  it("refuses to publish without clearance: no source, unknown, manual review, not approved, rejected review", () => {
    const none = svc.saveCompany(admin, companyIn([]));
    svc.setPublication(admin, "company", none.id, "IN_REVIEW");
    expect(() => svc.setPublication(admin, "company", none.id, "PUBLISHED")).toThrowError(
      expect.objectContaining({ reasons: [expect.stringContaining("at least one source")] }),
    );
    for (const permission of ["UNKNOWN", "MANUAL_REVIEW_REQUIRED", "NOT_APPROVED"]) {
      const s = makeSource({ url: `https://example.org/${permission}`, title: permission, permission });
      const c = svc.saveCompany(admin, companyIn([s.id], { name: `Co ${permission}` }));
      svc.setPublication(admin, "company", c.id, "IN_REVIEW");
      expect(() => svc.setPublication(admin, "company", c.id, "PUBLISHED")).toThrowError(expect.objectContaining({ code: "BLOCKED" }));
    }
    const rej = makeSource({ url: "https://example.org/rejected", reviewStatus: "REJECTED" });
    const c = svc.saveCompany(admin, companyIn([rej.id], { name: "Rejected src" }));
    svc.setPublication(admin, "company", c.id, "IN_REVIEW");
    expect(() => svc.setPublication(admin, "company", c.id, "PUBLISHED")).toThrow();
  });
  it("allows approved, attribution required and link only sources", () => {
    for (const permission of ["APPROVED", "ATTRIBUTION_REQUIRED", "LINK_ONLY"]) {
      const s = makeSource({ url: `https://example.org/${permission}`, title: permission, permission });
      const c = svc.saveCompany(admin, companyIn([s.id], { name: `Co ${permission}` }));
      expect(publish("company", c.id).publication).toBe("PUBLISHED");
    }
  });
  it("requires an official source for publicly documented hiring information", () => {
    const community = makeSource();
    const official = makeSource({
      url: "https://example.org/official",
      title: "Official",
      type: "OFFICIAL_CAREERS",
      permission: "LINK_ONLY",
    });
    const c = svc.saveCompany(admin, companyIn([community.id], { hiringInfo: "Applications open twice a year." }));
    svc.setPublication(admin, "company", c.id, "IN_REVIEW");
    expect(() => svc.setPublication(admin, "company", c.id, "PUBLISHED")).toThrowError(
      expect.objectContaining({ reasons: [expect.stringContaining("official source")] }),
    );
    svc.saveCompany(admin, companyIn([community.id, official.id], { hiringInfo: "Applications open twice a year." }), c.id);
    expect(svc.setPublication(admin, "company", c.id, "PUBLISHED").publication).toBe("PUBLISHED");
  });
  it("sets the last verified date when a company is marked verified", () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, companyIn([s.id]));
    expect(c.lastVerifiedAt).toBeNull();
    expect(svc.saveCompany(admin, companyIn([s.id], { verification: "VERIFIED" }), c.id).lastVerifiedAt).not.toBeNull();
  });
  it("shows only published companies publicly, and drafts to previewers", () => {
    const s = makeSource();
    const d = svc.saveCompany(admin, companyIn([s.id], { name: "Draft Co" }));
    const p = svc.saveCompany(admin, companyIn([s.id], { name: "Live Co" }));
    publish("company", p.id);
    const names = (o = {}) => searchCompanies(companyQuery.parse({}), o).items.map((c) => c.name);
    expect(names()).toEqual(["Live Co"]);
    expect(names({ includeUnpublished: true })).toEqual(["Draft Co", "Live Co"]);
    expect(getCompany(d.slug)).toBeNull();
    expect(getCompany(d.slug, { includeUnpublished: true })).not.toBeNull();
    expect(getCompany(p.slug)).not.toBeNull();
  });
  it("preserves source attribution on the public company page", () => {
    const s = makeSource({ attribution: "Credit Example Org" });
    const c = svc.saveCompany(admin, companyIn([s.id]));
    publish("company", c.id);
    const page = getCompany(c.slug)!;
    expect(page.company.sources[0]).toMatchObject({ title: "Test source", attribution: "Credit Example Org", domain: "example.org" });
  });
  it("keeps published content valid when it is edited", () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, companyIn([s.id]));
    publish("company", c.id);
    expect(() => svc.saveCompany(admin, companyIn([], {}), c.id)).toThrowError(expect.objectContaining({ code: "BLOCKED" }));
    expect(db().companies.get(c.id)!.sourceIds).toEqual([s.id]);
  });
});

describe("form style input", () => {
  beforeEach(() => fresh(true));
  it("accepts a question where every optional field is an empty string, as web forms send them", () => {
    const s = makeSource();
    const q = svc.saveQuestion(admin, {
      text: "Explain how a database index speeds up a query.",
      slug: "",
      categorySlug: "dbms",
      type: "SHORT_ANSWER",
      difficulty: "BEGINNER",
      estimatedMinutes: "5",
      companySlugs: "",
      roles: "",
      careerStages: "",
      experienceLevels: "",
      skills: "",
      tags: "",
      answerOutline: "An index keeps sorted keys.",
      explanation: "",
      exampleAnswer: "",
      codeSolution: "",
      codeLanguage: "",
      testCases: "",
      hints: "",
      options: "",
      origin: "ADMIN_CURATED",
      verification: "NOT_VERIFIED",
      sourceIds: s.id,
      moderatorNotes: "",
    });
    expect(q).toMatchObject({ roles: [], skills: [], hints: [], options: [], companyIds: [], careerStages: [] });
  });
  it("accepts a company and an experience with empty optional fields", () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, {
      name: "Form Co",
      slug: "",
      website: "https://formco.example.com",
      careersUrl: "https://formco.example.com/jobs",
      logoUrl: "",
      industry: "Software",
      description: "",
      headquarters: "",
      hiringInfo: "",
      roleCategories: "",
      prepCategories: "",
      origin: "ADMIN_CURATED",
      verification: "NOT_VERIFIED",
      sourceIds: [s.id],
      moderatorNotes: "",
    });
    expect(c.roleCategories).toEqual([]);
    const e = svc.saveExperience(admin, {
      companyId: c.id,
      role: "Engineer",
      slug: "",
      careerStage: "",
      experienceLevel: "",
      reportedYear: "",
      summary: "The contributor described two rounds of questions.",
      rounds: "",
      topics: "",
      reportedQuestions: "",
      advice: "",
      sourceUrl: "",
      sourceRef: "ref",
      origin: "CANDIDATE_REPORTED",
      verification: "NOT_VERIFIED",
      sourceIds: [s.id],
      moderatorNotes: "",
    });
    expect(e).toMatchObject({ careerStage: null, experienceLevel: null, reportedYear: null, topics: [] });
  });
  it("still limits list sizes and item length", () => {
    const s = makeSource();
    expect(() =>
      svc.saveQuestion(admin, questionIn([s.id], { skills: Array.from({ length: 16 }, (_, i) => `skill${i}`).join(",") })),
    ).toThrowError(expect.objectContaining({ fieldErrors: expect.objectContaining({ skills: expect.stringContaining("up to 15") }) }));
    expect(() => svc.saveQuestion(admin, questionIn([s.id], { roles: "x".repeat(200) }))).toThrowError(
      expect.objectContaining({ code: "VALIDATION" }),
    );
  });
});

describe("questions", () => {
  beforeEach(() => fresh(true));
  const src = () => makeSource();
  it("creates, edits, versions and records revisions", () => {
    const s = src();
    const q = svc.saveQuestion(admin, questionIn([s.id]));
    expect(q.version).toBe(1);
    const q2 = svc.saveQuestion(
      admin,
      questionIn([s.id], { difficulty: "ADVANCED", answerOutline: "A different outline for the answer." }),
      q.id,
    );
    expect(q2.version).toBe(2);
    const revs = svc.revisionsFor("question", q.id);
    expect(revs.map((r) => r.version)).toEqual([2, 1]);
    expect(revs[0]!.changed).toEqual(expect.arrayContaining(["difficulty", "answerOutline"]));
  });
  it("validates required fields with readable messages", () => {
    try {
      svc.saveQuestion(admin, { text: "short", sourceIds: [] });
      expect.unreachable();
    } catch (e) {
      const f = (e as svc.ContentError).fieldErrors;
      expect(f.text).toBeTruthy();
      expect(f.categorySlug).toBeTruthy();
      expect(f.answerOutline).toBeTruthy();
    }
  });
  it("requires a correct option for multiple choice and a language for code", () => {
    const s = src();
    expect(() => svc.saveQuestion(admin, questionIn([s.id], { type: "MULTIPLE_CHOICE", options: "One\nTwo" }))).toThrowError(
      expect.objectContaining({ fieldErrors: expect.objectContaining({ options: expect.any(String) }) }),
    );
    expect(svc.saveQuestion(admin, questionIn([s.id], { type: "MULTIPLE_CHOICE", options: "*One\nTwo" })).options).toEqual([
      { text: "One", correct: true },
      { text: "Two", correct: false },
    ]);
    expect(() => svc.saveQuestion(admin, questionIn([s.id], { codeSolution: "print(1)" }))).toThrowError(
      expect.objectContaining({ fieldErrors: expect.objectContaining({ codeLanguage: expect.any(String) }) }),
    );
  });
  it("never attaches a company to an original or AI question, and needs evidence otherwise", () => {
    const platform = [...db().sources.values()].find((x) => x.slug === "platform-original")!;
    const edu = src();
    for (const origin of ["PLATFORM_ORIGINAL", "AI_GENERATED"])
      expect(() => svc.saveQuestion(admin, questionIn([platform.id], { origin, companySlugs: "google" }))).toThrowError(
        expect.objectContaining({ code: "VALIDATION" }),
      );
    const noEvidence = makeSource({ url: "https://example.org/edu", type: "EDUCATIONAL", permission: "LINK_ONLY" });
    expect(() => svc.saveQuestion(admin, questionIn([noEvidence.id], { companySlugs: "google" }))).toThrowError(
      expect.objectContaining({ code: "VALIDATION" }),
    );
    expect(svc.saveQuestion(admin, questionIn([edu.id], { companySlugs: "google" })).companyIds).toHaveLength(1);
    expect(() => svc.saveQuestion(admin, questionIn([edu.id], { companySlugs: "no-such-company" }))).toThrowError(
      expect.objectContaining({ code: "VALIDATION" }),
    );
  });
  it("keeps AI generated questions in draft until a human marks them verified", () => {
    const platform = [...db().sources.values()].find((x) => x.slug === "platform-original")!;
    const q = svc.saveQuestion(admin, questionIn([platform.id], { origin: "AI_GENERATED" }));
    svc.setPublication(admin, "question", q.id, "IN_REVIEW");
    expect(() => svc.setPublication(admin, "question", q.id, "PUBLISHED")).toThrowError(
      expect.objectContaining({ reasons: [expect.stringContaining("human review")] }),
    );
    svc.saveQuestion(admin, questionIn([platform.id], { origin: "AI_GENERATED", verification: "VERIFIED" }), q.id);
    expect(svc.setPublication(admin, "question", q.id, "PUBLISHED").publication).toBe("PUBLISHED");
  });
  it("detects likely duplicates by normalized text", () => {
    expect(
      svc.findDuplicateQuestions("  Reverse a SINGLY linked list in place... Describe your approach and its time and space complexity!")
        .length,
    ).toBe(1);
    expect(svc.findDuplicateQuestions("An entirely different question about trees.").length).toBe(0);
  });
  it("hides unpublished questions from the public and shows the answer outline separately from the explanation", () => {
    const s = src();
    const q = svc.saveQuestion(admin, questionIn([s.id], { explanation: "Long form explanation here." }));
    expect(getQuestion(q.slug)).toBeNull();
    publish("question", q.id);
    const got = getQuestion(q.slug)!.question;
    expect(got.answerOutline).not.toBe(got.explanation);
    expect(got.originLabel).toBe("Administrator curated");
  });
  it("returns published original questions with a clear label", () => {
    const got = getQuestion("two-sum-indices")!.question;
    expect(got.originLabel).toBe("Original practice content");
    expect(got.originNote).toContain("not a real company interview question");
    expect(got.verificationLabel).toBe("Not yet verified");
  });
});

describe("interview experiences and provenance", () => {
  beforeEach(() => fresh());
  const setup = () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, companyIn([s.id]));
    publish("company", c.id);
    return { s, c };
  };
  it("cannot be marked official or platform original", () => {
    const { s, c } = setup();
    for (const origin of ["OFFICIAL", "PLATFORM_ORIGINAL", "ADMIN_CURATED"])
      expect(() => svc.saveExperience(admin, experienceIn(c.id, [s.id], { origin }))).toThrowError(
        expect.objectContaining({ code: "VALIDATION" }),
      );
  });
  it("needs a source record and a source reference or URL to publish", () => {
    const { s, c } = setup();
    const noRef = svc.saveExperience(admin, experienceIn(c.id, [s.id], { sourceRef: "" }));
    svc.setPublication(admin, "experience", noRef.id, "IN_REVIEW");
    expect(() => svc.setPublication(admin, "experience", noRef.id, "PUBLISHED")).toThrowError(
      expect.objectContaining({ reasons: [expect.stringContaining("original source")] }),
    );
    expect(publish("experience", svc.saveExperience(admin, experienceIn(c.id, [s.id])).id).publication).toBe("PUBLISHED");
  });
  it("labels candidate reported content and never shows moderator notes or ids", () => {
    const { s, c } = setup();
    const e = svc.saveExperience(admin, experienceIn(c.id, [s.id], { moderatorNotes: "SECRET moderator remark about the contributor" }));
    publish("experience", e.id);
    const dto = getExperience(e.slug)!;
    const json = JSON.stringify(dto);
    expect(dto.originLabel).toBe("Candidate reported");
    expect(dto.originNote).toContain("Not confirmed by the company");
    expect(json).not.toContain("SECRET");
    expect(json).not.toContain("moderatorNotes");
    expect(json).not.toContain(s.id);
    expect(json).not.toContain("sourceIds");
  });
  it("keeps unpublished experiences private", () => {
    const { s, c } = setup();
    const e = svc.saveExperience(admin, experienceIn(c.id, [s.id]));
    expect(getExperience(e.slug)).toBeNull();
    expect(getExperience(e.slug, { includeUnpublished: true })).not.toBeNull();
    expect(getCompany(c.slug)!.experiences).toHaveLength(0);
  });
  it("rejects unsafe source URLs", () => {
    const { s, c } = setup();
    expect(() => svc.saveExperience(admin, experienceIn(c.id, [s.id], { sourceUrl: "javascript:alert(1)" }))).toThrowError(
      expect.objectContaining({ code: "VALIDATION" }),
    );
  });
  it("shows the original source URL publicly", () => {
    const { s, c } = setup();
    const e = svc.saveExperience(admin, experienceIn(c.id, [s.id], { sourceUrl: "https://example.org/post/1" }));
    publish("experience", e.id);
    expect(getExperience(e.slug)!.sourceUrl).toBe("https://example.org/post/1");
  });
});

describe("source changes flow through to dependent content", () => {
  beforeEach(() => fresh(true));
  it("returns published content to review when its source stops being cleared", () => {
    const s = makeSource();
    const c = svc.saveCompany(admin, companyIn([s.id]));
    const q = svc.saveQuestion(admin, questionIn([s.id]));
    publish("company", c.id);
    publish("question", q.id);
    expect(svc.dependentsOf(s.id)).toHaveLength(2);
    svc.saveSource(admin, { ...s, permission: "NOT_APPROVED", commercialUse: "UNKNOWN", redistribution: "UNKNOWN", url: s.url }, s.id);
    expect(db().companies.get(c.id)!.publication).toBe("IN_REVIEW");
    expect(db().questions.get(q.id)!.publication).toBe("IN_REVIEW");
    expect(db().questions.get(q.id)!.moderatorNotes).toContain("no longer cleared");
    expect(getQuestion(q.slug)).toBeNull();
    expect(
      svc
        .reviewQueue(admin)
        .map((r) => r.kind)
        .sort(),
    ).toEqual(["company", "question"]);
    expect(svc.listAudit(admin).some((a) => a.summary.includes("Returned to review"))).toBe(true);
  });
  it("rejects a duplicate source URL and a non http url", () => {
    makeSource();
    expect(() => makeSource({ title: "Again" })).toThrowError(expect.objectContaining({ code: "CONFLICT" }));
    expect(() => makeSource({ url: "file:///etc/passwd", title: "x" })).toThrowError(expect.objectContaining({ code: "VALIDATION" }));
  });
});

describe("bulk status changes", () => {
  beforeEach(() => fresh(true));
  it("require confirmation, apply the same gates, and report per item", () => {
    const good = makeSource();
    const bad = makeSource({ url: "https://example.org/bad", title: "Bad", permission: "UNKNOWN" });
    const a = svc.saveQuestion(admin, questionIn([good.id]));
    const b = svc.saveQuestion(admin, questionIn([bad.id], { text: "A second distinct question for the bulk test." }));
    svc.setPublication(admin, "question", a.id, "IN_REVIEW");
    svc.setPublication(admin, "question", b.id, "IN_REVIEW");
    expect(() => svc.bulkSetPublication(admin, "question", [a.id, b.id], "PUBLISHED", false)).toThrowError(
      expect.objectContaining({ code: "VALIDATION" }),
    );
    const r = svc.bulkSetPublication(admin, "question", [a.id, b.id, "missing"], "PUBLISHED", true);
    expect(r.map((x) => x.ok)).toEqual([true, false, false]);
    expect(r[1]!.reason).toContain("cannot be published");
    expect(db().questions.get(a.id)!.publication).toBe("PUBLISHED");
    expect(db().questions.get(b.id)!.publication).toBe("IN_REVIEW");
  });
  it("is limited to 100 items", () => {
    expect(() =>
      svc.bulkSetPublication(
        admin,
        "question",
        Array.from({ length: 101 }, (_, i) => `id${i}`),
        "ARCHIVED",
        true,
      ),
    ).toThrow();
  });
});
