import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import ProjectForm from "@/components/project-form";
import { requireUserIdOrRedirect } from "@/lib/auth";

export const metadata = {
  title: "New Project",
};

export default async function NewProjectPage() {
  await requireUserIdOrRedirect();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]"
            >
              Back to dashboard
            </Link>
            <div>
              <h1 className="font-serif text-5xl leading-none text-[var(--foreground)]">
                Set up the book
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Give the project enough context to produce a strong outline. The workflow is
                nonfiction-first, so clarity here matters more than clever prompting later.
              </p>
            </div>
          </div>
          <UserButton />
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="paper-panel texture-lines rounded-[36px] p-8">
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Workflow
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight text-[var(--foreground)]">
                  Build the structure before you ask for prose.
                </h2>
              </div>

              <div className="grid gap-6 text-sm leading-7 text-[var(--muted)]">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    1. Generate the blueprint
                  </h3>
                  <p className="mt-2">
                    The first request returns a summary plus a chapter-by-chapter bullet map
                    sized to your target length and chapter count.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    2. Edit the outline
                  </h3>
                  <p className="mt-2">
                    Clean up titles, remove generic sections, and sharpen the sequence before
                    the first chapter is drafted.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    3. Brief each chapter
                  </h3>
                  <p className="mt-2">
                    Every chapter gets its own section plan and takeaways before the full text
                    is generated.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="paper-panel rounded-[36px] p-6 sm:p-8">
            <ProjectForm />
          </section>
        </div>
      </div>
    </main>
  );
}
