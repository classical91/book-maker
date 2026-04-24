import Link from "next/link";

export default function EbooksPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-8 py-16">
      <div className="max-w-md space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          E-book workspace
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[var(--foreground)]">
          Select an e-book or start a new one
        </h1>
        <p className="text-base leading-7 text-[var(--muted)]">
          Your e-books appear on the left. Click one to read or continue editing.
        </p>
        <Link
          href="/ebooks/new"
          className="inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
        >
          Create your first e-book
        </Link>
      </div>
    </main>
  );
}
