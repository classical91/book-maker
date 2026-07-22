import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUserId } from "@/lib/auth";
import { conflict, notFound, serverError, unauthorized } from "@/lib/api";
import { generateStructuredOutput, OPENAI_MODEL } from "@/lib/openai";
import {
  canGenerateForChapter,
  getOwnedProject,
  syncProjectStatus,
} from "@/lib/projects";
import { buildDraftPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { snapshotChapterRevision } from "@/lib/revisions";
import {
  draftResponseSchema,
  parseChapterBrief,
  parseOutlineBullets,
} from "@/lib/schemas";
import { countWords } from "@/lib/utils";

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string; chapterId: string }> },
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorized();
  }

  try {
    const { projectId, chapterId } = await context.params;
    const project = await getOwnedProject(userId, projectId);

    if (!project) {
      return notFound("Project not found.");
    }

    const chapter = project.chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return notFound("Chapter not found.");
    }

    if (!canGenerateForChapter(project.chapters, chapter.chapterNumber)) {
      return conflict(
        "Draft chapters in order. Earlier chapters need a draft before this one can be generated.",
      );
    }

    const brief = parseChapterBrief(chapter.brief);

    if (!brief) {
      return conflict("Generate a chapter brief before drafting.");
    }

    const draft = await generateStructuredOutput({
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
        previousChapterSummaries: project.chapters
          .filter(
            (item) =>
              item.chapterNumber < chapter.chapterNumber &&
              Boolean(item.summary?.trim()),
          )
          .map((item) => item.summary || ""),
        continuityNotes: project.memory?.continuityNotes,
        styleRules:
          project.memory?.styleRules &&
          typeof project.memory.styleRules === "object" &&
          !Array.isArray(project.memory.styleRules)
            ? (project.memory.styleRules as Record<string, unknown>)
            : null,
      }),
    });

    const continuityNotes = [project.memory?.continuityNotes, draft.continuityNotes]
      .filter(Boolean)
      .join("\n\n");
    const existingKeyTerms = Array.isArray(project.memory?.keyTerms)
      ? project.memory.keyTerms.map((item) => String(item))
      : [];
    const nextKeyTerms = Array.from(
      new Set([...existingKeyTerms, chapter.title, ...brief.takeaways]),
    );

    const hadContent = Boolean(chapter.content?.trim());

    // Persist the draft, the snapshot of prior work, and the memory update
    // atomically so a partial write can never leave the chapter inconsistent.
    const updatedChapter = await prisma.$transaction(async (tx) => {
      // Never permanently overwrite existing prose: snapshot it first so the
      // user can restore the pre-regeneration version.
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
          { model: OPENAI_MODEL },
        );
      }

      const nextChapter = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          content: draft.content,
          summary: draft.summary,
          wordCount: countWords(draft.content),
          status: "DRAFTED",
        },
      });

      await tx.bookMemory.upsert({
        where: { projectId },
        update: {
          continuityNotes,
          keyTerms: nextKeyTerms,
        },
        create: {
          projectId,
          continuityNotes,
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

    return NextResponse.json({
      chapter: updatedChapter,
      continuityNotes,
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not generate the chapter draft.");
  }
}
