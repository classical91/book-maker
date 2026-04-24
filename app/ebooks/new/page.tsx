"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEbookPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/ebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      router.refresh();
      router.push(`/ebooks/${data.ebook.id}/edit`);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-xl space-y-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            New e-book
          </p>
          <h1 className="font-serif text-4xl leading-tight text-[var(--foreground)]">
            What is your book called?
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title…"
            required
            autoFocus
            className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.85)] px-5 py-4 text-base text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--foreground)]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create & start writing"}
          </button>
        </form>
      </div>
    </main>
  );
}
