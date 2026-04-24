"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HomeLogo } from "@/components/home-logo";
import { StatusPill } from "@/components/status-pill";
import { cn, formatNumber } from "@/lib/utils";

type SidebarChapter = {
  id: string;
  chapterNumber: number;
  title: string;
  status: string;
  wordCount: number | null;
};

type ProjectSidebarProps = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  totalChapters: number;
  chapters: SidebarChapter[];
};

export default function ProjectSidebar({
  projectId,
  projectTitle,
  projectStatus,
  totalChapters,
  chapters,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const completedCount = chapters.filter((chapter) => chapter.status === "COMPLETE").length;
  const draftedCount = chapters.filter((chapter) =>
    ["DRAFTED", "REVIEWED", "COMPLETE"].includes(chapter.status),
  ).length;
  const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);
  const progress = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return (
    <aside className="border-b border-[var(--line)] bg-[rgba(251,246,238,0.88)] backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 px-5 py-6">
        <div className="space-y-3">
          <HomeLogo />
          <div className="space-y-2">
            <h2 className="font-serif text-2xl leading-tight text-[var(--foreground)]">
              {projectTitle}
            </h2>
            <StatusPill status={projectStatus} />
          </div>
        </div>

        <div className="paper-panel space-y-4 p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            <span>Book progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(33,23,17,0.08)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm text-[var(--muted)]">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em]">Completed</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                {completedCount}/{totalChapters}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em]">Drafted</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                {draftedCount}/{totalChapters}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[11px] uppercase tracking-[0.18em]">Words so far</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                {formatNumber(totalWords)}
              </dd>
            </div>
          </dl>
        </div>

        <nav className="grid gap-2">
          {[
            { href: `/projects/${projectId}/outline`, label: "Outline" },
            { href: `/projects/${projectId}/manuscript`, label: "Manuscript" },
          ].map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-[var(--foreground)] text-[var(--paper)]"
                    : "bg-[rgba(255,255,255,0.5)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.9)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Chapters
            </h3>
            <span className="text-xs text-[var(--muted)]">{chapters.length}</span>
          </div>
          <div className="grid min-h-0 flex-1 auto-rows-min gap-2 overflow-y-auto pr-1 max-h-[52vh] lg:max-h-none">
            {chapters.map((chapter) => {
              const href = `/projects/${projectId}/chapters/${chapter.id}`;
              const active = pathname === href;

              return (
                <Link
                  key={chapter.id}
                  href={href}
                  className={cn(
                    "rounded-2xl border border-[var(--line)] px-4 py-3 transition",
                    active
                      ? "bg-[rgba(33,23,17,0.92)] text-[var(--paper)]"
                      : "bg-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.88)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-[0.2em]",
                          active ? "text-[rgba(247,240,233,0.68)]" : "text-[var(--muted)]",
                        )}
                      >
                        Chapter {chapter.chapterNumber}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold">
                        {chapter.title}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          active ? "text-[rgba(247,240,233,0.72)]" : "text-[var(--muted)]",
                        )}
                      >
                        {formatNumber(chapter.wordCount || 0)} words
                      </p>
                    </div>
                    <StatusPill status={chapter.status} compact />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
