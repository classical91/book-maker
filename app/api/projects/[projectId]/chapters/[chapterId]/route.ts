import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { getOwnedProject, syncProjectStatus } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { parseChapterBrief, updateChapterSchema } from "@/lib/schemas";
import { countWords } from "@/lib/utils";

export async function PATCH(
  request: Request,
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

    const body = await request.json();
    const data = updateChapterSchema.parse(body);
    const nextContent = data.content ?? chapter.content ?? "";
    const nextStatus = data.status ?? chapter.status;

    if (["REVIEWED", "COMPLETE"].includes(nextStatus) && !nextContent.trim()) {
      return NextResponse.json(
        { error: "A chapter needs content before it can be reviewed or completed." },
        { status: 400 },
      );
    }

    if (nextStatus === "BRIEF_READY" && !parseChapterBrief(chapter.brief)) {
      return NextResponse.json(
        { error: "Generate a brief before setting this status." },
        { status: 400 },
      );
    }

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        status: nextStatus,
        wordCount: countWords(nextContent),
      },
    });

    await syncProjectStatus(projectId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/chapters/${chapterId}`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ chapter: updatedChapter });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not save the chapter.",
      },
      { status: 400 },
    );
  }
}
