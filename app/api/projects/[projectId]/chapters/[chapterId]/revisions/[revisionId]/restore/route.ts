import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ChapterStatus, Prisma } from "@prisma/client";

import { requireUserId } from "@/lib/auth";
import { notFound, serverError, unauthorized } from "@/lib/api";
import { syncProjectStatus } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { snapshotChapterRevision } from "@/lib/revisions";
import { countWords } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; chapterId: string; revisionId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { projectId, chapterId, revisionId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.chapter.findFirst({
        where: { id: chapterId, projectId, project: { ownerId: userId } },
      });
      if (!current) return { kind: "not_found" as const };

      const revision = await tx.chapterRevision.findFirst({
        where: { id: revisionId, chapterId },
      });
      if (!revision) return { kind: "not_found" as const };

      // Snapshot the current state so restoring is itself reversible.
      await snapshotChapterRevision(
        tx,
        {
          id: current.id,
          title: current.title,
          content: current.content,
          summary: current.summary,
          brief: current.brief === null ? Prisma.JsonNull : (current.brief as Prisma.InputJsonValue),
          wordCount: current.wordCount,
        },
        "MANUAL_SAVE",
      );

      const restoredContent = revision.content ?? "";
      const hasContent = Boolean(restoredContent.trim());
      // Restoring prose into an un-drafted chapter promotes it to DRAFTED;
      // never downgrade an already-reviewed/complete chapter.
      const belowDrafted =
        current.status === ChapterStatus.OUTLINED ||
        current.status === ChapterStatus.BRIEF_READY;
      const nextStatus = hasContent && belowDrafted ? ChapterStatus.DRAFTED : current.status;

      const updated = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          title: revision.title,
          content: revision.content,
          summary: revision.summary,
          wordCount: countWords(restoredContent),
          status: nextStatus,
        },
      });

      return { kind: "ok" as const, chapter: updated };
    });

    if (result.kind === "not_found") return notFound("Chapter or revision not found.");

    await syncProjectStatus(projectId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ chapter: result.chapter });
  } catch (error) {
    console.error(error);
    return serverError("Could not restore the revision.");
  }
}
