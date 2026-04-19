import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { generateStructuredOutput } from "@/lib/openai";
import { canGenerateForChapter, getOwnedProject, isDraftLockedStatus } from "@/lib/projects";
import { buildBriefPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { briefResponseSchema, parseOutlineBullets } from "@/lib/schemas";

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string; chapterId: string }> },
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedJson();
  }

  try {
    const { projectId, chapterId } = await context.params;
    const project = await getOwnedProject(userId, projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const chapter = project.chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
    }

    if (!canGenerateForChapter(project.chapters, chapter.chapterNumber)) {
      return NextResponse.json(
        {
          error:
            "Draft chapters in order. Earlier chapters need a draft before this brief can be generated.",
        },
        { status: 409 },
      );
    }

    const brief = await generateStructuredOutput({
      name: "chapter_brief",
      schema: briefResponseSchema,
      instructions:
        "You are a nonfiction development editor. Return only structured data that satisfies the schema.",
      input: buildBriefPrompt({
        ...project,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        outlineBullets: parseOutlineBullets(chapter.outlineBullets),
        previousChapterSummaries: project.chapters
          .filter(
            (item) =>
              item.chapterNumber < chapter.chapterNumber &&
              Boolean(item.summary?.trim()),
          )
          .map((item) => item.summary || ""),
        chapterTitles: project.chapters.map((item) => ({
          chapterNumber: item.chapterNumber,
          title: item.title,
        })),
      }),
    });

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        brief,
        status: isDraftLockedStatus(chapter.status) ? chapter.status : "BRIEF_READY",
      },
    });

    revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);

    return NextResponse.json({ chapter: updatedChapter });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not generate the chapter brief.",
      },
      { status: 500 },
    );
  }
}
