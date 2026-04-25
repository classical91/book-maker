import { notFound } from "next/navigation";

import { EbookChapterEditor } from "@/components/ebook-chapter-editor";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ ebookId: string; chapterId: string }>;
}) {
  const userId = await requireUserIdOrRedirect();
  const { ebookId, chapterId } = await params;

  const ebook = await prisma.ebook.findFirst({
    where: { id: ebookId, ownerId: userId },
    include: { chapters: { orderBy: { position: "asc" } } },
  });

  if (!ebook) notFound();

  const idx = ebook.chapters.findIndex((c) => c.id === chapterId);
  if (idx === -1) notFound();

  const chapter = ebook.chapters[idx];

  return (
    <EbookChapterEditor
      ebookId={ebookId}
      chapterId={chapterId}
      initialTitle={chapter.title}
      initialContent={chapter.content ?? ""}
      prevId={ebook.chapters[idx - 1]?.id}
      nextId={ebook.chapters[idx + 1]?.id}
    />
  );
}
