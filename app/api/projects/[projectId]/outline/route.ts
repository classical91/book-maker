import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { getHighestDraftedChapterNumber, getOwnedProject } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { parseOutlineBullets, updateOutlineSchema } from "@/lib/schemas";

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedJson();
  }

  try {
    const { projectId } = await context.params;
    const project = await getOwnedProject(userId, projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const body = await request.json();
    const data = updateOutlineSchema.parse(body);

    if (data.chapters.length !== project.chapters.length) {
      return NextResponse.json(
        { error: "Chapter count cannot be changed in v1." },
        { status: 400 },
      );
    }

    const highestDraftedChapter = getHighestDraftedChapterNumber(project.chapters);
    const existingById = new Map(project.chapters.map((chapter) => [chapter.id, chapter]));

    if (highestDraftedChapter > 0 && data.summary !== project.summary) {
      return NextResponse.json(
        { error: "The book summary is locked once drafting begins." },
        { status: 409 },
      );
    }

    for (const chapter of data.chapters) {
      const existing = existingById.get(chapter.id);

      if (!existing) {
        return NextResponse.json(
          { error: "One or more chapters do not belong to this project." },
          { status: 400 },
        );
      }

      if (existing.chapterNumber <= highestDraftedChapter) {
        const unchanged =
          existing.title === chapter.title &&
          arraysEqual(parseOutlineBullets(existing.outlineBullets), chapter.bullets);

        if (!unchanged) {
          return NextResponse.json(
            {
              error:
                "Drafted chapters are locked. Only undrafted future chapters can be edited.",
            },
            { status: 409 },
          );
        }
      }
    }

    const outlineUpdates = data.chapters.reduce<ReturnType<typeof prisma.chapter.update>[]>(
      (operations, chapter) => {
        const existing = existingById.get(chapter.id)!;
        const titleChanged = existing.title !== chapter.title;
        const bulletsChanged = !arraysEqual(
          parseOutlineBullets(existing.outlineBullets),
          chapter.bullets,
        );
        const canEdit = existing.chapterNumber > highestDraftedChapter;

        if (!canEdit) {
          return operations;
        }

        operations.push(
          prisma.chapter.update({
            where: {
              id: chapter.id,
            },
            data: {
              title: chapter.title,
              outlineBullets: chapter.bullets,
              ...(titleChanged || bulletsChanged
                ? {
                    brief: Prisma.JsonNull,
                    status: "OUTLINED" as const,
                  }
                : {
                    status: existing.status,
                  }),
            },
          }),
        );

        return operations;
      },
      [],
    );

    if (outlineUpdates.length > 0) {
      await prisma.$transaction(outlineUpdates);
    }

    if (highestDraftedChapter === 0) {
      await prisma.bookProject.update({
        where: {
          id: projectId,
        },
        data: {
          summary: data.summary,
        },
      });
    }

    const updatedProject = await getOwnedProject(userId, projectId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not save the outline.",
      },
      { status: 400 },
    );
  }
}
