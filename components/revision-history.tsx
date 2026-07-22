"use client";

import { useCallback, useState } from "react";

type RevisionSource = "MANUAL_SAVE" | "AI_GENERATION" | "AI_REGENERATION";

type Revision = {
  id: string;
  title: string;
  source: RevisionSource;
  wordCount?: number | null;
  createdAt: string;
};

const SOURCE_LABELS: Record<RevisionSource, string> = {
  MANUAL_SAVE: "Manual save",
  AI_GENERATION: "AI generation",
  AI_REGENERATION: "AI regeneration",
};

export function RevisionHistory({
  listUrl,
  restoreUrl,
  onRestored,
}: {
  listUrl: string;
  restoreUrl: (revisionId: string) => string;
  onRestored: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(listUrl);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRevisions((data.revisions as Revision[]) ?? []);
    } catch {
      setError("Could not load revision history.");
    } finally {
      setLoading(false);
    }
  }, [listUrl]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void load();
  }

  async function restore(id: string) {
    if (
      !window.confirm(
        "Restore this version? Your current version is saved to history first, so this is reversible.",
      )
    ) {
      return;
    }
    setRestoringId(id);
    setError(null);
    try {
      const res = await fetch(restoreUrl(id), { method: "POST" });
      if (!res.ok) throw new Error();
      await onRestored();
      await load();
    } catch {
      setError("Could not restore this version.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
      >
        {open ? "Hide history" : "History"}
      </button>

      {open && (
        <div className="mt-3 w-full max-w-md rounded-2xl border border-[var(--line)] bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Revision history
          </p>

          {loading && <p className="mt-3 text-sm text-[var(--muted)]">Loading…</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {!loading && revisions && revisions.length === 0 && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              No earlier versions yet. History is captured before edits are overwritten.
            </p>
          )}

          {revisions && revisions.length > 0 && (
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {revisions.map((revision) => (
                <li key={revision.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {revision.title || "Untitled"}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {SOURCE_LABELS[revision.source]}
                      {typeof revision.wordCount === "number"
                        ? ` · ${revision.wordCount} words`
                        : ""}{" "}
                      · {new Date(revision.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(revision.id)}
                    disabled={restoringId !== null}
                    className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                  >
                    {restoringId === revision.id ? "Restoring…" : "Restore"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
