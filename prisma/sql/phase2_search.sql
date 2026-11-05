-- Phase 2 search and integrity additions that Prisma cannot express.
-- Apply through a custom migration so migration history and the shadow database stay in sync:
--   npx prisma migrate dev --create-only --name phase2_search
--   (paste this file into the generated migration.sql, then run `npx prisma migrate dev`)
-- Tested against PostgreSQL 16 with scripts/check-fts.mjs on tables with the same column names.

-- 1. Full text search columns. Weighted: question text and company name matter most.
-- array_to_string is only STABLE, which PostgreSQL refuses inside a generated column. For text[] the result never
-- depends on session settings, so a thin IMMUTABLE wrapper is safe.
CREATE FUNCTION ip_array_text(text[]) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT array_to_string($1, ' ') $$;

ALTER TABLE "Question" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("text", '')), 'A') ||
  setweight(to_tsvector('english', coalesce(ip_array_text("skills"), '')), 'B') ||
  setweight(to_tsvector('english', coalesce("answerOutline", '')), 'C')
) STORED;
CREATE INDEX "Question_searchVector_idx" ON "Question" USING GIN ("searchVector");

ALTER TABLE "Company" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("industry", '')), 'B') ||
  setweight(to_tsvector('english', coalesce(ip_array_text("roleCategories"), '')), 'C')
) STORED;
CREATE INDEX "Company_searchVector_idx" ON "Company" USING GIN ("searchVector");

-- 2. A content source row points at exactly one content item.
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_exactly_one_item" CHECK (
  (("companyId" IS NOT NULL)::int + ("processId" IS NOT NULL)::int + ("questionId" IS NOT NULL)::int + ("experienceId" IS NOT NULL)::int) = 1
);

-- Query pattern (always parameterized, websearch_to_tsquery never raises a syntax error on user input):
--   SELECT q."id", q."slug", ts_rank_cd(q."searchVector", tsq) AS rank
--   FROM "Question" q, websearch_to_tsquery('english', $1) tsq
--   WHERE q."publication" = 'PUBLISHED' AND q."searchVector" @@ tsq
--   ORDER BY rank DESC, q."publishedAt" DESC, q."id" ASC
--   LIMIT $2 OFFSET $3;   -- $2 is capped in application code (maximum 50)
