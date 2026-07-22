import { notFound, serverError, unauthorized } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { buildBookDocx, ebookToExportDocument, exportFilename } from "@/lib/export";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { ebookId } = await params;
    const ebook = await prisma.ebook.findFirst({ where: { id: ebookId, ownerId: userId } });
    if (!ebook) return notFound("E-book not found.");

    if (!ebook.content?.trim()) {
      return serverError("This e-book is empty — add content before exporting.");
    }

    const buffer = await buildBookDocx(ebookToExportDocument(ebook));

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${exportFilename(ebook.title)}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not export the e-book.");
  }
}
