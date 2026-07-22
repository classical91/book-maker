"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { RevisionHistory } from "@/components/revision-history";
import { StatusPill } from "@/components/status-pill";
import { SAVE_STATE_LABELS, useAutosave, type SaveResult } from "@/components/use-autosave";
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
  initialUpdatedAt: string;
  previousChapterId?: string;
  nextChapterId?: string;
};

const SAVE_STATE_STYLES: Record<string, string> = {
  saved: "text-green-700",
  unsaved: "text-[var(--muted)]",
  saving: "text-[var(--muted)]",
  error: "text-red-600",
  conflict: "text-red-600",
};

async function readError(response: Response) {
  const data = await response.json().catch(() => ({}));
  return data?.error?.message as string | undefined;
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
  initialUpdatedAt,
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

  const updatedAtRef = useRef(initialUpdatedAt);

  const wordCount = countWords(content);
  const hasDraft = Boolean(content.trim());

  const serialized = useMemo(
    () => JSON.stringify({ title, content, summary }),
    [title, content, summary],
  );

  const patchChapter = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, expectedUpdatedAt: updatedAtRef.current }),
      });
      if (res.status === 409) return { result: "conflict" as SaveResult };
      if (!res.ok) return { result: "error" as SaveResult, error: await readError(res) };
      const data = await res.json();
      if (data.chapter?.updatedAt) updatedAtRef.current = data.chapter.updatedAt;
      return { result: "ok" as SaveResult, chapter: data.chapter };
    },
    [projectId, chapterId],
  );

  const save = useCallback(async (): Promise<SaveResult> => {
    const { result } = await patchChapter({ title, content, summary, status });
    if (result === "ok") router.refresh();
    return result;
  }, [patchChapter, title, content, summary, status, router]);

  const { state, saveNow, markSaved } = useAutosave({ serialized, save });

  const reloadFromServer = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`);
    if (!res.ok) return;
    const data = await res.json();
    const c = data.chapter;
    if (!c) return;
    setTitle(c.title ?? "");
    setContent(c.content ?? "");
    setSummary(c.summary ?? "");
    setStatus(c.status);
    if (c.updatedAt) updatedAtRef.current = c.updatedAt;
    markSaved(JSON.stringify({ title: c.title ?? "", content: c.content ?? "", summary: c.summary ?? "" }));
    router.refresh();
  }, [projectId, chapterId, markSaved, router]);

  async function generateBrief() {
    setBusy("brief");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/chapters/${chapterId}/generate-brief`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error((await readError(res)) || "Could not generate the chapter brief.");
      const data = await res.json();
      if (data.chapter?.brief) setBrief(data.chapter.brief as ChapterBrief);
      if (data.chapter?.status) setStatus(data.chapter.status);
      if (data.chapter?.updatedAt) updatedAtRef.current = data.chapter.updatedAt;
      setMessage("Chapter brief ready.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Could not generate the chapter brief.");
    } finally {
      setBusy(null);
    }
  }

  async function generateDraft() {
    setBusy("draft");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/chapters/${chapterId}/generate-draft`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error((await readError(res)) || "Could not generate the chapter draft.");
      const data = await res.json();
      const nextContent = data.chapter?.content ?? content;
      const nextSummary = data.chapter?.summary ?? summary;
      setContent(nextContent);
      setSummary(nextSummary);
      if (data.chapter?.status) setStatus(data.chapter.status);
      if (data.chapter?.updatedAt) updatedAtRef.current = data.chapter.updatedAt;
      // The generated draft is already persisted server-side.
      markSaved(JSON.stringify({ title, content: nextContent, summary: nextSummary }));
      setMessage("Chapter draft generated. Your previous version is saved in history.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Could not generate the chapter draft.");
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(nextStatus: string, redirectToNext = false) {
    setBusy("save");
    setMessage(null);
    const { result, chapter, error } = await patchChapter({
      title,
      content,
      summary,
      status: nextStatus,
    });
    if (result === "ok") {
      if (chapter?.status) setStatus(chapter.status);
      markSaved(JSON.stringify({ title, content, summary }));
      setMessage("Chapter saved.");
      router.refresh();
      if (redirectToNext && nextChapterId) {
        router.push(`/projects/${projectId}/chapters/${nextChapterId}`);
      }
    } else if (result === "conflict") {
      setMessage("This chapter changed elsewhere. Reload latest to continue.");
    } else {
      setMessage(error || "Could not save the chapter.");
    }
    setBusy(null);
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
              <p className={`mt-1 font-semibold ${SAVE_STATE_STYLES[state] ?? "text-[var(--muted)]"}`}>
                {SAVE_STATE_LABELS[state]}
              </p>
              {message ? <p className="mt-1 max-w-[12rem] text-[var(--foreground)]">{message}</p> : null}
            </div>
          </div>

          {state === "conflict" && (
            <button
              type="button"
              onClick={() => void reloadFromServer()}
              className="w-full rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Reload latest
            </button>
          )}

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
                onClick={() => void saveNow()}
                disabled={busy !== null || state === "saving"}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "saving" ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                onClick={() => changeStatus("REVIEWED")}
                disabled={busy !== null || !hasDraft}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark reviewed
              </button>
              <button
                type="button"
                onClick={() => changeStatus("COMPLETE")}
                disabled={busy !== null || !hasDraft}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark complete
              </button>
              {nextChapterId ? (
                <button
                  type="button"
                  onClick={() => changeStatus("COMPLETE", true)}
                  disabled={busy !== null || !hasDraft}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Complete and continue
                </button>
              ) : null}
            </div>

            <RevisionHistory
              listUrl={`/api/projects/${projectId}/chapters/${chapterId}/revisions`}
              restoreUrl={(revisionId) =>
                `/api/projects/${projectId}/chapters/${chapterId}/revisions/${revisionId}/restore`
              }
              onRestored={reloadFromServer}
            />

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
