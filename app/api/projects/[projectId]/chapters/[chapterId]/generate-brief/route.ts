import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { conflict, notFound, serverError, unauthorized } from "@/lib/api";
import {
  acquireChapterGenerationLock,
  markChapterGenerationFailed,
  readIdempotencyKey,
} from "@/lib/generation";
import { recentChapterSummaries, toChapterMemoryRecord } from "@/lib/memory";
import { generateStructuredOutput } from "@/lib/openai";
import { canGenerateForChapter, getOwnedProject, isDraftLockedStatus } from "@/lib/projects";
import { buildBriefPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { briefResponseSchema, chapterPlanSchema, parseOutlineBullets } from "@/lib/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; chapterId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { projectId, chapterId } = await context.params;
  const project = await getOwnedProject(userId, projectId);
  if (!project) return notFound("Project not found.");

  const chapter = project.chapters.find((item) => item.id === chapterId);
  if (!chapter) return notFound("Chapter not found.");

  if (!canGenerateForChapter(project.chapters, chapter.chapterNumber)) {
    return conflict(
      "Draft chapters in order. Earlier chapters need a draft before this brief can be generated.",
    );
  }

  const locked = await acquireChapterGenerationLock(chapterId, readIdempotencyKey(request));
  if (!locked) {
    return conflict("A generation is already in progress for this chapter.");
  }

  try {
    const chapterTargetWords =
      chapter.targetWords ?? Math.max(900, Math.round(project.targetWords / project.totalChapters));
    const plan = chapterPlanSchema.safeParse(chapter.plan);
    const records = project.chapters.map((item) => toChapterMemoryRecord(item, null));

    const brief = await generateStructuredOutput({
      operation: "brief",
      name: "chapter_brief",
      schema: briefResponseSchema,
      instructions:
        "You are a nonfiction development editor. Return only structured data that satisfies the schema.",
      input: buildBriefPrompt({
        ...project,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        outlineBullets: parseOutlineBullets(chapter.outlineBullets),
        chapterTargetWords,
        purpose: plan.success ? plan.data.purpose : null,
        readerTransformation: plan.success ? plan.data.readerTransformation : null,
        recentSummaries: recentChapterSummaries(records, chapter.chapterNumber),
        chapterTitles: project.chapters.map((item) => ({
          chapterNumber: item.chapterNumber,
          title: item.title,
        })),
      }),
    });

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        brief,
        status: isDraftLockedStatus(chapter.status) ? chapter.status : "BRIEF_READY",
        generationStatus: "SUCCEEDED",
      },
    });

    revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);

    return NextResponse.json({ chapter: updatedChapter });
  } catch (error) {
    console.error(error);
    await markChapterGenerationFailed(chapterId);
    return serverError("Could not generate the chapter brief.");
  }
}
