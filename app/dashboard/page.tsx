import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import { DashboardTabs } from "@/components/dashboard-tabs";
import { HomeLogo } from "@/components/home-logo";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { hasClerkConfig } from "@/lib/runtime-config";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const userId = await requireUserIdOrRedirect();
  const authConfigured = hasClerkConfig();

  const [projects, ebooks] = await Promise.all([
    prisma.bookProject.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        genre: true,
        audience: true,
        totalChapters: true,
        status: true,
        updatedAt: true,
        chapters: {
          select: { status: true, wordCount: true },
        },
      },
    }),
    prisma.ebook
      .findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true, content: true },
      })
      .catch(() => [] as { id: string; title: string; updatedAt: Date; content: string | null }[]),
  ]);

  return (
    <main className="paper-grid min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8">

        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <HomeLogo />
            <h1 className="font-serif text-5xl leading-none text-[var(--foreground)]">
              My workspace
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {authConfigured && <UserButton />}
            <Link
              href="/completed"
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              Completed
            </Link>
            <Link
              href="/ebooks/new"
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Write manually
            </Link>
            <Link
              href="/projects/new"
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              Set up with AI
            </Link>
          </div>
        </header>

        <DashboardTabs projects={projects} ebooks={ebooks} />

      </div>
    </main>
  );
}
