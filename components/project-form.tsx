"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FormState = {
  title: string;
  genre: string;
  audience: string;
  tone: string;
  premise: string;
  targetWords: number;
  totalChapters: number;
};

const defaultForm: FormState = {
  title: "",
  genre: "Business / leadership",
  audience: "Ambitious professionals who want a practical playbook",
  tone: "Clear, grounded, and persuasive",
  premise: "",
  targetWords: 18000,
  totalChapters: 8,
};

export default function ProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || "Could not create the project.");
      }

      const projectId = createData.project.id as string;
      const outlineResponse = await fetch(`/api/projects/${projectId}/generate-outline`, {
        method: "POST",
      });

      if (!outlineResponse.ok) {
        router.push(`/projects/${projectId}/outline`);
        return;
      }

      router.push(`/projects/${projectId}/outline`);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Could not create the project.");
      setBusy(false);
    }
  }

  const fields = [
    {
      id: "title",
      label: "Book title",
      type: "text",
      value: form.title,
      onChange: (value: string) => update("title", value),
      placeholder: "The Field Guide to Better Decisions",
    },
    {
      id: "genre",
      label: "Genre",
      type: "text",
      value: form.genre,
      onChange: (value: string) => update("genre", value),
      placeholder: "Business / leadership",
    },
    {
      id: "audience",
      label: "Audience",
      type: "text",
      value: form.audience,
      onChange: (value: string) => update("audience", value),
      placeholder: "Founders, managers, operators...",
    },
    {
      id: "tone",
      label: "Tone",
      type: "text",
      value: form.tone,
      onChange: (value: string) => update("tone", value),
      placeholder: "Direct, practical, warm",
    },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.id} className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {field.label}
            </span>
            <input
              required
              type={field.type}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={field.placeholder}
              className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.86)] px-4 py-3 text-sm text-[var(--foreground)] outline-none ring-0 transition focus:border-[var(--accent)]"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Target words
          </span>
          <input
            required
            type="number"
            min={3000}
            max={150000}
            value={form.targetWords}
            onChange={(event) => update("targetWords", Number(event.target.value))}
            className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.86)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Chapter count
          </span>
          <input
            required
            type="number"
            min={3}
            max={20}
            value={form.totalChapters}
            onChange={(event) => update("totalChapters", Number(event.target.value))}
            className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.86)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Core premise
        </span>
        <textarea
          required
          value={form.premise}
          onChange={(event) => update("premise", event.target.value)}
          placeholder="Summarize the thesis, promise, and major reader transformation."
          className="min-h-[220px] rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.86)] px-5 py-4 text-sm leading-7 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Building outline..." : "Create project and generate outline"}
        </button>
        <p className="text-sm text-[var(--muted)]">
          The first pass generates the full chapter blueprint automatically.
        </p>
      </div>

      {message ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {message}
        </p>
      ) : null}
    </form>
  );
}
