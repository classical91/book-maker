import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { HomeLogo } from "@/components/home-logo";
import { getOptionalUserId } from "@/lib/auth";
import { CLERK_SETUP_MESSAGE, hasClerkConfig } from "@/lib/runtime-config";

export default async function Home() {
  const authConfigured = hasClerkConfig();
  const userId = await getOptionalUserId();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <HomeLogo />
        <div className="flex items-center gap-3">
          {authConfigured && userId ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.6)]"
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : authConfigured ? (
            <>
              <Link
                href="/sign-in"
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.6)]"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
              >
                Start a book
              </Link>
            </>
          ) : (
            <span className="rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
              Auth setup required
            </span>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-y border-[var(--line)] bg-[rgba(251,246,238,0.66)]">
          <div className="hero-glow absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[rgba(161,74,43,0.14)] blur-3xl" />
          <div className="hero-glow hero-glow--delay absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[rgba(217,194,174,0.4)] blur-3xl" />

          <div className="mx-auto grid min-h-[calc(100svh-6rem)] w-full max-w-7xl items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-18">
            <div className="max-w-2xl space-y-7">
              <p className="fade-rise text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Blueprint first. Draft second.
              </p>
              <h1 className="fade-rise fade-rise-delay font-serif text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
                Build a real book with approvals, briefs, and chapter-by-chapter control.
              </h1>
              <p className="fade-rise fade-rise-slow max-w-xl text-lg leading-8 text-[var(--muted)]">
                Draftloom turns a working idea into an editable outline, then guides each
                chapter through a brief, a draft, and a clean manuscript assembly flow
                instead of pretending one prompt should write the whole book.
              </p>

              {!authConfigured ? (
                <div className="fade-rise fade-rise-slow rounded-[28px] border border-amber-300 bg-amber-100/90 px-5 py-4 text-sm leading-7 text-amber-950">
                  {CLERK_SETUP_MESSAGE}
                </div>
              ) : null}

              <div className="fade-rise fade-rise-slow flex flex-wrap items-center gap-4">
                <Link
                  href={
                    authConfigured ? (userId ? "/projects/new" : "/sign-up") : "#workflow"
                  }
                  className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
                  prefetch={false}
                >
                  {authConfigured
                    ? userId
                      ? "Create a project"
                      : "Start drafting"
                    : "Explore the workflow"}
                </Link>
                <Link
                  href={authConfigured ? (userId ? "/dashboard" : "/sign-in") : "#v1"}
                  className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
                  prefetch={false}
                >
                  {authConfigured
                    ? userId
                      ? "Open dashboard"
                      : "I already have an account"
                    : "See what ships"}
                </Link>
              </div>

              <div className="grid max-w-xl gap-4 border-t border-[var(--line)] pt-6 sm:grid-cols-3">
                {[
                  ["1", "Project setup", "Title, audience, tone, premise, word target, chapter count."],
                  ["2", "Outline approval", "Generated chapter map with bullets you can edit before writing."],
                  ["3", "Guided drafting", "Brief first, then a full chapter draft, then manuscript export."],
                ].map(([index, label, description]) => (
                  <div key={label} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                      {index}
                    </p>
                    <h2 className="text-base font-semibold text-[var(--foreground)]">{label}</h2>
                    <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[28rem]">
              <div className="absolute left-8 top-2 hidden h-[18rem] w-[12rem] rounded-[28px] border border-[rgba(255,255,255,0.6)] bg-[rgba(251,246,238,0.44)] shadow-[0_30px_80px_rgba(38,23,16,0.08)] blur-[1px] lg:block" />
              <div className="absolute right-6 top-10 hidden h-[15rem] w-[10rem] rounded-[28px] border border-[rgba(255,255,255,0.6)] bg-[rgba(216,194,174,0.42)] shadow-[0_30px_80px_rgba(38,23,16,0.08)] lg:block" />

              <div className="paper-panel texture-lines relative ml-auto max-w-[34rem] rounded-[36px] p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                      Working manuscript
                    </p>
                    <p className="mt-2 font-serif text-3xl text-[var(--foreground)]">
                      The Field Guide to Better Decisions
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                    Outline ready
                  </span>
                </div>

                <div className="grid gap-5 py-6">
                  <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Chapter 2 brief
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                      Clarify why teams choose speed over quality, define the hidden cost of
                      reactive decisions, and set up a usable decision filter before the
                      chapter draft begins.
                    </p>
                  </div>

                  <div className="rounded-[32px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_24px_60px_rgba(38,23,16,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          Chapter 2
                        </p>
                        <h2 className="mt-2 font-serif text-2xl text-[var(--foreground)]">
                          The Cost of Hurry
                        </h2>
                      </div>
                      <span className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-800">
                        Drafted
                      </span>
                    </div>
                    <div className="space-y-4 text-sm leading-7 text-[var(--muted)]">
                      <p>
                        Most bad decisions do not begin with bad intent. They begin with
                        compressed time, social pressure, and the illusion that speed is the
                        same thing as clarity.
                      </p>
                      <p>
                        When a team is rushed, it reaches for the nearest answer, not the best
                        one. That reflex feels productive in the moment, but it leaves a trail
                        of rework that compounds into distrust.
                      </p>
                      <p className="text-[var(--foreground)]">
                        The chapter workspace keeps that argument editable instead of locking
                        it into a one-shot generation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Why the workflow holds up
            </p>
            <h2 className="font-serif text-4xl leading-tight text-[var(--foreground)]">
              You are not buying a one-click miracle. You are buying control at every stage.
            </h2>
          </div>
          <div className="grid gap-8 text-[15px] leading-7 text-[var(--muted)] sm:grid-cols-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Outline before prose
              </h3>
              <p className="mt-3">
                The chapter map is editable before drafting starts, so the structure is set by
                intent instead of whatever the model improvised first.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Brief before chapter
              </h3>
              <p className="mt-3">
                Each chapter gets a focused brief with subsections, takeaways, and transition
                notes, which keeps the full draft tighter and more coherent.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Manuscript stays editable
              </h3>
              <p className="mt-3">
                Every chapter remains a plain-text working surface, and the manuscript view
                compiles the latest draft without trapping you inside a black box.
              </p>
            </div>
          </div>
        </section>

        <section id="v1" className="border-y border-[var(--line)] bg-[rgba(33,23,17,0.94)]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-18 text-[rgba(248,240,233,0.78)] sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(248,240,233,0.58)]">
                What ships in v1
              </p>
              <h2 className="font-serif text-4xl leading-tight text-white">
                A serious drafting workspace with enough structure to feel reliable.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                "Authenticated dashboard for saved book projects",
                "AI outline generation with editable chapter bullets",
                "Brief-first drafting flow for every chapter",
                "Sequential chapter guardrails to protect continuity",
                "Full manuscript assembly in reading order",
                "DOCX export for the current manuscript",
              ].map((item) => (
                <div
                  key={item}
                  className="border-t border-[rgba(248,240,233,0.12)] pt-4 text-sm leading-7"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="paper-panel overflow-hidden rounded-[40px] px-6 py-10 sm:px-10 sm:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Final CTA
                </p>
                <h2 className="font-serif text-4xl leading-tight text-[var(--foreground)]">
                  Start with the idea, approve the structure, and keep writing inside a workspace that remembers the book.
                </h2>
                <p className="text-base leading-7 text-[var(--muted)]">
                  The workflow is small on purpose: setup, outline, brief, chapter, manuscript,
                  export. Nothing extra until the core drafting loop feels solid.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={
                    authConfigured ? (userId ? "/projects/new" : "/sign-up") : "#workflow"
                  }
                  className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
                  prefetch={false}
                >
                  {authConfigured
                    ? userId
                      ? "Create your next book"
                      : "Create your first book"
                    : "Review the drafting flow"}
                </Link>
                <Link
                  href={authConfigured ? (userId ? "/dashboard" : "/sign-in") : "#v1"}
                  className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.7)]"
                  prefetch={false}
                >
                  {authConfigured ? (userId ? "Return to dashboard" : "Sign in") : "View the MVP"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
