// Verifies prisma/sql/phase2_search.sql on a real PostgreSQL, using throwaway tables in a scratch schema.
//   FTS_CHECK_URL=postgresql://user:pass@localhost:5432/dbname node scripts/check-fts.mjs
import fs from "node:fs";
import pg from "pg";

const url = process.env.FTS_CHECK_URL;
if (!url) {
  console.error("Set FTS_CHECK_URL to a PostgreSQL connection string.");
  process.exit(2);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  -> " + extra));
};

await client.query("DROP SCHEMA IF EXISTS fts_check CASCADE; CREATE SCHEMA fts_check; SET search_path = fts_check;");
await client.query(`
  CREATE TABLE "Question" (id text PRIMARY KEY, slug text UNIQUE, text text NOT NULL, skills text[] NOT NULL DEFAULT '{}', "answerOutline" text NOT NULL, publication text NOT NULL, "publishedAt" timestamptz);
  CREATE TABLE "Company" (id text PRIMARY KEY, name text NOT NULL, industry text NOT NULL, "roleCategories" text[] NOT NULL DEFAULT '{}', publication text NOT NULL);
  CREATE TABLE "ContentSource" (id text PRIMARY KEY, "sourceId" text NOT NULL, "companyId" text, "processId" text, "questionId" text, "experienceId" text);
`);
// Strip the comment-only query pattern, then run the real file.
await client.query(fs.readFileSync(new URL("../prisma/sql/phase2_search.sql", import.meta.url), "utf8"));
check("phase2_search.sql applies cleanly", true);

const q = (id, slug, text, skills, outline, pub = "PUBLISHED", at = "2026-01-01") =>
  client.query(`INSERT INTO "Question" VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, slug, text, skills, outline, pub, at]);
await q("1", "reverse-list", "Reverse a singly linked list in place.", ["linked lists"], "Walk once and flip pointers.");
await q("2", "two-sum", "Find two numbers that add up to a target using a hash map.", ["hash maps"], "Keep a map of seen values.");
await q("3", "outline-only", "Explain caching strategies.", [], "A linked list can back an LRU cache.");
await q("4", "draft-q", "A draft question about linked list cycles.", [], "Floyd's algorithm.", "DRAFT");
await q("5", "sql-join", "Explain the difference between INNER JOIN and LEFT JOIN.", ["joins"], "Inner keeps matches only.");
await client.query(
  `INSERT INTO "Company" VALUES ('c1','Tata Consultancy Services (TCS)','IT services','{"Software engineer"}','PUBLISHED'), ('c2','Razorpay','Financial technology','{}','PUBLISHED')`,
);

const search = (term, limit = 10, offset = 0) =>
  client
    .query(
      `SELECT q."slug", ts_rank_cd(q."searchVector", tsq) AS rank FROM "Question" q, websearch_to_tsquery('english', $1) tsq
   WHERE q."publication" = 'PUBLISHED' AND q."searchVector" @@ tsq ORDER BY rank DESC, q."publishedAt" DESC, q."id" ASC LIMIT $2 OFFSET $3`,
      [term, limit, offset],
    )
    .then((r) => r.rows.map((x) => x.slug));

check("finds a published question by keyword", (await search("linked list")).includes("reverse-list"));
check("stems words (joins matches join)", (await search("join")).includes("sql-join"));
const ranked = await search("linked list");
check("text match outranks an outline only match", ranked.indexOf("reverse-list") < ranked.indexOf("outline-only"), JSON.stringify(ranked));
check("never returns drafts", !(await search("linked list cycles")).includes("draft-q"));
check("searches skills", (await search("hash maps")).includes("two-sum"));
check("OR and exclusion syntax work", JSON.stringify(await search("join -inner")) === "[]" && (await search("hash OR join")).length === 2);
check(
  "pagination is stable",
  JSON.stringify([...(await search("explain", 1, 0)), ...(await search("explain", 1, 1))]) ===
    JSON.stringify((await search("explain", 5, 0)).slice(0, 2)),
);

for (const evil of [
  '\'; DROP TABLE "Question"; --',
  "(((",
  "& | ! <->",
  "a".repeat(5000),
  "\\",
  "%",
  "\u0000".replace("\u0000", ""),
  "linked' OR '1'='1",
]) {
  let ok = true,
    err = "";
  try {
    await search(evil);
  } catch (e) {
    ok = false;
    err = e.message;
  }
  check(`hostile input is harmless: ${evil.slice(0, 24).replace(/\n/g, " ")}`, ok, err);
}
check("table still exists after the injection attempt", (await client.query(`SELECT count(*)::int AS n FROM "Question"`)).rows[0].n === 5);

const comp = (term) =>
  client
    .query(
      `SELECT c."name" FROM "Company" c, websearch_to_tsquery('simple', $1) tsq WHERE c."publication" = 'PUBLISHED' AND c."searchVector" @@ tsq`,
      [term],
    )
    .then((r) => r.rows.map((x) => x.name));
check("finds a company by name", (await comp("razorpay")).includes("Razorpay") && (await comp("tcs")).length === 1);

await client.query("SET enable_seqscan = off");
const plan = (
  await client.query(`EXPLAIN SELECT slug FROM "Question" WHERE "searchVector" @@ websearch_to_tsquery('english', 'linked')`)
).rows
  .map((r) => r["QUERY PLAN"])
  .join("\n");
check("search uses the GIN index", /Question_searchVector_idx/.test(plan), plan);
await client.query("SET enable_seqscan = on");

const cs = (cols) =>
  client.query(
    `INSERT INTO "ContentSource" (id, "sourceId", ${cols.map((c) => `"${c}"`).join(", ")}) VALUES ('x${Math.random()}', 's', ${cols.map(() => "'i'").join(", ")})`,
  );
await cs(["questionId"]);
check("content source accepts exactly one item", true);
let rejected = 0;
for (const cols of [[], ["questionId", "companyId"]]) {
  try {
    await cs(cols.length ? cols : ["companyId"]).then(async () => {
      if (!cols.length) throw new Error("skip");
    });
  } catch {
    rejected++;
  }
}
await client.query(`INSERT INTO "ContentSource" (id, "sourceId") VALUES ('none','s')`).then(
  () => check("content source with no item is rejected", false),
  () => check("content source with no item is rejected", true),
);
await client.query(`INSERT INTO "ContentSource" (id, "sourceId", "questionId", "companyId") VALUES ('two','s','a','b')`).then(
  () => check("content source with two items is rejected", false),
  () => check("content source with two items is rejected", true),
);

await client.query("DROP SCHEMA fts_check CASCADE");
await client.end();
console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((r) => !r).length} failed`);
process.exit(results.every(Boolean) ? 0 : 1);
