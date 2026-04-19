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

Required values:

- `DATABASE_URL`
- `DIRECT_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

Notes:

- `DATABASE_URL` is used by the Prisma client adapter at runtime.
- `DIRECT_URL` is used by Prisma CLI commands.
- The default model in the repo is `gpt-5.1`, but you can override it.

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

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
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
