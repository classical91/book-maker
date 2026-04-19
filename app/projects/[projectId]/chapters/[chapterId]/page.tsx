import Link from "next/link";
import { notFound } from "next/navigation";

import ChapterWriter from "@/components/chapter-writer";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseChapterBrief, parseOutlineBullets } from "@/lib/schemas";

export const metadata = {
  title: "Chapter Workspace",
};

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ projectId: string; chapterId: string }>;
}) {
  const userId = await requireUserIdOrRedirect();
  const { projectId, chapterId } = await params;

  const project = await prisma.bookProject.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      title: true,
      totalChapters: true,
      chapters: {
        orderBy: {
          chapterNumber: "asc",
        },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          outlineBullets: true,
          brief: true,
          content: true,
          summary: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const chapter = project.chapters.find((item) => item.id === chapterId);

  if (!chapter) {
    notFound();
  }

  const chapterIndex = project.chapters.findIndex((item) => item.id === chapterId);
  const previousChapter = chapterIndex > 0 ? project.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < project.chapters.length - 1 ? project.chapters[chapterIndex + 1] : null;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              href={`/projects/${project.id}/outline`}
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]"
            >
              Outline
            </Link>
            <div>
              <h1 className="font-serif text-5xl leading-none text-[var(--foreground)]">
                {project.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                Draft Chapter {chapter.chapterNumber} of {project.totalChapters}. The chapter
                stays plain text on purpose so the manuscript remains easy to edit and export.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/projects/${project.id}/outline`}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
            >
              Outline
            </Link>
            <Link
              href={`/projects/${project.id}/manuscript`}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
            >
              Manuscript
            </Link>
          </div>
        </header>

        <ChapterWriter
          projectId={project.id}
          chapterId={chapter.id}
          chapterNumber={chapter.chapterNumber}
          initialTitle={chapter.title}
          bullets={parseOutlineBullets(chapter.outlineBullets)}
          initialBrief={parseChapterBrief(chapter.brief)}
          initialContent={chapter.content || ""}
          initialSummary={chapter.summary || ""}
          initialStatus={chapter.status}
          previousChapterId={previousChapter?.id}
          nextChapterId={nextChapter?.id}
        />
      </div>
    </main>
  );
}
