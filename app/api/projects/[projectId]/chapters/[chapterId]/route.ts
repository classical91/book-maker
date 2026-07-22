import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUserId } from "@/lib/auth";
import {
  conflict,
  invalidState,
  notFound,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api";
import { resolveChapterTransition } from "@/lib/chapter-state";
import { getOwnedProject, syncProjectStatus } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { snapshotChapterRevision } from "@/lib/revisions";
import { parseChapterBrief, updateChapterSchema } from "@/lib/schemas";
import { countWords } from "@/lib/utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; chapterId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { projectId, chapterId } = await context.params;
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, projectId, project: { ownerId: userId } },
  });
  if (!chapter) return notFound("Chapter not found.");

  return NextResponse.json({ chapter });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string; chapterId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { projectId, chapterId } = await context.params;

  const project = await getOwnedProject(userId, projectId);
  if (!project) return notFound("Project not found.");
  if (!project.chapters.some((item) => item.id === chapterId)) {
    return notFound("Chapter not found.");
  }

  const body = await readJson(request);
  if (body.response) return body.response;

  const parsed = updateChapterSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  const { title, content, summary, status, expectedUpdatedAt } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.chapter.findFirst({ where: { id: chapterId, projectId } });
      if (!current) return { kind: "not_found" as const };

      if (expectedUpdatedAt && current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return { kind: "conflict" as const };
      }

      const nextContent = content ?? current.content ?? "";
      const nextStatus = status ?? current.status;

      const transition = resolveChapterTransition({
        from: current.status,
        to: nextStatus,
        hasBrief: Boolean(parseChapterBrief(current.brief)),
        hasContent: Boolean(nextContent.trim()),
      });
      if (!transition.ok) return { kind: "invalid_state" as const, message: transition.message };

      const contentChanges = content !== undefined && content !== (current.content ?? "");

      // Snapshot the prior draft before a manual overwrite replaces existing prose.
      if (contentChanges && (current.content ?? "").trim()) {
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
          { throttle: true },
        );
      }

      const updated = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(summary !== undefined ? { summary } : {}),
          ...(content !== undefined ? { content } : {}),
          status: nextStatus,
          wordCount: countWords(nextContent),
        },
      });

      return { kind: "ok" as const, chapter: updated };
    });

    if (result.kind === "not_found") return notFound("Chapter not found.");
    if (result.kind === "conflict") {
      return conflict("This chapter was changed elsewhere. Reload to get the latest version.");
    }
    if (result.kind === "invalid_state") return invalidState(result.message);

    await syncProjectStatus(projectId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ chapter: result.chapter });
  } catch (error) {
    console.error(error);
    return serverError("Could not save the chapter.");
  }
}
