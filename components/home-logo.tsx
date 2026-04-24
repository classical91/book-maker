import Link from "next/link";

export function HomeLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-[var(--foreground)] transition hover:opacity-75"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="3" y="2" width="12" height="15" rx="2" fill="currentColor" opacity="0.12" />
        <rect x="5" y="4" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8.5" y1="8.5" x2="14.5" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="8.5" y1="11.5" x2="12.5" y2="11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.28em]">Draftloom</span>
    </Link>
  );
}
