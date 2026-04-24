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
  const ebook = await getOwned(ebookId, userId);
  if (!ebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ebook });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const { ebookId } = await params;
  const ebook = await getOwned(ebookId, userId);
  if (!ebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, content } = await request.json();
  const updated = await prisma.ebook.update({
    where: { id: ebookId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ebook: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const { ebookId } = await params;
  const ebook = await getOwned(ebookId, userId);
  if (!ebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.ebook.delete({ where: { id: ebookId } });
  return NextResponse.json({ success: true });
}
