"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

type OutlineChapter = {
  id: string;
  chapterNumber: number;
  title: string;
  bullets: string[];
  status: string;
  locked: boolean;
};

type OutlineEditorProps = {
  projectId: string;
  initialSummary: string;
  initialChapters: OutlineChapter[];
  summaryLocked: boolean;
};

function mapResponseProject(project: {
  summary: string | null;
  chapters: Array<{
    id: string;
    chapterNumber: number;
    title: string;
    outlineBullets: unknown;
    status: string;
  }>;
}) {
  return {
    summary: project.summary || "",
    chapters: project.chapters.map((chapter) => ({
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      bullets: Array.isArray(chapter.outlineBullets)
        ? chapter.outlineBullets.map((item) => String(item))
        : [],
      status: chapter.status,
    })),
  };
}

export default function OutlineEditor({
  projectId,
  initialSummary,
  initialChapters,
  summaryLocked,
}: OutlineEditorProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [chapters, setChapters] = useState(initialChapters);
  const [busy, setBusy] = useState<null | "generate" | "save">(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateChapterTitle(chapterId: string, value: string) {
    setChapters((current) =>
      current.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, title: value } : chapter,
      ),
    );
  }

  function updateBullet(chapterId: string, bulletIndex: number, value: string) {
    setChapters((current) =>
      current.map((chapter) => {
        if (chapter.id !== chapterId) {
          return chapter;
        }

        const bullets = [...chapter.bullets];
        bullets[bulletIndex] = value;
        return { ...chapter, bullets };
      }),
    );
  }

  function addBullet(chapterId: string) {
    setChapters((current) =>
      current.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, bullets: [...chapter.bullets, ""] } : chapter,
      ),
    );
  }

  function removeBullet(chapterId: string, bulletIndex: number) {
    setChapters((current) =>
      current.map((chapter) => {
        if (chapter.id !== chapterId) {
          return chapter;
        }

        const bullets = chapter.bullets.filter((_, index) => index !== bulletIndex);
        return { ...chapter, bullets: bullets.length ? bullets : [""] };
      }),
    );
  }

  async function generateOutline() {
    setBusy("generate");
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/generate-outline`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate the outline.");
      }

      const mapped = mapResponseProject(data.project);
      setSummary(mapped.summary);
      setChapters((current) =>
        mapped.chapters.map((chapter) => {
          const previous = current.find((item) => item.id === chapter.id);
          return {
            ...chapter,
            locked: previous?.locked || false,
          };
        }),
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Could not generate the outline.");
    } finally {
      setBusy(null);
    }
  }

  async function saveOutline() {
    setBusy("save");
    setMessage(null);

    try {
      const payload = {
        summary,
        chapters: chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title.trim(),
          bullets: chapter.bullets.map((bullet) => bullet.trim()).filter(Boolean),
        })),
      };

      const invalidChapter = payload.chapters.find(
        (chapter) => !chapter.title || chapter.bullets.length === 0,
      );

      if (invalidChapter) {
        throw new Error("Each chapter needs a title and at least one bullet.");
      }

      const response = await fetch(`/api/projects/${projectId}/outline`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the outline.");
      }

      const mapped = mapResponseProject(data.project);
      setSummary(mapped.summary);
      setChapters((current) =>
        mapped.chapters.map((chapter) => ({
          ...chapter,
          locked: current.find((item) => item.id === chapter.id)?.locked || false,
        })),
      );
      setMessage("Outline saved.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Could not save the outline.");
    } finally {
      setBusy(null);
    }
  }

  if (!chapters.length) {
    return (
      <div className="paper-panel texture-lines overflow-hidden rounded-[32px] p-8 sm:p-10">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Phase 1
          </p>
          <h2 className="font-serif text-4xl leading-tight text-[var(--foreground)]">
            Generate the blueprint before you write a single chapter.
          </h2>
          <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
            The outline pass creates the back-cover summary, chapter sequence, and bullet
            structure that the rest of the drafting workflow depends on.
          </p>
          <button
            type="button"
            onClick={generateOutline}
            disabled={busy === "generate"}
            className="inline-flex items-center rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "generate" ? "Generating outline..." : "Generate outline"}
          </button>
          {message ? <p className="text-sm text-rose-700">{message}</p> : null}
        </div>
      </div>
    );
  }

  const hasEditableChapter = chapters.some((chapter) => !chapter.locked);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveOutline}
          disabled={busy !== null}
          className="inline-flex items-center rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "save" ? "Saving..." : "Save outline"}
        </button>
        {!summaryLocked ? (
          <button
            type="button"
            onClick={generateOutline}
            disabled={busy !== null}
            className="inline-flex items-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "generate" ? "Regenerating..." : "Regenerate outline"}
          </button>
        ) : null}
        <Link
          href={`/projects/${projectId}/manuscript`}
          className="inline-flex items-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.6)]"
        >
          Open manuscript
        </Link>
        {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      </div>

      <section className="paper-panel rounded-[32px] p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Book summary
            </p>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              {summaryLocked
                ? "Summary is locked after drafting starts so the opening chapters stay grounded."
                : "Refine this before briefing the first chapter."}
            </p>
          </div>
          {!hasEditableChapter ? (
            <StatusPill status="COMPLETE" compact />
          ) : null}
        </div>
        <textarea
          value={summary}
          disabled={summaryLocked}
          onChange={(event) => setSummary(event.target.value)}
          className={cn(
            "min-h-[180px] w-full rounded-[28px] border border-[var(--line)] px-5 py-4 text-sm leading-7 outline-none transition",
            summaryLocked
              ? "cursor-not-allowed bg-[rgba(241,236,229,0.8)] text-[var(--muted)]"
              : "bg-[rgba(255,255,255,0.86)] text-[var(--foreground)] focus:border-[var(--accent)]",
          )}
        />
      </section>

      <div className="grid gap-4">
        {chapters.map((chapter) => (
          <article key={chapter.id} className="paper-panel rounded-[32px] p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Chapter {chapter.chapterNumber}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill status={chapter.status} compact />
                  {chapter.locked ? (
                    <span className="text-xs text-[var(--muted)]">
                      Locked because drafting already started here.
                    </span>
                  ) : null}
                </div>
              </div>
              <Link
                href={`/projects/${projectId}/chapters/${chapter.id}`}
                className="inline-flex items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
              >
                Open chapter
              </Link>
            </div>

            <div className="grid gap-5">
              <input
                value={chapter.title}
                disabled={chapter.locked}
                onChange={(event) => updateChapterTitle(chapter.id, event.target.value)}
                className={cn(
                  "rounded-[24px] border border-[var(--line)] px-5 py-3 text-lg font-semibold outline-none transition",
                  chapter.locked
                    ? "cursor-not-allowed bg-[rgba(241,236,229,0.8)] text-[var(--muted)]"
                    : "bg-[rgba(255,255,255,0.88)] text-[var(--foreground)] focus:border-[var(--accent)]",
                )}
              />

              <div className="grid gap-3">
                {chapter.bullets.map((bullet, bulletIndex) => (
                  <div key={`${chapter.id}-${bulletIndex}`} className="flex gap-3">
                    <input
                      value={bullet}
                      disabled={chapter.locked}
                      onChange={(event) =>
                        updateBullet(chapter.id, bulletIndex, event.target.value)
                      }
                      className={cn(
                        "flex-1 rounded-[22px] border border-[var(--line)] px-4 py-3 text-sm outline-none transition",
                        chapter.locked
                          ? "cursor-not-allowed bg-[rgba(241,236,229,0.8)] text-[var(--muted)]"
                          : "bg-[rgba(255,255,255,0.88)] text-[var(--foreground)] focus:border-[var(--accent)]",
                      )}
                    />
                    {!chapter.locked ? (
                      <button
                        type="button"
                        onClick={() => removeBullet(chapter.id, bulletIndex)}
                        className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.7)]"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {!chapter.locked ? (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => addBullet(chapter.id)}
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.7)]"
                  >
                    Add bullet
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
