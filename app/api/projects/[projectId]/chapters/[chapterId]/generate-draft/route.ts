import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { generateStructuredOutput } from "@/lib/openai";
import {
  canGenerateForChapter,
  getOwnedProject,
  syncProjectStatus,
} from "@/lib/projects";
import { buildDraftPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
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
            "Draft chapters in order. Earlier chapters need a draft before this one can be generated.",
        },
        { status: 409 },
      );
    }

    const brief = parseChapterBrief(chapter.brief);

    if (!brief) {
      return NextResponse.json(
        { error: "Generate a chapter brief before drafting." },
        { status: 409 },
      );
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

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        content: draft.content,
        summary: draft.summary,
        wordCount: countWords(draft.content),
        status: "DRAFTED",
      },
    });

    await prisma.bookMemory.upsert({
      where: {
        projectId,
      },
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

    return NextResponse.json(
      {
        error: "Could not generate the chapter draft.",
      },
      { status: 500 },
    );
  }
}
