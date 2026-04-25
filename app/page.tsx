import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { HomeLogo } from "@/components/home-logo";
import { getOptionalUserId } from "@/lib/auth";
import { CLERK_SETUP_MESSAGE, hasClerkConfig } from "@/lib/runtime-config";

export default async function Home() {
  const authConfigured = hasClerkConfig();
  const userId = await getOptionalUserId();

  const aiHref = authConfigured ? (userId ? "/projects/new" : "/sign-up") : "#features";
  const manualHref = authConfigured ? "/ebooks" : "#features";
  const dashHref = authConfigured ? (userId ? "/dashboard" : "/sign-in") : "#features";

  return (
    <div className="min-h-screen">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(245,245,242,0.9)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <HomeLogo />
          <nav className="flex items-center gap-2">
            {authConfigured && userId ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : authConfigured ? (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                >
                  Get started
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid max-w-6xl min-h-[calc(100svh-65px)] items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">

            <div className="space-y-8">
              <div className="fade-rise inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                AI drafting · Manual writing · Export
              </div>

              <h1 className="fade-rise fade-rise-delay font-serif text-6xl leading-[0.92] text-[var(--foreground)] sm:text-7xl lg:text-[5.5rem]">
                Your book,<br />your workflow
              </h1>

              <p className="fade-rise fade-rise-slow max-w-lg text-lg leading-8 text-[var(--muted)]">
                Set up with AI and get an outline, chapter briefs, and full drafts. Or open a blank page and write it yourself. Both paths end in a polished manuscript you can export.
              </p>

              {!authConfigured && (
                <div className="fade-rise fade-rise-slow rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
                  {CLERK_SETUP_MESSAGE}
                </div>
              )}

              <div className="fade-rise fade-rise-slow flex flex-wrap gap-3">
                <Link
                  href={aiHref}
                  className="rounded-full bg-[var(--foreground)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                >
                  Set up with AI
                </Link>
                <Link
                  href={manualHref}
                  className="rounded-full border border-[var(--line)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Write manually
                </Link>
                {authConfigured && userId && (
                  <Link
                    href="/dashboard"
                    className="px-6 py-3.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
                  >
                    Open dashboard →
                  </Link>
                )}
              </div>
            </div>

            {/* Mock draft room preview */}
            <div className="hidden lg:block">
              <div className="paper-panel overflow-hidden rounded-[28px]">
                <div className="flex h-[420px]">
                  {/* Sidebar strip */}
                  <div className="flex w-[156px] shrink-0 flex-col gap-3 border-r border-[var(--line)] p-4">
                    <div className="mb-1 flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm bg-[var(--accent)] opacity-70" />
                      <div className="h-2 w-16 rounded-full bg-[var(--line)]" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-24 rounded-full bg-[var(--line)] opacity-60" />
                      <div className="h-4 w-28 rounded-lg bg-[rgba(0,0,0,0.07)]" />
                    </div>
                    <div className="rounded-xl border border-[var(--line)] p-2.5 space-y-2">
                      <div className="h-1.5 w-full rounded-full bg-[var(--accent)] opacity-20" />
                      <div className="h-1 w-3/4 rounded-full bg-[var(--line)]" />
                    </div>
                    <div className="h-8 rounded-xl bg-[var(--foreground)] opacity-90" />
                    <div className="h-8 rounded-xl border border-[var(--line)]" />
                    <div className="mt-auto space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-9 rounded-xl border border-[var(--line)] px-2.5 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--line)]" />
                          <div className="h-1.5 flex-1 rounded-full bg-[var(--line)]" />
                          <div className="h-3 w-8 rounded-full bg-[var(--accent)] opacity-15" />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 space-y-5 p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-[var(--line)] opacity-60" />
                        <div className="h-6 w-48 rounded-lg bg-[rgba(0,0,0,0.08)]" />
                      </div>
                      <div className="h-7 w-24 rounded-full bg-[var(--accent)] opacity-15" />
                    </div>
                    <div className="rounded-2xl border border-[var(--line)] bg-[rgba(79,70,229,0.04)] p-4 space-y-2.5">
                      <div className="h-1.5 w-20 rounded-full bg-[var(--accent)] opacity-30" />
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-[var(--line)]" />
                        <div className="h-1.5 w-5/6 rounded-full bg-[var(--line)]" />
                        <div className="h-1.5 w-4/5 rounded-full bg-[var(--line)]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[100, 85, 92, 74, 88, 80, 60].map((w, i) => (
                        <div key={i} className="h-2 rounded-full bg-[var(--line)]" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <div className="h-9 flex-1 rounded-xl bg-[var(--foreground)] opacity-90" />
                      <div className="h-9 w-28 rounded-xl border border-[var(--line)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Two paths ────────────────────────────────────────── */}
        <section id="features" className="border-b border-[var(--line)] bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="mb-12 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Two ways to write
              </p>
              <h2 className="font-serif text-4xl text-[var(--foreground)]">
                Pick your path, keep your control
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  badge: "AI",
                  badgeStyle: "bg-[var(--accent-soft)] text-[var(--accent)]",
                  title: "AI-guided drafting",
                  desc: "Generate an outline, approve it, get chapter briefs, then full chapter drafts — one step at a time with full editorial control.",
                  href: aiHref,
                  cta: "Start with AI",
                },
                {
                  badge: "Manual",
                  badgeStyle: "bg-[rgba(0,0,0,0.05)] text-[var(--foreground)]",
                  title: "Free-form e-book writing",
                  desc: "Open a blank workspace and write your own e-book from scratch. Save as you go, read it back, listen to it, or export at any time.",
                  href: manualHref,
                  cta: "Write manually",
                },
                {
                  badge: "Export",
                  badgeStyle: "bg-emerald-50 text-emerald-700",
                  title: "Export & listen",
                  desc: "Download your manuscript as DOCX, save as PDF, or hit Listen to have your writing read aloud with a modern text-to-speech voice.",
                  href: dashHref,
                  cta: "See your workspace",
                },
              ].map((f) => (
                <div key={f.title} className="paper-panel flex flex-col rounded-2xl p-6 gap-4">
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${f.badgeStyle}`}>
                    {f.badge}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{f.title}</h3>
                  <p className="flex-1 text-sm leading-7 text-[var(--muted)]">{f.desc}</p>
                  <Link
                    href={f.href}
                    className="text-sm font-semibold text-[var(--accent)] transition hover:underline"
                  >
                    {f.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <p className="mb-12 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              How the AI path works
            </p>
            <div className="grid gap-10 sm:grid-cols-4">
              {[
                ["1", "Set up", "Enter your title, audience, tone, word target, and chapter count."],
                ["2", "Approve outline", "Edit the AI-generated chapter map before any writing starts."],
                ["3", "Draft each chapter", "Brief first, then a full chapter draft you can revise freely."],
                ["4", "Export", "Assemble the full manuscript and export to DOCX or print to PDF."],
              ].map(([num, title, desc]) => (
                <div key={num} className="space-y-3">
                  <p className="font-serif text-5xl text-[var(--accent)] opacity-25">{num}</p>
                  <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="bg-[var(--foreground)]">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl space-y-4">
                <h2 className="font-serif text-5xl leading-tight text-white">
                  Start writing today.<br />No blank-page panic.
                </h2>
                <p className="text-base leading-7 text-[rgba(255,255,255,0.55)]">
                  AI or manual — both paths give you a real draft in a workspace that saves everything and exports cleanly.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={aiHref}
                  className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--accent)] hover:text-white"
                >
                  Set up with AI
                </Link>
                <Link
                  href={manualHref}
                  className="rounded-full border border-[rgba(255,255,255,0.2)] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white"
                >
                  Write manually
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
