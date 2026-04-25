import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwned(ebookId: string, userId: string) {
  return prisma.ebook.findFirst({ where: { id: ebookId, ownerId: userId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const { ebookId } = await params;
  if (!(await getOwned(ebookId, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chapters = await prisma.ebookChapter.findMany({
    where: { ebookId },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true, updatedAt: true,
      content: true },
  });

  return NextResponse.json({ chapters });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const { ebookId } = await params;
  if (!(await getOwned(ebookId, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const last = await prisma.ebookChapter.findFirst({
    where: { ebookId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const { title } = await request.json().catch(() => ({}));

  const chapter = await prisma.ebookChapter.create({
    data: {
      ebookId,
      title: title?.trim() || "Untitled Chapter",
      position: (last?.position ?? -1) + 1,
    },
  });

  await prisma.ebook.update({ where: { id: ebookId }, data: { updatedAt: new Date() } });

  return NextResponse.json({ chapter }, { status: 201 });
}
