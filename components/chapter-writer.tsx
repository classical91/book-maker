"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { StatusPill } from "@/components/status-pill";
import type { ChapterBrief } from "@/lib/schemas";
import { countWords } from "@/lib/utils";

type ChapterWriterProps = {
  projectId: string;
  chapterId: string;
  chapterNumber: number;
  initialTitle: string;
  bullets: string[];
  initialBrief: ChapterBrief | null;
  initialContent: string;
  initialSummary: string;
  initialStatus: string;
  previousChapterId?: string;
  nextChapterId?: string;
};

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The request failed.");
  }

  return data;
}

export default function ChapterWriter({
  projectId,
  chapterId,
  chapterNumber,
  initialTitle,
  bullets,
  initialBrief,
  initialContent,
  initialSummary,
  initialStatus,
  previousChapterId,
  nextChapterId,
}: ChapterWriterProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [brief, setBrief] = useState<ChapterBrief | null>(initialBrief);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<null | "brief" | "draft" | "save">(null);
  const [message, setMessage] = useState<string | null>(null);

  const wordCount = countWords(content);
  const hasDraft = Boolean(content.trim());

  async function generateBrief() {
    setBusy("brief");
    setMessage(null);

    try {
      const data = await requestJson(
        `/api/projects/${projectId}/chapters/${chapterId}/generate-brief`,
        { method: "POST" },
      );
      const nextBrief = data.chapter?.brief as ChapterBrief | undefined;

      if (nextBrief) {
        setBrief(nextBrief);
      }

      if (data.chapter?.status) {
        setStatus(data.chapter.status);
      }

      setMessage("Chapter brief ready.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Could not generate the chapter brief.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function generateDraft() {
    setBusy("draft");
    setMessage(null);

    try {
      const data = await requestJson(
        `/api/projects/${projectId}/chapters/${chapterId}/generate-draft`,
        { method: "POST" },
      );

      if (data.chapter?.content) {
        setContent(data.chapter.content);
      }

      if (data.chapter?.summary) {
        setSummary(data.chapter.summary);
      }

      if (data.chapter?.status) {
        setStatus(data.chapter.status);
      }

      setMessage("Chapter draft generated.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Could not generate the chapter draft.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function saveChapter(nextStatus?: string, redirectToNext = false) {
    setBusy("save");
    setMessage(null);

    try {
      const data = await requestJson(`/api/projects/${projectId}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          summary,
          status: nextStatus || status,
        }),
      });

      if (data.chapter?.status) {
        setStatus(data.chapter.status);
      }

      setMessage("Chapter saved.");
      router.refresh();

      if (redirectToNext && nextChapterId) {
        router.push(`/projects/${projectId}/chapters/${nextChapterId}`);
      }
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Could not save the chapter.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="paper-panel h-fit rounded-[32px] p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Chapter {chapterNumber}
              </p>
              <div className="mt-2">
                <StatusPill status={status} />
              </div>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">
              <p>{wordCount} words</p>
              {message ? <p className="mt-1 max-w-[12rem] text-[var(--foreground)]">{message}</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-2xl leading-tight text-[var(--foreground)]">
              Outline
            </h2>
            <ul className="grid gap-2 text-sm leading-6 text-[var(--muted)]">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 border-t border-[var(--line)] pt-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateBrief}
                disabled={busy !== null}
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "brief" ? "Working..." : brief ? "Regenerate brief" : "Generate brief"}
              </button>
              <button
                type="button"
                onClick={generateDraft}
                disabled={busy !== null || !brief}
                className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "draft" ? "Drafting..." : hasDraft ? "Regenerate draft" : "Generate draft"}
              </button>
            </div>

            {brief ? (
              <div className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Brief
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {brief.brief}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Sections
                  </p>
                  <ol className="mt-2 grid gap-2 text-sm leading-6 text-[var(--muted)]">
                    {brief.sections.map((section) => (
                      <li key={section}>{section}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Takeaways
                  </p>
                  <ul className="mt-2 grid gap-2 text-sm leading-6 text-[var(--muted)]">
                    {brief.takeaways.map((takeaway) => (
                      <li key={takeaway}>{takeaway}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Transition
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {brief.transitionNote}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[var(--line)] px-5 py-6 text-sm leading-6 text-[var(--muted)]">
                Generate the chapter brief first. The draft route stays locked until the brief exists.
              </div>
            )}

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => saveChapter()}
                disabled={busy !== null}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "save" ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                onClick={() => saveChapter("REVIEWED")}
                disabled={busy !== null || !hasDraft}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark reviewed
              </button>
              <button
                type="button"
                onClick={() => saveChapter("COMPLETE")}
                disabled={busy !== null || !hasDraft}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark complete
              </button>
              {nextChapterId ? (
                <button
                  type="button"
                  onClick={() => saveChapter("COMPLETE", true)}
                  disabled={busy !== null || !hasDraft}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Complete and continue
                </button>
              ) : null}
            </div>

            <div className="flex gap-3 pt-2">
              {previousChapterId ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/projects/${projectId}/chapters/${previousChapterId}`)
                  }
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.7)]"
                >
                  Previous
                </button>
              ) : null}
              {nextChapterId ? (
                <button
                  type="button"
                  onClick={() => router.push(`/projects/${projectId}/chapters/${nextChapterId}`)}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.7)]"
                >
                  Next
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </aside>

      <section className="paper-panel rounded-[32px] p-6 sm:p-8">
        <div className="grid gap-5">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-[26px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] px-5 py-4 font-serif text-3xl leading-tight text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Chapter summary
            </span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="min-h-[140px] rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.9)] px-4 py-3 text-sm leading-7 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="Capture what this chapter accomplishes."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Chapter draft
            </span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[680px] rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.96)] px-5 py-4 font-serif text-[18px] leading-8 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="Your chapter draft will appear here."
            />
          </label>
        </div>
      </section>
    </div>
  );
}
