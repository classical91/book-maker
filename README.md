# Draftloom

Guided nonfiction book drafting built with Next.js, Clerk, Prisma, OpenAI, and DOCX export.

## What It Does

Draftloom is intentionally not a one-click book generator. The workflow is:

1. Create a book project with title, genre, audience, tone, premise, target words, and chapter count.
2. Generate an AI outline with a book summary plus chapter-by-chapter bullets.
3. Edit and approve the outline before drafting.
4. Generate a brief for one chapter.
5. Generate the full chapter draft.
6. Review, revise, and continue through the manuscript.
7. Export the current manuscript as a `.docx`.

## Stack

- Next.js 16 App Router
- TypeScript + Tailwind CSS
- Clerk for authentication
- Prisma 7 + PostgreSQL
- OpenAI Responses API for outline, brief, and draft generation
- `docx` for manuscript export

## Environment Variables

Copy `.env.example` to `.env` and replace the placeholder values.

Always required:

- `DATABASE_URL`
- `DIRECT_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Required for multi-user mode only:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

Notes:

- `DATABASE_URL` is used by the Prisma client adapter at runtime.
- `DIRECT_URL` is used by Prisma CLI commands.
- The default model in the repo is `gpt-5.1`, but you can override it.
- Each generation step can use its own model via `OPENAI_OUTLINE_MODEL`,
  `OPENAI_BRIEF_MODEL`, and `OPENAI_DRAFT_MODEL`; each falls back to
  `OPENAI_MODEL`. Generation retries only transient failures (timeouts, 429,
  5xx) with jittered backoff, and each chapter holds a generation lock so two
  requests can't draft it at once.

## Authentication Modes

The app runs in one of two modes, selected with `APP_MODE`:

- `single_user`: every request is attributed to `SINGLE_USER_ID` (default
  `jason`). No sign-in is required. Use this for local development or a
  deliberately single-user deployment.
- `multi_user`: requests are authenticated with Clerk. The four Clerk variables
  above are required.

If `APP_MODE` is unset, the mode is inferred: `multi_user` when Clerk keys are
present, and `single_user` in development. **In production, an unset mode with
no Clerk keys is a hard configuration error** — the app fails closed rather than
silently attributing every request to one shared account. To run single-user in
production intentionally, set `APP_MODE=single_user` explicitly.

## Local Setup

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run db:generate
```

Run your database migration after pointing `DATABASE_URL` and `DIRECT_URL` at a real Postgres instance:

```bash
npm run db:migrate
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database Migrations & Deployment

The schema is managed entirely through Prisma migrations in `prisma/migrations`.
Application pages never create or alter tables at request time.

- Local development: `npm run db:migrate` (`prisma migrate dev`).
- Production/deploy: `npm run db:deploy`.

`npm run db:deploy` (`scripts/migrate-deploy.mjs`) is safe to run against:

1. A fresh database — all tables are created from the migrations.
2. A Prisma-managed database — only pending migrations are applied.
3. A legacy database created before migrations existed — the initial migration
   is marked as already-applied (baselined) so only newer migrations run,
   preserving existing data.

Railway runs `npm run db:deploy` before `npm run start` (see `railway.toml`), so
migrations are applied before the app serves traffic.

### Rollback notes

The `add_ebooks` migration only creates the `ebooks` table (guarded with
`IF NOT EXISTS`) and never drops or mutates existing data, so applying it is
non-destructive. To roll back, redeploy the previous image; the extra table is
harmless if unused. If you must remove it, `DROP TABLE "ebooks"` manually and
delete its row from `_prisma_migrations`.

## Testing

Unit and service tests run with [Vitest](https://vitest.dev) and require no
database or network:

```bash
npm test          # run once
npm run test:watch
```

They cover the pure logic most prone to regressions: Markdown block parsing,
chapter state transitions, generation eligibility, word counting, filename
handling, e-book validation, continuity-memory building/replacement, outline
normalization, and export chapter filtering. CI runs them on every pull request
alongside lint, typecheck, and build.

Database-backed integration tests (ownership isolation, migrations, out-of-order
generation rejection, revision-on-regeneration) and Playwright end-to-end flows
are the next testing step; they require a Postgres service and Playwright
browsers in CI and are tracked as follow-up.

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:studio
```

## Current MVP Scope

Included:

- Landing page
- Clerk auth
- Dashboard of saved projects
- Project creation workflow
- AI outline generation
- Editable outline with locked drafted chapters
- Chapter brief generation
- Chapter draft generation
- Sequential drafting guardrails
- Manuscript view
- DOCX export

Deferred:

- Whole-book auto generation
- EPUB or PDF export
- Rich text editing
- Billing
- Collaboration
- Fiction-specific story bible tooling
