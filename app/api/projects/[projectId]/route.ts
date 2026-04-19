import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { getOwnedProject } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/schemas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedJson();
  }

  const { projectId } = await context.params;
  const project = await getOwnedProject(userId, projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
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
    const existing = await getOwnedProject(userId, projectId);

    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await prisma.bookProject.update({
      where: {
        id: projectId,
      },
      data: {
        ...data,
        memory: {
          upsert: {
            create: {
              keyTerms: [data.title || existing.title, data.genre || existing.genre],
              styleRules: {
                nonfiction: true,
                tone: data.tone || existing.tone,
                audience: data.audience || existing.audience,
                genre: data.genre || existing.genre,
              },
              continuityNotes: existing.memory?.continuityNotes || "",
            },
            update: {
              styleRules: {
                nonfiction: true,
                tone: data.tone || existing.tone,
                audience: data.audience || existing.audience,
                genre: data.genre || existing.genre,
              },
            },
          },
        },
      },
      include: {
        chapters: {
          orderBy: {
            chapterNumber: "asc",
          },
        },
        memory: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}/outline`);
    revalidatePath(`/projects/${projectId}/manuscript`);

    return NextResponse.json({ project });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not update the project.",
      },
      { status: 400 },
    );
  }
}
