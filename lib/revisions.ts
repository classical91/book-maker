import { Prisma, RevisionSource } from "@prisma/client";

// A Prisma client or an interactive-transaction client. PrismaClient is
// structurally assignable to TransactionClient, so both work here.
type Db = Prisma.TransactionClient;

// Keep revision history bounded so a project's storage cannot grow without limit.
const MAX_REVISIONS_PER_PARENT = 50;

// Minimum spacing between throttled (autosave-driven) snapshots of the same
// parent, so rapid autosaves don't create a revision on every keystroke pause.
const THROTTLE_MS = 60_000;

type ChapterSnapshot = {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  brief: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  wordCount: number | null;
};

type EbookSnapshot = {
  id: string;
  title: string;
  content: string | null;
};

async function pruneChapterRevisions(db: Db, chapterId: string) {
  const stale = await db.chapterRevision.findMany({
    where: { chapterId },
    orderBy: { createdAt: "desc" },
    skip: MAX_REVISIONS_PER_PARENT,
    select: { id: true },
  });
  if (stale.length > 0) {
    await db.chapterRevision.deleteMany({
      where: { id: { in: stale.map((row) => row.id) } },
    });
  }
}

async function pruneEbookRevisions(db: Db, ebookId: string) {
  const stale = await db.ebookRevision.findMany({
    where: { ebookId },
    orderBy: { createdAt: "desc" },
    skip: MAX_REVISIONS_PER_PARENT,
    select: { id: true },
  });
  if (stale.length > 0) {
    await db.ebookRevision.deleteMany({
      where: { id: { in: stale.map((row) => row.id) } },
    });
  }
}

/**
 * Snapshots the given (prior) chapter state into history before it is
 * overwritten. Returns the created revision, or null when nothing was saved.
 *
 * When `throttle` is true (routine manual/autosave paths) a snapshot is skipped
 * if the latest revision already captured identical content or was taken very
 * recently. AI (re)generation always snapshots, since that path can otherwise
 * permanently destroy edited prose.
 */
export async function snapshotChapterRevision(
  db: Db,
  chapter: ChapterSnapshot,
  source: RevisionSource,
  options: { throttle?: boolean; model?: string | null } = {},
) {
  const { throttle = false, model = null } = options;

  if (throttle) {
    const latest = await db.chapterRevision.findFirst({
      where: { chapterId: chapter.id },
      orderBy: { createdAt: "desc" },
      select: { content: true, title: true, summary: true, createdAt: true },
    });
    if (latest) {
      const unchanged =
        latest.content === chapter.content &&
        latest.title === chapter.title &&
        latest.summary === chapter.summary;
      const recent = Date.now() - latest.createdAt.getTime() < THROTTLE_MS;
      if (unchanged || recent) {
        return null;
      }
    }
  }

  const revision = await db.chapterRevision.create({
    data: {
      chapterId: chapter.id,
      title: chapter.title,
      content: chapter.content,
      summary: chapter.summary,
      brief: chapter.brief,
      wordCount: chapter.wordCount,
      source,
      model,
    },
  });

  await pruneChapterRevisions(db, chapter.id);
  return revision;
}

/**
 * Snapshots the given (prior) ebook state into history before it is overwritten.
 * Throttled the same way as chapter snapshots for routine saves.
 */
export async function snapshotEbookRevision(
  db: Db,
  ebook: EbookSnapshot,
  source: RevisionSource,
  options: { throttle?: boolean } = {},
) {
  const { throttle = false } = options;

  if (throttle) {
    const latest = await db.ebookRevision.findFirst({
      where: { ebookId: ebook.id },
      orderBy: { createdAt: "desc" },
      select: { content: true, title: true, createdAt: true },
    });
    if (latest) {
      const unchanged = latest.content === ebook.content && latest.title === ebook.title;
      const recent = Date.now() - latest.createdAt.getTime() < THROTTLE_MS;
      if (unchanged || recent) {
        return null;
      }
    }
  }

  const revision = await db.ebookRevision.create({
    data: {
      ebookId: ebook.id,
      title: ebook.title,
      content: ebook.content,
      source,
    },
  });

  await pruneEbookRevisions(db, ebook.id);
  return revision;
}
