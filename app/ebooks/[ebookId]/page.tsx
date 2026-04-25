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
  });

  if (!ebook) notFound();

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
              Last updated{" "}
              {ebook.updatedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {ebook.content && <SpeakButton text={ebook.content} />}
            <DeleteEbookButton id={ebook.id} />
            <Link
              href={`/ebooks/${ebook.id}/edit`}
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
            >
              Edit
            </Link>
          </div>
        </header>

        <article className="paper-panel rounded-[32px] p-6 sm:p-10">
          {ebook.content ? (
            <div className="whitespace-pre-wrap font-serif text-[18px] leading-8 text-[var(--foreground)]">
              {ebook.content}
            </div>
          ) : (
            <div className="space-y-4 py-8 text-center">
              <p className="text-sm text-[var(--muted)]">No content yet.</p>
              <Link
                href={`/ebooks/${ebook.id}/edit`}
                className="inline-flex rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--accent)]"
              >
                Start writing
              </Link>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
