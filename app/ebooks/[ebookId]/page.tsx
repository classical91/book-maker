import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteEbookButton } from "@/components/delete-ebook-button";
import { SpeakButton } from "@/components/speak-button";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EbookPage({
  params,
}: {
  params: Promise<{ ebookId: string }>;
}) {
  const userId = await requireUserIdOrRedirect();
  const { ebookId } = await params;

  const ebook = await prisma.ebook.findFirst({
    where: { id: ebookId, ownerId: userId },
    include: {
      chapters: { orderBy: { position: "asc" } },
    },
  });

  if (!ebook) notFound();

  const fullText = ebook.chapters.length
    ? ebook.chapters
        .filter((ch) => ch.content)
        .map((ch) => `${ch.title}\n\n${ch.content}`)
        .join("\n\n")
    : (ebook.content ?? "");

  const totalWords = ebook.chapters.length
    ? ebook.chapters.reduce(
        (sum, ch) => sum + (ch.content?.split(/\s+/).filter(Boolean).length ?? 0),
        0,
      )
    : (ebook.content?.split(/\s+/).filter(Boolean).length ?? 0);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              E-book
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-[var(--foreground)]">
              {ebook.title}
            </h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {totalWords.toLocaleString()} words ·{" "}
              {ebook.updatedAt.toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {fullText && <SpeakButton text={fullText} />}
            <DeleteEbookButton id={ebook.id} />
          </div>
        </header>

        {/* Chapters */}
        {ebook.chapters.length > 0 ? (
          <section className="paper-panel overflow-hidden rounded-2xl">
            <div className="border-b border-[var(--line)] px-6 py-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Chapters
              </p>
              <span className="text-xs text-[var(--muted)]">{ebook.chapters.length}</span>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {ebook.chapters.map((ch, i) => {
                const words = ch.content?.split(/\s+/).filter(Boolean).length ?? 0;
                return (
                  <Link
                    key={ch.id}
                    href={`/ebooks/${ebook.id}/chapters/${ch.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[rgba(0,0,0,0.02)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-sm tabular-nums text-[var(--muted)]">
                        {i + 1}
                      </span>
                      <span className="truncate font-semibold text-[var(--foreground)]">
                        {ch.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm text-[var(--muted)]">
                      {words > 0 ? `${words.toLocaleString()} words` : "Empty"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          /* Legacy single-content ebook or brand new */
          <section className="paper-panel rounded-2xl p-8">
            {ebook.content ? (
              <div className="whitespace-pre-wrap font-serif text-[18px] leading-8 text-[var(--foreground)]">
                {ebook.content}
              </div>
            ) : (
              <div className="space-y-4 py-6 text-center">
                <p className="text-sm text-[var(--muted)]">No chapters yet.</p>
                <p className="text-sm text-[var(--muted)]">
                  Hit <strong>+ Add chapter</strong> in the sidebar to start writing.
                </p>
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
