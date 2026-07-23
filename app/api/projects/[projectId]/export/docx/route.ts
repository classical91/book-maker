import { notFound, serverError, unauthorized } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import {
  buildBookDocx,
  exportFilename,
  isExportScope,
  projectToExportDocument,
} from "@/lib/export";
import { getOwnedProject } from "@/lib/projects";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { projectId } = await context.params;
    const project = await getOwnedProject(userId, projectId);
    if (!project) return notFound("Project not found.");

    const scopeParam = new URL(request.url).searchParams.get("scope");
    const scope = isExportScope(scopeParam) ? scopeParam : "drafted";

    const exportDoc = projectToExportDocument(
      {
        title: project.title,
        summary: project.summary,
        chapters: project.chapters.map((chapter) => ({
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content,
          status: chapter.status,
        })),
      },
      scope,
    );

    if (exportDoc.sections.length === 0) {
      return serverError("Nothing to export yet for the selected scope.");
    }

    const buffer = await buildBookDocx(exportDoc);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${exportFilename(project.title)}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not export the manuscript.");
  }
}
