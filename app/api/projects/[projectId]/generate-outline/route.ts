import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { conflict, notFound, serverError, unauthorized } from "@/lib/api";
import { generateStructuredOutput } from "@/lib/openai";
import { getOwnedProject, isDraftLockedStatus } from "@/lib/projects";
import { buildOutlinePrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { type OutlineResponse, outlineResponseSchema } from "@/lib/schemas";

function normalizeOutline(payload: OutlineResponse, expectedCount: number) {
  const chapters = [...payload.chapters].sort(
    (left, right) => left.chapterNumber - right.chapterNumber,
  );

  if (chapters.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} chapters but received ${chapters.length}.`);
  }

  const hasExactSequence = chapters.every(
    (chapter, index) => chapter.chapterNumber === index + 1,
  );

  if (!hasExactSequence) {
    throw new Error("Outline chapters must be numbered sequentially starting at 1.");
  }

  return { summary: payload.summary, chapters };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { projectId } = await context.params;
    const project = await getOwnedProject(userId, projectId);

    if (!project) {
      return notFound("Project not found.");
    }

    if (project.chapters.some((chapter) => isDraftLockedStatus(chapter.status))) {
      return conflict("Outline regeneration is locked after drafting begins.");
    }

    const outline = normalizeOutline(
      await generateStructuredOutput({
        operation: "outline",
        name: "book_outline",
        schema: outlineResponseSchema,
        instructions:
          "You are a senior nonfiction book architect. Return only structured data that satisfies the schema.",
        input: buildOutlinePrompt(project),
      }),
      project.totalChapters,
    );

    await prisma.$transaction([
      prisma.chapter.deleteMany({ where: { projectId } }),
      prisma.bookProject.update({
        where: { id: projectId },
        data: { summary: outline.summary, status: "OUTLINE_READY" },
      }),
      prisma.bookMemory.upsert({
        where: { projectId },
        update: {
          keyTerms: [project.title, project.genre, project.audience],
          styleRules: {
            nonfiction: true,
            tone: project.tone,
            audience: project.audience,
            genre: project.genre,
          },
        },
        create: {
          projectId,
          keyTerms: [project.title, project.genre, project.audience],
          styleRules: {
            nonfiction: true,
            tone: project.tone,
            audience: project.audience,
            genre: project.genre,
          },
          continuityNotes: "",
        },
      }),
      prisma.chapter.createMany({
        data: outline.chapters.map((chapter) => ({
          projectId,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          outlineBullets: chapter.bullets,
          targetWords: chapter.wordTarget,
          plan: {
            purpose: chapter.purpose,
            readerTransformation: chapter.readerTransformation,
            dependsOn: chapter.dependsOn,
            sourceNeeds: chapter.sourceNeeds,
          },
          status: "OUTLINED",
        })),
      }),
    ]);

    const updatedProject = await getOwnedProject(userId, projectId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error(error);
    return serverError("Could not generate the outline.");
  }
}
