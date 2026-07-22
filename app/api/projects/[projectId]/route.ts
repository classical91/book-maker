import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import {
  invalidState,
  notFound,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api";
import { getOwnedProject, isDraftLockedStatus } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/schemas";

// Structural fields whose change would invalidate already-drafted chapters.
const STRUCTURAL_FIELDS = ["totalChapters", "premise", "targetWords"] as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorized();
  }

  const { projectId } = await context.params;
  const project = await getOwnedProject(userId, projectId);

  if (!project) {
    return notFound("Project not found.");
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorized();
  }

  const { projectId } = await context.params;
  const existing = await getOwnedProject(userId, projectId);

  if (!existing) {
    return notFound("Project not found.");
  }

  const body = await readJson(request);
  if (body.response) return body.response;

  const parsed = updateProjectSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;

  // Once any chapter is drafted, changing the book's structure (chapter count,
  // premise, target length) would invalidate work already written.
  const draftingStarted = existing.chapters.some((chapter) =>
    isDraftLockedStatus(chapter.status),
  );
  if (draftingStarted) {
    const changedStructural = STRUCTURAL_FIELDS.filter(
      (field) => data[field] !== undefined && data[field] !== existing[field],
    );
    if (changedStructural.length > 0) {
      return invalidState(
        `Cannot change ${changedStructural.join(", ")} after drafting has started. Reset future chapters first.`,
      );
    }
  }

  try {
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
    return serverError("Could not update the project.");
  }
}
