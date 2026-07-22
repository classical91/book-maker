import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; chapterId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { projectId, chapterId } = await params;

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, projectId, project: { ownerId: userId } },
    select: { id: true },
  });
  if (!chapter) return notFound("Chapter not found.");

  const revisions = await prisma.chapterRevision.findMany({
    where: { chapterId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      wordCount: true,
      source: true,
      model: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ revisions });
}
