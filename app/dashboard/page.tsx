import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { HomeLogo } from "@/components/home-logo";
import { StatusPill } from "@/components/status-pill";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const userId = await requireUserIdOrRedirect();

  const projects = await prisma.bookProject.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      genre: true,
      audience: true,
      totalChapters: true,
      status: true,
      updatedAt: true,
      chapters: {
        select: {
          status: true,
          wordCount: true,
        },
      },
    },
  });

  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <HomeLogo />
            <div>
              <h1 className="font-serif text-5xl leading-none text-[var(--foreground)]">
                Book projects
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Outline first, then brief and draft one chapter at a time. Every project here
                is saved as a continuing workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/completed"
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              Completed
            </Link>
            <Link
              href="/projects/new"
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
            >
              New project
            </Link>
          </div>
        </header>

        {projects.length ? (
          <section className="paper-panel overflow-hidden rounded-[36px]">
            <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr_1fr] gap-4 border-b border-[var(--line)] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              <span>Project</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Words / updated</span>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {projects.map((project) => {
                const draftedCount = project.chapters.filter((chapter) =>
                  ["DRAFTED", "REVIEWED", "COMPLETE"].includes(chapter.status),
                ).length;
                const completedCount = project.chapters.filter(
                  (chapter) => chapter.status === "COMPLETE",
                ).length;
                const totalWords = project.chapters.reduce(
                  (sum, chapter) => sum + (chapter.wordCount || 0),
                  0,
                );

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/outline`}
                    className="grid gap-5 px-6 py-5 transition hover:bg-[rgba(255,255,255,0.42)] md:grid-cols-[1.6fr_0.8fr_0.9fr_1fr]"
                  >
                    <div className="space-y-2">
                      <h2 className="font-serif text-2xl leading-tight text-[var(--foreground)]">
                        {project.title}
                      </h2>
                      <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                        {project.genre} for {project.audience}
                      </p>
                    </div>

                    <div className="flex items-start">
                      <StatusPill status={project.status} />
                    </div>

                    <div className="text-sm leading-6 text-[var(--muted)]">
                      <p>{draftedCount} drafted</p>
                      <p>{completedCount} complete</p>
                      <p>{project.totalChapters} total chapters</p>
                    </div>

                    <div className="text-sm leading-6 text-[var(--muted)]">
                      <p>{formatNumber(totalWords)} words</p>
                      <p>{project.updatedAt.toLocaleDateString()}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="paper-panel texture-lines rounded-[36px] px-6 py-12 sm:px-10">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Empty workspace
              </p>
              <h2 className="font-serif text-4xl leading-tight text-[var(--foreground)]">
                Start the first project and let the app build the outline immediately.
              </h2>
              <p className="text-base leading-7 text-[var(--muted)]">
                The MVP is optimized for nonfiction. Give it the premise, audience, tone, and
                chapter count, then refine the outline before drafting Chapter 1.
              </p>
              <Link
                href="/projects/new"
                className="inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
              >
                Create your first project
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
