# Phase 2: knowledge base, question bank and admin

Built on Phase 1. Authentication, onboarding, dashboards and settings are unchanged. There are no recruiter accounts, hiring workflows or employer features. Companies are reference entries for preparation.

## What exists

| Module | Public | Admin |
|---|---|---|
| Company knowledge base | `/companies`, `/companies/[slug]` | create, edit, preview, status, version history |
| Interview process and rounds | shown on the company page, grouped by origin | add and edit rounds on a company |
| Question bank | `/questions`, `/questions/[slug]` | create, edit, preview, status, bulk status, duplicate warning |
| Interview experiences | `/interview-experiences`, `/interview-experiences/[slug]` | create, edit, preview, status |
| Topics and taxonomy | `/topics/[slug]` | add categories (any depth) and tags without code changes |
| Source registry | source lists on every page | register, review permission, mark checked, see dependents |
| Imports | none | upload CSV or JSON, validate, preview, confirm, error report |
| Review queue | none | approve or reject with a checklist |
| Audit log | none | every admin change |
| Bookmarks | `/saved` (signed in) | none |
| Related content | on question pages | none |
| Library hub | `/library` (signed in) | none |

## Routes

Public (published content only): `/companies`, `/companies/[slug]`, `/questions`, `/questions/[slug]`, `/interview-experiences`, `/interview-experiences/[slug]`, `/topics/[slug]`.
Signed in: `/saved`, `/library`.
Administrators only: `/admin`, `/admin/companies`, `/admin/companies/new`, `/admin/companies/[id]`, `/admin/processes/new`, `/admin/processes/[id]`, `/admin/questions`, `/admin/questions/new`, `/admin/questions/[id]`, `/admin/experiences`, `/admin/experiences/new`, `/admin/experiences/[id]`, `/admin/categories`, `/admin/sources`, `/admin/sources/new`, `/admin/sources/[id]`, `/admin/imports`, `/admin/imports/[id]`, `/admin/imports/[id]/errors` (CSV download), `/admin/review`, `/admin/audit`.

Admin pages are noindex. Anyone who is not an administrator is redirected before the page renders. The CSV route returns a plain 404 to everyone else.

## Database

`prisma/schema.prisma` adds 16 models and 13 enums to Phase 1's (25 models, 22 enums in total). The schema parses cleanly with Prisma's own parser.

`Source`, `ContentSource`, `Category`, `Tag`, `Company`, `InterviewProcess`, `Question`, `QuestionOption`, `QuestionTag`, `QuestionCompany`, `Experience`, `SavedQuestion`, `ContentRevision`, `ContentAudit`, `ImportJob`, `ImportRecord`.

Design notes:
- One `ContentSource` join table links any content item to any number of sources. A CHECK constraint (in `prisma/sql/phase2_search.sql`) makes sure each row points at exactly one item.
- `moderatorNotes` lives on each content table and is never selected into public queries.
- Deleting a source is restricted while anything uses it. Deleting a user cascades to their bookmarks. Content is archived, never hard deleted.
- The admin audit trail is separate from Phase 1's user facing `AuditLog`.
- Uploaded files are not stored. Only parsed rows are kept (`ImportRecord`).

### Migration plan

Nothing is reset and no user data is touched. The tables are new.

    npx prisma migrate dev --name phase2_content                       # creates the tables
    npx prisma migrate dev --create-only --name phase2_search          # empty migration
    # paste prisma/sql/phase2_search.sql into that migration.sql, then:
    npx prisma migrate dev

**Not run here.** Prisma's engine download is blocked in the build sandbox, so migrations were not generated. The search SQL was tested separately on PostgreSQL 16 (below).

### The app still runs on the in memory store

Like Phase 1's user store, `lib/content/store.ts` holds content in memory and seeds itself on first use. It resets when the server restarts. All reads and writes go through `lib/content/service.ts`, `search.ts` and `import/pipeline.ts`. Replace those with Prisma queries to go to PostgreSQL.

## Workflow and publishing rules

States: Draft, In review, Published, Unpublished, Archived, Rejected.

    Draft -> In review, Archived
    In review -> Published, Rejected, Draft
    Published -> Unpublished, Archived, In review
    Unpublished -> In review, Draft, Archived
    Archived -> Draft
    Rejected -> Draft, Archived

Publishing always goes through review. A rejection needs a note. Bulk changes use exactly the same checks and need a confirmation. Editing published content re-checks the rules, and an edit that would break them is refused.

A item can be published only when:
- it has at least one source, and no source is rejected, Unknown, Manual review required or Not approved (Approved, Attribution required and Link only are usable);
- companies: hiring information needs an official source;
- questions: an answer outline exists; multiple choice has two or more options and a correct one; a company link needs a supporting source and is never allowed on original or AI questions; AI generated questions also need a human review marked Verified;
- experiences: the origin is candidate reported or community reported (never official), and a source URL or reference is kept;
- rounds: the company exists, and officially documented rounds need an official source.

If a source later becomes unusable (permission lowered, or review rejected), every published item that relies on it returns to the review queue with a note, and disappears from the public site.

## Provenance labels shown to visitors

Officially documented, Candidate reported, Community reported, Administrator curated, Original practice content, AI generated practice content. Each carries a plain sentence ("Not confirmed by the company", "It is not a real company interview question"). Verification is shown separately (Not yet verified, Verified, Outdated). Company pages show "Last verified: never" until an administrator verifies.

Public data comes from explicit allowlist mappers (`lib/content/dto.ts`). Nothing is spread from stored records, so moderator notes and source ids cannot leak when a model grows. Tests check this for questions, companies and experiences.

## Permissions

| Who | Can do |
|---|---|
| Visitor | read published content |
| Student, fresher, professional | the above, plus save questions |
| Administrator | everything under `/admin` |

Administrator is `User.platformRole`, separate from career stage. Onboarding, sign up and profile forms strip any role field. The role is read from the stored account on the server, never from the browser. The admin service functions take an actor and refuse anything that is not an administrator, so the check also holds if a page is bypassed. Every admin mutation writes an audit entry.

### Bootstrapping the first administrator

Nobody is promoted automatically, and the first user does not become an administrator.

Production, with a database: the person signs up and verifies their email, then an operator with database access runs

    npm run admin:grant -- someone@example.com

It refuses unverified accounts, increments the session version (so old sessions end), and writes an audit row. `--revoke` removes access. The script is written but could not be run here (no Prisma engines).

Local development and tests only: set `ALLOW_DEV_ADMIN=1` and `DEV_ADMIN_EMAIL=you@example.com`. That one email becomes an administrator at sign up. This is unsafe with real users because email verification is not built, so anyone could claim the address.

## Source registry

Each source records: title, URL, domain, type, publisher, description, license notes, attribution, overall permission, commercial use, redistribution, access method, reliability, review status, last checked, last import, notes.

Permission meanings:
- **Approved**, **Attribution required**: content may be imported (attribution is shown).
- **Link only**: the platform may link to it but not copy from it.
- **Manual review required**, **Unknown**, **Not approved**: nothing may be copied, and content relying on them cannot be published.

### What is registered now

Seed run: 38 sources, 1 Approved, 26 Link only, 7 Manual review required, 4 Unknown.

| Group | Count | Permission | Review |
|---|---|---|---|
| Original practice content (this platform's own) | 1 | Approved | Reviewed |
| Official company careers pages (16 companies) | 16 | Link only | Not yet reviewed |
| Official documentation (MDN) | 1 | Link only | Not yet reviewed |
| Educational resources (HackerRank kit, LeetCode, GeeksforGeeks, IndiaBIX, Codewars, Project Euler, W3Schools, SQLBolt, roadmap.sh) | 9 | Link only | Not yet reviewed |
| Public interview experiences (GeeksforGeeks, Glassdoor, AmbitionBox, LeetCode Discuss) | 4 | Manual review required | Not yet reviewed |
| Dataset sites (Hugging Face, Kaggle, Google Dataset Search) | 3 | Manual review required | Not yet reviewed |
| GitHub search leads (4 searches) | 4 | Unknown | Not yet reviewed |

**No third party source has been reviewed or approved.** The terms and API availability of each were not checked. Link only means "safe to link to", which is all the platform does with them. Last checked is empty for all of them. An administrator must read each source's terms, record what they found, and only then change the permission.

### Approval workflow

1. Register the source (or open a seeded one) and read its terms, license and any API documentation.
2. Quote or link what you reviewed in License notes. Set commercial use, redistribution, attribution and reliability.
3. Set the overall permission and Review status, then Mark as checked.
4. Only Approved or Attribution required sources unlock imports. Link only sources can back original, independently written content.
5. If terms change, lower the permission. Dependent published content returns to review automatically.

## Search

Questions, companies and experiences are searched server side with bounded input: query at most 200 characters, at most 8 words, page size 1 to 50, page 1 to 1000, filters validated with Zod and bad values ignored. Sorting is deterministic (ties break on id). A page past the end clamps to the last page.

**Current implementation (in memory):** words are normalized and every word must match somewhere. Question text counts most, then tags and skills, then category, company and role, then the answer outline. User input is only ever split into words. It is never turned into a pattern, so there is nothing to inject or to cause runaway matching. Filters: keyword, category (including sub categories), difficulty, type, company, role, career stage, experience level, skill, content source type, verification. Sort: relevance, newest, difficulty, preparation time.

**PostgreSQL implementation (prepared and tested, not wired):** `prisma/sql/phase2_search.sql` adds weighted `tsvector` generated columns with GIN indexes for questions and companies. Queries use `websearch_to_tsquery` with bound parameters. `npm run fts:check` creates throwaway tables with the same column names, applies the real file and runs 22 checks on PostgreSQL 16: matches, stemming, ranking, drafts excluded, stable pagination, hostile input (SQL injection text, unbalanced brackets, operators, 5000 characters), index use, and the CHECK constraint. It found one real bug in the first version (`array_to_string` is not immutable, so PostgreSQL refused the generated column), now fixed with a small immutable wrapper.

No external search service is used. Semantic search is not built. The search functions are the boundary where it can be added later.

## Imports

See `docs/IMPORTS.md` for the formats and `docs/samples/` for labeled example files (verified by `tests/samples.test.ts`).

Flow: choose a source and a file, then validate, preview, confirm. Records are created as **drafts only**, with the source attached, origin set from the source type, verification Not verified, and a note recording the import and row. Nothing is ever published by an import.

Safeguards:
- CSV or JSON only, at most 1 MB and 1000 rows. UTF-8 only, no binary bytes, extension and type checked.
- Strict CSV parser (quotes, embedded newlines, BOM). Errors name the line.
- Every row is validated with Zod. Markup is stripped. Links must be public http or https addresses.
- The same file from the same source cannot be imported twice (SHA-256 of the file).
- Duplicates are detected against existing records and against earlier rows in the same file, and skipped.
- A source that is not Approved or Attribution required can be previewed, but the commit is refused, and re-checked at commit time.
- Commits run in batches of 100 and are all or nothing. If a later batch fails, everything inserted is rolled back.
- Error reports are CSV with spreadsheet formula characters neutralized.
- Uploads are rate limited (10 per minute per administrator).
- **There is no URL import and nothing is fetched or scraped**, so there is no server side request forgery path. `safeExternalUrl` already blocks private, loopback, link local, metadata and encoded addresses for every stored link, and is ready for a future fetcher.
- Large imports: `commitImport` is already bounded and batched. To move it off the web request, call it from a queue worker such as BullMQ. No worker is set up.

## Adding an authorized source connector

1. Register the source, get its terms reviewed, and set an importable permission (Approved or Attribution required).
2. Confirm an official API or export exists and note its rate limits. If none, use manual curation or a CSV the owner provides.
3. Write a connector under `lib/content/import/` that returns the same row objects as the CSV parser. Honour the documented rate limit, fetch only what the terms allow, and use `safeExternalUrl` on any address.
4. Feed its rows into the existing staging code so you get validation, duplicates, preview, confirmation, rollback and audit for free.
5. Add tests for permissions, malformed data and the rate limit, and document it here.

## AI

Phase 2 makes no AI calls and browsing never triggers one. The `AI_GENERATED` origin and its rule (cannot publish until a human marks it Verified) are in place so a future content assistant (drafting practice questions, suggesting tags, spotting duplicates) can only ever create drafts through `lib/ai/samai-service.ts`.

## Environment variables

Nothing new is required. New optional ones: `ALLOW_DEV_ADMIN`, `DEV_ADMIN_EMAIL` (dev only), `FTS_CHECK_URL` (only for `npm run fts:check`). See `.env.example`.

## Known limitations

- Content is held in memory until the Prisma queries replace the store. It resets on restart.
- Migrations were not generated or run, and the grant script and Prisma seed were not run.
- Email verification and password reset are still not built, which is why dev admin bootstrap is unsafe for real users.
- No third party source is reviewed or approved, so no third party content is imported or shown.
- No interview experiences or interview process records exist. The seed deliberately contains none.
- The 16 seeded companies carry only a name, an industry and the official careers link. They are marked Not yet verified. Their descriptions are empty on purpose.
- The 28 seeded questions are original, written for this platform, and their answers are marked Not yet verified.
- No dedicated duplicate review page. Duplicates are flagged on the question page and in import previews.
- No version restore (history is read only). No Markdown. Content is plain text.
- No admin Settings page.
- Real browser, screen reader and axe testing of the new pages is still outstanding (see `docs/ACCESSIBILITY_DEBT.md`).
- Playwright tests exist from Phase 1 but have not been run, and none were added for Phase 2.

## Phase 3 integration points

- `lib/ai/samai-service.ts` `generateStructured`, with output stored as `AI_GENERATED` drafts.
- `Question`, `AnswerGuide` style fields (outline, explanation, sample answer, test cases) for rubrics.
- `relatedQuestions` and `searchQuestions` as the retrieval step for generation.
- `ContentRevision` and `ContentAudit` for tracking AI assisted edits.
