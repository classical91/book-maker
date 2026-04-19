import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Completed Books",
};

export default async function CompletedPage() {
  const userId = await requireUserIdOrRedirect();

  const projects = await prisma.bookProject.findMany({
    where: { ownerId: userId, status: "COMPLETE" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      genre: true,
      audience: true,
      tone: true,
      totalChapters: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      chapters: {
        select: { status: true, wordCount: true, title: true, chapterNumber: true },
        orderBy: { chapterNumber: "asc" },
      },
    },
  });

  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Draftloom</Link>
              <span className="text-[var(--muted)]">/</span>
              <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Dashboard</Link>
            </div>
            <div>
              <h1 className="font-serif text-5xl leading-none text-[var(--foreground)]">Completed books</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                {projects.length
                  ? `${projects.length} book${projects.length === 1 ? "" : "s"} finished. Export any manuscript as a .docx file.`
                  : "No completed books yet. Keep drafting."}
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]">
            All projects
          </Link>
        </header>

        {projects.length > 0 ? (
          <div className="flex flex-col gap-6">
            {projects.map((project) => {
              const totalWords = project.chapters.reduce((sum, ch) => sum + (ch.wordCount ?? 0), 0);
              const completedChapters = project.chapters.filter((ch) => ch.status === "COMPLETE").length;
              const daysToWrite = Math.max(1, Math.round((project.updatedAt.getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <section key={project.id} className="paper-panel overflow-hidden rounded-[32px]">
                  <div className="flex flex-wrap items-start justify-between gap-4 px-8 py-7 border-b border-[var(--line)]">
                    <div className="space-y-2">
                      <h2 className="font-serif text-3xl leading-tight text-[var(--foreground)]">{project.title}</h2>
                      <p className="text-sm text-[var(--muted)]">{project.genre} · {project.audience} · {project.tone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={project.status} />
                      <Link href={`/projects/${project.id}/export/docx`} className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]">
                        Export .docx
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--line)] border-b border-[var(--line)]">
                    {[
                      { label: "Total words", value: formatNumber(totalWords) },
                      { label: "Chapters", value: `${completedChapters} / ${project.totalChapters}` },
                      { label: "Days to write", value: String(daysToWrite) },
                      { label: "Completed", value: project.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    ].map((stat) => (
                      <div key={stat.label} className="px-6 py-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] mb-1">{stat.label}</p>
                        <p className="font-serif text-3xl text-[var(--foreground)]">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="px-8 py-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] mb-4">Chapters</p>
                    <div className="grid gap-2">
                      {project.chapters.map((ch) => (
                        <div key={ch.chapterNumber} className="flex items-center justify-between gap-4 py-2 border-b border-[var(--line)] last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-[var(--muted)] w-6 text-right">{ch.chapterNumber}</span>
                            <span className="text-sm text-[var(--foreground)]">{ch.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-[var(--muted)]">{ch.wordCount ? formatNumber(ch.wordCount) + " words" : "—"}</span>
                            <StatusPill status={ch.status} compact />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-8 py-5 border-t border-[var(--line)] bg-[rgba(255,255,255,0.3)]">
                    <Link href={`/projects/${project.id}/manuscript`} className="text-sm font-semibold text-[var(--accent)] hover:underline">Read online →</Link>
                    <span className="text-[var(--line)]">·</span>
                    <Link href={`/projects/${project.id}/outline`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition">View outline</Link>
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="paper-panel texture-lines rounded-[36px] px-6 py-16 sm:px-10">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Nothing here yet</p>
              <h2 className="font-serif text-4xl leading-tight text-[var(--foreground)]">Finish your first manuscript to see it here.</h2>
              <p className="text-base leading-7 text-[var(--muted)]">Mark all chapters as complete and the project will move to this shelf.</p>
              <Link href="/dashboard" className="inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]">
                Back to projects
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
