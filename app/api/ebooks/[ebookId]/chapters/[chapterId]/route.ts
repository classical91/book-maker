import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getChapterOwned(chapterId: string, ebookId: string, userId: string) {
  const chapter = await prisma.ebookChapter.findFirst({
    where: { id: chapterId, ebookId },
  });
  if (!chapter) return null;
  const ebook = await prisma.ebook.findFirst({ where: { id: ebookId, ownerId: userId } });
  if (!ebook) return null;
  return chapter;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ebookId: string; chapterId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const { ebookId, chapterId } = await params;
  if (!(await getChapterOwned(chapterId, ebookId, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, content } = await request.json();

  const updated = await prisma.ebookChapter.update({
    where: { id: chapterId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      updatedAt: new Date(),
    },
  });

  await prisma.ebook.update({ where: { id: ebookId }, data: { updatedAt: new Date() } });

  return NextResponse.json({ chapter: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string; chapterId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const { ebookId, chapterId } = await params;
  if (!(await getChapterOwned(chapterId, ebookId, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.ebookChapter.delete({ where: { id: chapterId } });
  return NextResponse.json({ success: true });
}
