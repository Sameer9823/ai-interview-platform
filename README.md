# InterviewPilot

AI interview and career preparation for students, freshers and working professionals.

- **Phase 1** (done): landing page, authentication, onboarding, two dashboards, profile, goals, settings, Samai AI service layer.
- **Phase 2** (done, this release): company knowledge base, question bank, interview experiences, source registry, authorized imports, admin area, search, bookmarks.
- Phase 3 onward (not started): AI question generation, assessments, resume analysis, mock interviews.

No recruiter accounts, hiring workflows or employer features exist. Companies are reference entries for preparation.

Next.js (App Router), React 19, TypeScript strict, Zod 3, Prisma schema for PostgreSQL, samai-sdk 0.3.7.

## Run it

    npm install
    cp .env.example .env        # set AUTH_SECRET
    npm run dev                 # http://localhost:3000

The app runs with no database and no AI key. To try the admin area locally, add `ALLOW_DEV_ADMIN=1` and `DEV_ADMIN_EMAIL=you@example.com` to `.env`, sign up with that email, and open `/admin`. This shortcut is for local development only.

## Important limits

- **Data is held in memory.** Users (Phase 1) and all content (Phase 2) live in stores that reset when the server restarts. They are the only files to replace with Prisma queries: `lib/data/dev-store.ts`, `lib/content/store.ts` and the functions in `lib/content/service.ts`, `search.ts`, `import/pipeline.ts`.
- **Migrations were not generated or run.** Prisma's engine download is blocked in the build sandbox. The schema (25 models, 22 enums) parses with Prisma's parser. Commands are in `docs/PHASE2.md`. The admin grant script and Prisma seed are written but were not run.
- **No third party source is approved.** 38 sources are registered. Only the platform's own original content is Approved. Everything else is Link only, Manual review required or Unknown and has not been reviewed. Nothing from them is copied.
- **No interview experiences or interview process records exist.** The seed has none on purpose. The 16 company pages carry only a name, an industry and the official careers link, marked Not yet verified.
- Email verification and password reset are not built.
- Playwright specs exist but have not been run (the browser download is blocked here). No real browser, screen reader or axe testing has been done. See `docs/ACCESSIBILITY_DEBT.md`.
- Tailwind CSS, shadcn/ui and React Hook Form are not used. The UI is a plain CSS design system with server actions.
- The visual style is ChaiUI, not the white and blue from the brief, by your choice.

## What was verified (run in the build sandbox)

| Check                                                        | Result             |
| ------------------------------------------------------------ | ------------------ |
| `npm test` (Vitest, 11 files)                                | 184 passing        |
| `npm run lint`                                               | clean              |
| `npm run typecheck` (strict)                                 | clean              |
| `npm run format:check`                                       | clean              |
| `npm run build`                                              | succeeds, 38 pages |
| `python3 tests/http-smoke.py` (Phase 1, real server)         | 85 of 85           |
| `python3 tests/http-smoke-content.py` (Phase 2, real server) | 137 of 137         |
| `npm run fts:check` (search SQL on PostgreSQL 16)            | 22 of 22           |

Bugs these runs found and that are fixed: a hardcoded admin role in the session, empty list fields in admin forms failing validation, a non immutable function in the generated search column, a slug overwritten by a blank form value, and several wrong test expectations.

## Documentation

| File                         | What it covers                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/PHASE2.md`             | routes, models, migration plan, workflow and publishing rules, permissions, admin bootstrap, source registry and approval workflow, search, imports, adding a connector, limitations |
| `docs/IMPORTS.md`            | CSV and JSON column reference                                                                                                                                                        |
| `docs/samples/`              | labeled example import files, verified by a test                                                                                                                                     |
| `docs/DESIGN_SYSTEM.md`      | tokens, type scale, components, measured contrast                                                                                                                                    |
| `docs/ACCESSIBILITY_DEBT.md` | known accessibility issues                                                                                                                                                           |
| `docs/AI_GUARDRAILS.md`      | what the AI layer enforces and what is planned                                                                                                                                       |

## Commands

| Command                                                         | What it does                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`                               | develop, build, serve                                                      |
| `npm run lint` / `typecheck` / `format:check`                   | quality gates                                                              |
| `npm test`                                                      | 184 unit tests, no paid AI calls                                           |
| `npm run test:e2e`                                              | Playwright (needs a browser)                                               |
| `python3 tests/http-smoke.py` and `tests/http-smoke-content.py` | end to end against a running build (headers list the env to start it with) |
| `npm run fts:check`                                             | test the PostgreSQL search SQL (needs `FTS_CHECK_URL`)                     |
| `npm run admin:grant -- email`                                  | give a verified account admin access (needs a database)                    |
| `npm run seed:stats`                                            | print what the sample seed creates                                         |
| `npm run contrast`                                              | contrast ratios from the real CSS                                          |

## Samai SDK

Verified against `samai-sdk@0.3.7`. It needs `zod ^3.23.8`, so the project uses Zod 3. Provider SDKs are optional peers, installed as optional dependencies. The SDK lazily imports other optional packages, which breaks Next's bundler, so `next.config.mjs` loads it from `node_modules` at runtime. Configure `AI_PROVIDER`, `AI_MODEL` and the matching key. `/api/health/ai` reports safe status to signed in users. Phase 2 makes no AI calls. See `docs/AI_GUARDRAILS.md`.

## Structure

    app/                routes and global CSS (public content, private app, /admin)
    components/         ui, layout, dashboard, landing, content, admin
    features/           actions and screens: auth, onboarding, profile, saved, admin
    lib/                validation, permissions, auth, ai, data, content (types, service, search, dto, import)
    prisma/             schema, search SQL, dev seed
    scripts/            grant-admin, check-fts, contrast, seed-stats
    tests/ e2e/         unit, HTTP and browser tests
    docs/               guides and sample files
