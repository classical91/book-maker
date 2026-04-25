"use client";

import { SpeakButton } from "@/components/speak-button";

export function ManuscriptActions({
  projectId,
  fullText,
  status,
}: {
  projectId: string;
  fullText: string;
  status: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {fullText && <SpeakButton text={fullText} />}
      <button
        onClick={() => window.print()}
        className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
      >
        Print / Save PDF
      </button>
      <a
        href={`/api/projects/${projectId}/export/docx`}
        className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
      >
        Export DOCX
      </a>
    </div>
  );
}
