import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { ebookId } = await params;
  const ebook = await prisma.ebook.findFirst({
    where: { id: ebookId, ownerId: userId },
    select: { id: true },
  });
  if (!ebook) return notFound("E-book not found.");

  const revisions = await prisma.ebookRevision.findMany({
    where: { ebookId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, source: true, createdAt: true },
  });

  return NextResponse.json({ revisions });
}
