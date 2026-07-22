"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { DeleteEbookButton } from "@/components/delete-ebook-button";
import { RevisionHistory } from "@/components/revision-history";
import { SAVE_STATE_LABELS, useAutosave, type SaveResult } from "@/components/use-autosave";

type Props = {
  id: string;
  initialTitle: string;
  initialContent: string;
  initialUpdatedAt: string;
};

const SAVE_STATE_STYLES: Record<string, string> = {
  saved: "text-green-700",
  unsaved: "text-[var(--muted)]",
  saving: "text-[var(--muted)]",
  error: "text-red-600",
  conflict: "text-red-600",
};

export function EbookEditor({ id, initialTitle, initialContent, initialUpdatedAt }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const updatedAtRef = useRef(initialUpdatedAt);

  const serialized = useMemo(() => JSON.stringify({ title, content }), [title, content]);

  const save = useCallback(async (): Promise<SaveResult> => {
    const res = await fetch(`/api/ebooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, expectedUpdatedAt: updatedAtRef.current }),
    });
    if (res.status === 409) return "conflict";
    if (!res.ok) return "error";
    const data = await res.json();
    if (data.ebook?.updatedAt) updatedAtRef.current = data.ebook.updatedAt;
    router.refresh();
    return "ok";
  }, [id, title, content, router]);

  const { state, saveNow, markSaved } = useAutosave({
    serialized,
    save,
    enabled: true,
  });

  const reloadFromServer = useCallback(async () => {
    const res = await fetch(`/api/ebooks/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    const nextTitle = data.ebook?.title ?? "";
    const nextContent = data.ebook?.content ?? "";
    setTitle(nextTitle);
    setContent(nextContent);
    if (data.ebook?.updatedAt) updatedAtRef.current = data.ebook.updatedAt;
    markSaved(JSON.stringify({ title: nextTitle, content: nextContent }));
    router.refresh();
  }, [id, markSaved, router]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Editing e-book
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`text-sm font-semibold ${SAVE_STATE_STYLES[state] ?? "text-[var(--muted)]"}`}
            >
              {SAVE_STATE_LABELS[state]}
            </span>
            {state === "conflict" && (
              <button
                onClick={reloadFromServer}
                className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Reload latest
              </button>
            )}
            <RevisionHistory
              listUrl={`/api/ebooks/${id}/revisions`}
              restoreUrl={(revisionId) => `/api/ebooks/${id}/revisions/${revisionId}/restore`}
              onRestored={reloadFromServer}
            />
            <DeleteEbookButton id={id} />
            <a
              href={`/api/ebooks/${id}/export/docx`}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              Export DOCX
            </a>
            <button
              onClick={() => router.push(`/ebooks/${id}`)}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              View
            </button>
            <button
              onClick={() => void saveNow()}
              disabled={state === "saving"}
              className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {state === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </header>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book title…"
          className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.8)] px-5 py-4 font-serif text-2xl text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--foreground)]"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your e-book here…"
          className="min-h-[65vh] w-full resize-none rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.8)] px-6 py-5 font-serif text-[17px] leading-8 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--foreground)]"
        />
      </div>
    </main>
  );
}
