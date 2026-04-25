import Link from "next/link";
import { notFound } from "next/navigation";

import { ManuscriptActions } from "@/components/manuscript-actions";
import { StatusPill } from "@/components/status-pill";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Manuscript",
};

export default async function ManuscriptPage({
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
          content: true,
          wordCount: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const totalWords = project.chapters.reduce(
    (sum, chapter) => sum + (chapter.wordCount || 0),
    0,
  );

  const fullText = project.chapters
    .filter((ch) => ch.content)
    .map((ch) => `${ch.title}\n\n${ch.content}`)
    .join("\n\n");

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
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
              {project.summary ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
                  {project.summary}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={project.status} />
            <ManuscriptActions
              projectId={project.id}
              fullText={fullText}
              status={project.status}
            />
          </div>
        </header>

        <section className="paper-panel rounded-[32px] p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Status
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {project.status.toLowerCase().replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Chapters
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {project.chapters.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Total words
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {formatNumber(totalWords)}
              </p>
            </div>
          </div>
        </section>

        <article className="grid gap-6">
          {project.chapters.map((chapter) => (
            <section key={chapter.id} className="paper-panel rounded-[32px] p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Chapter {chapter.chapterNumber}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl leading-tight text-[var(--foreground)]">
                    {chapter.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatNumber(chapter.wordCount || 0)} words
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusPill status={chapter.status} compact />
                  <Link
                    href={`/projects/${project.id}/chapters/${chapter.id}`}
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
                  >
                    Edit chapter
                  </Link>
                </div>
              </div>

              {chapter.content ? (
                <div className="whitespace-pre-wrap font-serif text-[18px] leading-8 text-[var(--foreground)]">
                  {chapter.content}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">No draft yet for this chapter.</p>
              )}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}

