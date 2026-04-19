import Link from "next/link";
import { notFound } from "next/navigation";

import OutlineEditor from "@/components/outline-editor";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { getHighestDraftedChapterNumber } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { parseOutlineBullets } from "@/lib/schemas";

export const metadata = {
  title: "Outline",
};

export default async function OutlinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const userId = await requireUserIdOrRedirect();
  const { projectId } = await params;

  const project = await prisma.bookProject.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      status: true,
      chapters: {
        orderBy: {
          chapterNumber: "asc",
        },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          outlineBullets: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const highestDraftedChapter = getHighestDraftedChapterNumber(project.chapters);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]"
            >
              Dashboard
            </Link>
            <div>
              <h1 className="font-serif text-5xl leading-none text-[var(--foreground)]">
                {project.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                Edit the structure before drafting starts. Once a chapter has a draft, earlier
                outline items lock to protect continuity.
              </p>
            </div>
          </div>
        </header>

        <OutlineEditor
          projectId={project.id}
          initialSummary={project.summary || ""}
          summaryLocked={highestDraftedChapter > 0}
          initialChapters={project.chapters.map((chapter) => ({
            id: chapter.id,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            bullets: parseOutlineBullets(chapter.outlineBullets),
            status: chapter.status,
            locked: chapter.chapterNumber <= highestDraftedChapter,
          }))}
        />
      </div>
    </main>
  );
}
