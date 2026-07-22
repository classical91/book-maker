import { notFound } from "next/navigation";

import { EbookEditor } from "@/components/ebook-editor";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Per-user data; never statically prerender.
export const dynamic = "force-dynamic";

export default async function EditEbookPage({
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
    <EbookEditor
      id={ebook.id}
      initialTitle={ebook.title}
      initialContent={ebook.content ?? ""}
      initialUpdatedAt={ebook.updatedAt.toISOString()}
    />
  );
}
