import { beforeEach, describe, expect, it } from "vitest";
import * as svc from "@/lib/content/service";
import { db } from "@/lib/content/store";
import {
  clearSaved,
  isSaved,
  listSaved,
  relatedQuestions,
  searchExperiences,
  searchQuestions,
  toggleSaved,
  topicTree,
  getTopic,
} from "@/lib/content/search";
import { companyQuery, experienceQuery, questionQuery } from "@/lib/content/validation";
import { admin, fresh, makeSource, questionIn } from "./content-helpers";

const q = (o: Record<string, unknown> = {}) => questionQuery.parse(o);
const slugs = (o: Record<string, unknown> = {}) => searchQuestions(q(o)).items.map((x) => x.slug);

describe("question search", () => {
  beforeEach(() => fresh(true));
  it("paginates on the server with bounded page sizes", () => {
    const total = [...db().questions.values()].length;
    const p1 = searchQuestions(q({ pageSize: 10 }));
    expect(p1.items).toHaveLength(10);
    expect(p1.total).toBe(total);
    expect(p1.totalPages).toBe(Math.ceil(total / 10));
    const last = searchQuestions(q({ pageSize: 10, page: p1.totalPages }));
    expect(last.items.length).toBe(total - (p1.totalPages - 1) * 10);
    expect(searchQuestions(q({ pageSize: 10, page: 999 })).page).toBe(p1.totalPages); // clamps instead of returning nothing
    expect(q({ pageSize: 99999 }).pageSize).toBe(12);
    expect(q({ pageSize: 0 }).pageSize).toBe(12);
    expect(q({ page: -4 }).page).toBe(1);
    expect(q({ page: "abc" }).page).toBe(1);
    const a = new Set(slugs({ pageSize: 10, page: 1 })),
      b = slugs({ pageSize: 10, page: 2 });
    expect(b.some((s) => a.has(s))).toBe(false);
  });
  it("gives the same order every time", () => {
    expect(slugs({ pageSize: 50 })).toEqual(slugs({ pageSize: 50 }));
    expect(slugs({ q: "explain", pageSize: 50 })).toEqual(slugs({ q: "explain", pageSize: 50 }));
  });
  it("finds by keyword and requires every word to match", () => {
    expect(slugs({ q: "linked list" })).toContain("reverse-linked-list");
    expect(slugs({ q: "linked banana" })).toEqual([]);
    expect(slugs({ q: "sql" })).toEqual(expect.arrayContaining(["second-highest-salary", "inner-vs-left-join"]));
    expect(slugs({ q: "Hash  MAPS!!" })).toContain("two-sum-indices");
  });
  it("ranks stronger matches first", () => {
    const r = slugs({ q: "join" });
    expect(r[0]).toBe("inner-vs-left-join");
  });
  it("treats hostile input as plain words, never as a pattern", () => {
    for (const evil of ["(.*+", "[a-", "' OR 1=1 --", "<script>alert(1)</script>", "a".repeat(5000), "%00", "\\"])
      expect(() => searchQuestions(q({ q: evil }))).not.toThrow();
    expect(q({ q: "a".repeat(5000) }).q.length).toBe(200);
  });
  it("filters by category including sub categories", () => {
    expect(slugs({ category: "technical", pageSize: 50 })).toContain("second-highest-salary");
    expect(slugs({ category: "sql", pageSize: 50 }).sort()).toEqual(["inner-vs-left-join", "second-highest-salary"]);
    expect(slugs({ category: "aptitude", pageSize: 50 })).toContain("train-speed-pole");
    expect(slugs({ category: "does-not-exist" })).toEqual([]);
  });
  it("filters by difficulty, type, role, stage, skill, origin and verification", () => {
    expect(searchQuestions(q({ difficulty: "ADVANCED" })).items.every((x) => x.difficulty === "ADVANCED")).toBe(true);
    expect(slugs({ type: "SQL" })).toEqual(["second-highest-salary"]);
    expect(slugs({ role: "backend engineer" })).toEqual(["design-url-shortener"]);
    expect(slugs({ stage: "PROFESSIONAL", pageSize: 50 })).toContain("design-url-shortener");
    expect(slugs({ stage: "STUDENT", pageSize: 50 })).not.toContain("design-url-shortener");
    expect(slugs({ skill: "hash" })).toEqual(["two-sum-indices"]);
    expect(slugs({ origin: "PLATFORM_ORIGINAL", pageSize: 50 }).length).toBe(db().questions.size);
    expect(slugs({ origin: "OFFICIAL" })).toEqual([]);
    expect(slugs({ verification: "VERIFIED" })).toEqual([]);
  });
  it("ignores invalid filter values instead of failing", () => {
    expect(q({ difficulty: "IMPOSSIBLE", type: "x", sort: "chaos" })).toMatchObject({
      difficulty: undefined,
      type: undefined,
      sort: "relevance",
    });
  });
  it("sorts by difficulty and by estimated time", () => {
    const d = searchQuestions(q({ sort: "difficulty", pageSize: 50 })).items.map((x) => x.difficulty);
    const rank = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 };
    expect(d.map((x) => rank[x])).toEqual([...d.map((x) => rank[x])].sort((a, b) => a - b));
    const t = searchQuestions(q({ sort: "time", pageSize: 50 })).items.map((x) => x.estimatedMinutes);
    expect(t).toEqual([...t].sort((a, b) => a - b));
  });
  it("never returns unpublished questions to the public, and shows them to admins who ask", () => {
    const s = makeSource();
    const draft = svc.saveQuestion(admin, questionIn([s.id], { text: "A draft only question about graph traversal." }));
    expect(slugs({ q: "graph traversal" })).toEqual([]);
    expect(searchQuestions(q({ q: "graph traversal" }), { includeUnpublished: true }).items.map((x) => x.slug)).toEqual([draft.slug]);
  });
  it("filters by company only when the tag is justified", () => {
    const evidence = makeSource({ url: "https://example.org/e" });
    const x = svc.saveQuestion(
      admin,
      questionIn([evidence.id], { companySlugs: "google", text: "A reported style question about caching layers." }),
    );
    svc.setPublication(admin, "question", x.id, "IN_REVIEW");
    svc.setPublication(admin, "question", x.id, "PUBLISHED");
    expect(slugs({ company: "google" })).toEqual([x.slug]);
    expect(slugs({ company: "amazon" })).toEqual([]);
    expect(slugs({ company: "nonexistent" })).toEqual([]);
    expect(searchQuestions(q({ company: "google" })).items[0]!.companies).toEqual([{ slug: "google", name: "Google" }]);
  });
});

describe("topics, companies, experiences queries and related content", () => {
  beforeEach(() => fresh(true));
  it("builds the topic tree from real counts", () => {
    const tree = topicTree();
    expect(tree.map((t) => t.slug)).toEqual(["general-preparation", "technical", "professional-and-business"]);
    expect(tree.reduce((n, t) => n + t.count, 0)).toBe(db().questions.size);
    expect(getTopic("sql")!.name).toBe("SQL");
    expect(getTopic("nope")).toBeNull();
  });
  it("bounds company and experience queries", () => {
    expect(companyQuery.parse({ pageSize: 500 }).pageSize).toBe(12);
    expect(experienceQuery.parse({ page: 0 }).page).toBe(1);
    expect(searchExperiences(experienceQuery.parse({})).items).toEqual([]);
  });
  it("recommends related questions from metadata, excluding itself and unpublished", () => {
    const base = [...db().questions.values()].find((x) => x.slug === "second-highest-salary")!;
    const rel = relatedQuestions(base).map((x) => x.slug);
    expect(rel).toContain("inner-vs-left-join");
    expect(rel).not.toContain("second-highest-salary");
    db().questions.get([...db().questions.values()].find((x) => x.slug === "inner-vs-left-join")!.id)!.publication = "UNPUBLISHED";
    expect(relatedQuestions(base).map((x) => x.slug)).not.toContain("inner-vs-left-join");
  });
});

describe("saved questions", () => {
  beforeEach(() => fresh(true));
  const one = () => [...db().questions.values()][0]!;
  it("saves and removes, and persists per user", () => {
    expect(toggleSaved("u1", one().id)).toBe(true);
    expect(isSaved("u1", one().id)).toBe(true);
    expect(listSaved("u1").items).toHaveLength(1);
    expect(toggleSaved("u1", one().id)).toBe(false);
    expect(listSaved("u1").items).toHaveLength(0);
  });
  it("keeps one user's bookmarks away from another", () => {
    toggleSaved("alice", one().id);
    expect(listSaved("bob").items).toEqual([]);
    expect(isSaved("bob", one().id)).toBe(false);
    toggleSaved("bob", [...db().questions.values()][1]!.id);
    expect(listSaved("alice").items.map((x) => x.slug)).toEqual([one().slug]);
  });
  it("refuses unpublished and unknown questions", () => {
    const s = makeSource();
    const d = svc.saveQuestion(admin, questionIn([s.id]));
    expect(() => toggleSaved("u1", d.id)).toThrow();
    expect(() => toggleSaved("u1", "missing")).toThrow();
  });
  it("hides a saved question that was later unpublished and says how many are hidden", () => {
    toggleSaved("u1", one().id);
    svc.setPublication(admin, "question", one().id, "UNPUBLISHED");
    const l = listSaved("u1");
    expect(l.items).toEqual([]);
    expect(l.hidden).toBe(1);
  });
  it("is cleared when an account is deleted", () => {
    toggleSaved("u1", one().id);
    clearSaved("u1");
    expect(listSaved("u1").items).toEqual([]);
  });
});
