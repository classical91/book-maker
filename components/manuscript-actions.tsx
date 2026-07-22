"use client";

import { useState } from "react";

import { SpeakButton } from "@/components/speak-button";

const SCOPES = [
  { value: "drafted", label: "Drafted chapters" },
  { value: "completed", label: "Completed only" },
  { value: "all", label: "All + placeholders" },
] as const;

export function ManuscriptActions({
  projectId,
  fullText,
}: {
  projectId: string;
  fullText: string;
}) {
  const [scope, setScope] = useState<(typeof SCOPES)[number]["value"]>("drafted");

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      {fullText && <SpeakButton text={fullText} />}
      <button
        onClick={() => window.print()}
        className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
      >
        Print / Save PDF
      </button>
      <label className="flex items-center gap-2">
        <span className="sr-only">Export scope</span>
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value as typeof scope)}
          className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition hover:border-[var(--foreground)]"
        >
          {SCOPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <a
        href={`/api/projects/${projectId}/export/docx?scope=${scope}`}
        className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
      >
        Export DOCX
      </a>
    </div>
  );
}
