import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { EbookChapterSidebar } from "@/components/ebook-chapter-sidebar";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureEbookTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ebooks" (
      "id" TEXT NOT NULL,
      "owner_id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ebooks_owner_id_updated_at_idx" ON "ebooks"("owner_id", "updated_at")`
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ebook_chapters" (
      "id" TEXT NOT NULL,
      "ebook_id" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT 'Untitled Chapter',
      "content" TEXT,
      "position" INTEGER NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ebook_chapters_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ebook_chapters_ebook_id_fkey"
        FOREIGN KEY ("ebook_id") REFERENCES "ebooks"("id") ON DELETE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ebook_chapters_ebook_id_position_idx" ON "ebook_chapters"("ebook_id", "position")`
  );
}

export default async function EbookLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ ebookId: string }>;
}) {
  const userId = await requireUserIdOrRedirect();
  const { ebookId } = await params;

  await ensureEbookTables();

  const ebook = await prisma.ebook.findFirst({
    where: { id: ebookId, ownerId: userId },
    select: {
      id: true,
      title: true,
      chapters: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, position: true },
      },
    },
  });

  if (!ebook) notFound();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <EbookChapterSidebar
        ebookId={ebook.id}
        ebookTitle={ebook.title}
        chapters={ebook.chapters}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
