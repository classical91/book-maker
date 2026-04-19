import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { getOwnedProject } from "@/lib/projects";

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

  return NextResponse.json({
    manuscript: {
      id: project.id,
      title: project.title,
      summary: project.summary,
      status: project.status,
      totalChapters: project.totalChapters,
      chapters: project.chapters.map((chapter) => ({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
        summary: chapter.summary,
        wordCount: chapter.wordCount,
        status: chapter.status,
      })),
    },
  });
}
