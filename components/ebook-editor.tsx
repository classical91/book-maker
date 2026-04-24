"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteEbookButton } from "@/components/delete-ebook-button";

type Props = {
  id: string;
  initialTitle: string;
  initialContent: string;
};

export function EbookEditor({ id, initialTitle, initialContent }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/ebooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Editing e-book
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {saved && (
              <span className="text-sm font-semibold text-green-700">Saved</span>
            )}
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
            <DeleteEbookButton id={id} />
            <button
              onClick={() => router.push(`/ebooks/${id}`)}
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              View
            </button>
            <button
              onClick={handleSave}
              disabled={busy}
              className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
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
