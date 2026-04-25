"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusPill } from "@/components/status-pill";
import { cn, formatNumber } from "@/lib/utils";

type AIProject = {
  id: string;
  title: string;
  genre: string;
  audience: string;
  totalChapters: number;
  status: string;
  updatedAt: Date;
  chapters: { status: string; wordCount: number | null }[];
};

type ManualEbook = {
  id: string;
  title: string;
  updatedAt: Date;
  content: string | null;
};

type Tab = "all" | "ai" | "manual";

export function DashboardTabs({
  projects,
  ebooks,
}: {
  projects: AIProject[];
  ebooks: ManualEbook[];
}) {
  const [tab, setTab] = useState<Tab>("all");

  const showProjects = tab === "all" || tab === "ai";
  const showEbooks = tab === "all" || tab === "manual";
  const hasContent =
    (showProjects && projects.length > 0) || (showEbooks && ebooks.length > 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: projects.length + ebooks.length },
    { key: "ai", label: "AI Drafts", count: projects.length },
    { key: "manual", label: "My E-books", count: ebooks.length },
  ];

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-[var(--foreground)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {t.label}
            <span className={cn("ml-1.5 text-xs tabular-nums", tab === t.key ? "opacity-50" : "opacity-40")}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {hasContent ? (
        <div className="space-y-4">
          {/* AI Projects */}
          {showProjects && projects.length > 0 && (
            <section className="paper-panel overflow-hidden rounded-2xl">
              {tab === "all" && (
                <div className="border-b border-[var(--line)] px-6 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    AI Drafts
                  </p>
                </div>
              )}
              <div className="divide-y divide-[var(--line)]">
                {projects.map((project) => {
                  const draftedCount = project.chapters.filter((ch) =>
                    ["DRAFTED", "REVIEWED", "COMPLETE"].includes(ch.status),
                  ).length;
                  const totalWords = project.chapters.reduce(
                    (sum, ch) => sum + (ch.wordCount || 0),
                    0,
                  );
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}/outline`}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[rgba(0,0,0,0.02)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-serif text-xl text-[var(--foreground)]">
                            {project.title}
                          </h2>
                          <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                            AI
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                          {project.genre} · {project.audience}
                        </p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-5 text-sm text-[var(--muted)] sm:flex">
                        <span>{draftedCount}/{project.totalChapters} ch</span>
                        <span>{formatNumber(totalWords)} words</span>
                        <StatusPill status={project.status} compact />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Manual E-books */}
          {showEbooks && ebooks.length > 0 && (
            <section className="paper-panel overflow-hidden rounded-2xl">
              {tab === "all" && (
                <div className="border-b border-[var(--line)] px-6 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    My E-books
                  </p>
                </div>
              )}
              <div className="divide-y divide-[var(--line)]">
                {ebooks.map((ebook) => {
                  const wordCount = ebook.content
                    ? ebook.content.split(/\s+/).filter(Boolean).length
                    : 0;
                  return (
                    <Link
                      key={ebook.id}
                      href={`/ebooks/${ebook.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[rgba(0,0,0,0.02)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-serif text-xl text-[var(--foreground)]">
                            {ebook.title}
                          </h2>
                          <span className="shrink-0 rounded-full bg-[rgba(0,0,0,0.06)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                            Manual
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                          Updated {new Date(ebook.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-5 text-sm text-[var(--muted)] sm:flex">
                        <span>{formatNumber(wordCount)} words</span>
                        <span className="rounded-full bg-[rgba(0,0,0,0.05)] px-3 py-1 text-xs font-semibold">
                          Draft
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        <section className="paper-panel texture-lines rounded-2xl px-6 py-14 sm:px-10">
          <div className="max-w-lg space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              {tab === "ai" ? "No AI projects" : tab === "manual" ? "No e-books" : "Nothing here yet"}
            </p>
            <h2 className="font-serif text-4xl text-[var(--foreground)]">
              {tab === "ai"
                ? "Set up your first AI project"
                : tab === "manual"
                ? "Write your first e-book"
                : "Start your first book"}
            </h2>
            <p className="text-base leading-7 text-[var(--muted)]">
              {tab === "ai"
                ? "Generate an outline and draft chapters one at a time with full editorial control."
                : tab === "manual"
                ? "Open a blank workspace and write at your own pace."
                : "Choose a path to get started."}
            </p>
            <div className="flex flex-wrap gap-3">
              {(tab === "all" || tab === "ai") && (
                <Link
                  href="/projects/new"
                  className="inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                >
                  Set up with AI
                </Link>
              )}
              {(tab === "all" || tab === "manual") && (
                <Link
                  href="/ebooks/new"
                  className="inline-flex rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                >
                  Write manually
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
