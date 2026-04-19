import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="paper-panel max-w-xl rounded-[36px] p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          Not found
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-[var(--foreground)]">
          This book workspace could not be found.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          The project may have been deleted, or the URL does not belong to your account.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
