"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Chapter = { id: string; title: string; position: number };

type Props = {
  ebookId: string;
  ebookTitle: string;
  chapters: Chapter[];
};

export function EbookChapterSidebar({ ebookId, ebookTitle, chapters }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/ebooks/${ebookId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle || "Untitled Chapter" }),
      });
      const data = await res.json();
      router.refresh();
      router.push(`/ebooks/${ebookId}/chapters/${data.chapter.id}`);
      setAdding(false);
      setNewTitle("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex flex-col border-b border-[var(--line)] bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--line)] px-5 py-4">
        <Link
          href="/ebooks"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← E-books
        </Link>
      </div>

      <div className="shrink-0 border-b border-[var(--line)] px-5 py-3">
        <Link
          href={`/ebooks/${ebookId}`}
          className="block truncate font-serif text-lg leading-tight text-[var(--foreground)] transition hover:text-[var(--accent)]"
        >
          {ebookTitle}
        </Link>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Overview link */}
        <Link
          href={`/ebooks/${ebookId}`}
          className={cn(
            "block border-b border-[var(--line)] px-5 py-3 text-sm font-semibold transition",
            pathname === `/ebooks/${ebookId}`
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:bg-[rgba(0,0,0,0.02)] hover:text-[var(--foreground)]",
          )}
        >
          Overview
        </Link>

        {/* Chapter list */}
        <div className="divide-y divide-[var(--line)]">
          {chapters.map((ch, i) => {
            const href = `/ebooks/${ebookId}/chapters/${ch.id}`;
            const active = pathname === href;
            return (
              <Link
                key={ch.id}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 transition",
                  active
                    ? "border-l-2 border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "hover:bg-[rgba(0,0,0,0.02)]",
                )}
              >
                <span className={cn("shrink-0 text-xs tabular-nums", active ? "text-[var(--accent)]" : "text-[var(--muted)]")}>
                  {i + 1}
                </span>
                <span className={cn("truncate text-sm font-semibold", active ? "text-[var(--accent)]" : "text-[var(--foreground)]")}>
                  {ch.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Add chapter */}
      <div className="shrink-0 border-t border-[var(--line)] p-4">
        {adding ? (
          <form onSubmit={handleAdd} className="space-y-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Chapter title…"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl bg-[var(--foreground)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent)] disabled:opacity-50"
              >
                {busy ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewTitle(""); }}
                className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + Add chapter
          </button>
        )}
      </div>
    </aside>
  );
}
