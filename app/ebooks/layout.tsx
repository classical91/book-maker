import type { ReactNode } from "react";
import Link from "next/link";

import { EbookList } from "@/components/ebook-list";
import { HomeLogo } from "@/components/home-logo";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My E-books" };

// Per-user data; never statically prerender.
export const dynamic = "force-dynamic";

export default async function EbooksLayout({ children }: { children: ReactNode }) {
  const userId = await requireUserIdOrRedirect();

  const ebooks = await prisma.ebook.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">

      {/* Left panel */}
      <aside className="flex flex-col border-b border-[var(--line)] bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">

        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <HomeLogo />
          <Link
            href="/ebooks/new"
            className="rounded-full bg-[var(--foreground)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent)]"
          >
            + New
          </Link>
        </div>

        <div className="shrink-0 border-b border-[var(--line)] px-5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            My E-books ({ebooks.length})
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <EbookList ebooks={ebooks} />
        </div>

        <div className="shrink-0 border-t border-[var(--line)] px-5 py-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            ← Dashboard
          </Link>
        </div>

      </aside>

      {/* Right panel */}
      <div className="min-w-0">{children}</div>

    </div>
  );
}
