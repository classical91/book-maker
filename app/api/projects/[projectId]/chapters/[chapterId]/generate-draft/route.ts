import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUserId } from "@/lib/auth";
import { conflict, notFound, serverError, unauthorized } from "@/lib/api";
import {
  acquireChapterGenerationLock,
  markChapterGenerationFailed,
  readIdempotencyKey,
} from "@/lib/generation";
import {
  buildGlobalMemory,
  recentChapterSummaries,
  toChapterMemoryRecord,
} from "@/lib/memory";
import { generateStructuredOutput, modelForOperation } from "@/lib/openai";
import {
  canGenerateForChapter,
  getOwnedProject,
  syncProjectStatus,
} from "@/lib/projects";
import { buildDraftPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { snapshotChapterRevision } from "@/lib/revisions";
import {
  chapterPlanSchema,
  draftResponseSchema,
  parseChapterBrief,
  parseOutlineBullets,
} from "@/lib/schemas";
import { countWords } from "@/lib/utils";

const MAX_KEY_TERMS = 60;

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
      "Draft chapters in order. Earlier chapters need a draft before this one can be generated.",
    );
  }

  const brief = parseChapterBrief(chapter.brief);
  if (!brief) {
    return conflict("Generate a chapter brief before drafting.");
  }

  const locked = await acquireChapterGenerationLock(chapterId, readIdempotencyKey(request));
  if (!locked) {
    return conflict("A generation is already in progress for this chapter.");
  }

  try {
    // Load prior chapters with their structured memory to build bounded context.
    const chaptersWithMemory = await prisma.chapter.findMany({
      where: { projectId },
      orderBy: { chapterNumber: "asc" },
      select: {
        chapterNumber: true,
        title: true,
        summary: true,
        memory: {
          select: {
            summary: true,
            introducedConcepts: true,
            keyDefinitions: true,
            examplesUsed: true,
            claims: true,
            openLoops: true,
            transitionNote: true,
          },
        },
      },
    });

    const records = chaptersWithMemory.map((item) =>
      toChapterMemoryRecord(item, item.memory),
    );

    const chapterTargetWords =
      chapter.targetWords ?? Math.max(900, Math.round(project.targetWords / project.totalChapters));
    const plan = chapterPlanSchema.safeParse(chapter.plan);
    const styleRules =
      project.memory?.styleRules &&
      typeof project.memory.styleRules === "object" &&
      !Array.isArray(project.memory.styleRules)
        ? (project.memory.styleRules as Record<string, unknown>)
        : null;

    const draft = await generateStructuredOutput({
      operation: "draft",
      name: "chapter_draft",
      schema: draftResponseSchema,
      instructions:
        "You are a nonfiction ghostwriter. Return only structured data that satisfies the schema.",
      input: buildDraftPrompt({
        ...project,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        outlineBullets: parseOutlineBullets(chapter.outlineBullets),
        brief,
        chapterTargetWords,
        purpose: plan.success ? plan.data.purpose : null,
        readerTransformation: plan.success ? plan.data.readerTransformation : null,
        sourceNeeds: plan.success ? plan.data.sourceNeeds : [],
        outlineChapters: chaptersWithMemory.map((item) => ({
          chapterNumber: item.chapterNumber,
          title: item.title,
        })),
        globalMemory: buildGlobalMemory(records, chapter.chapterNumber),
        recentSummaries: recentChapterSummaries(records, chapter.chapterNumber),
        styleRules,
      }),
    });

    const memory = draft.memory;
    const hadContent = Boolean(chapter.content?.trim());

    const existingKeyTerms = Array.isArray(project.memory?.keyTerms)
      ? project.memory.keyTerms.map((item) => String(item))
      : [];
    const nextKeyTerms = Array.from(
      new Set([...existingKeyTerms, chapter.title, ...memory.introducedConcepts]),
    ).slice(0, MAX_KEY_TERMS);

    // Persist draft, prior-work snapshot, chapter memory, and book memory
    // atomically. Chapter memory is REPLACED (upsert), never appended.
    const updatedChapter = await prisma.$transaction(async (tx) => {
      if (hadContent) {
        await snapshotChapterRevision(
          tx,
          {
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            summary: chapter.summary,
            brief: chapter.brief === null ? Prisma.JsonNull : (chapter.brief as Prisma.InputJsonValue),
            wordCount: chapter.wordCount,
          },
          "AI_REGENERATION",
          { model: modelForOperation("draft") },
        );
      }

      const nextChapter = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          content: draft.content,
          summary: memory.summary,
          wordCount: countWords(draft.content),
          status: "DRAFTED",
          generationStatus: "SUCCEEDED",
        },
      });

      const memoryData = {
        summary: memory.summary,
        introducedConcepts: memory.introducedConcepts,
        keyDefinitions: memory.keyDefinitions,
        examplesUsed: memory.examplesUsed,
        claims: memory.claims,
        openLoops: memory.openLoops,
        transitionNote: memory.transitionNote,
      };

      await tx.chapterMemory.upsert({
        where: { chapterId },
        update: memoryData,
        create: { chapterId, ...memoryData },
      });

      await tx.bookMemory.upsert({
        where: { projectId },
        update: { keyTerms: nextKeyTerms },
        create: {
          projectId,
          keyTerms: nextKeyTerms,
          styleRules: {
            nonfiction: true,
            tone: project.tone,
            audience: project.audience,
            genre: project.genre,
          },
        },
      });

      return nextChapter;
    });

    await syncProjectStatus(projectId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ chapter: updatedChapter, memory });
  } catch (error) {
    console.error(error);
    await markChapterGenerationFailed(chapterId);
    return serverError("Could not generate the chapter draft.");
  }
}
