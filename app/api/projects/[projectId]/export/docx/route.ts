import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import {
  buildDocxBuffer,
  buildExportFilename,
} from "@/lib/manuscript";
import { getOwnedProject } from "@/lib/projects";

export async function GET(
  _request: Request,
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

    const buffer = await buildDocxBuffer({
      title: project.title,
      summary: project.summary,
      chapters: project.chapters.map((chapter) => ({
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
      })),
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${buildExportFilename(project.title)}"`,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not export the manuscript.",
      },
      { status: 500 },
    );
  }
}
