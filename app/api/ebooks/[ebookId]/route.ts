import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { conflict, notFound, readJson, serverError, unauthorized, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { snapshotEbookRevision } from "@/lib/revisions";
import { updateEbookSchema } from "@/lib/schemas";
import { countWords } from "@/lib/utils";

async function getOwned(ebookId: string, userId: string) {
  return prisma.ebook.findFirst({ where: { id: ebookId, ownerId: userId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { ebookId } = await params;
  const ebook = await getOwned(ebookId, userId);
  if (!ebook) return notFound("E-book not found.");

  return NextResponse.json({ ebook });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { ebookId } = await params;

  const body = await readJson(request);
  if (body.response) return body.response;

  const parsed = updateEbookSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  const { title, content, expectedUpdatedAt } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.ebook.findFirst({ where: { id: ebookId, ownerId: userId } });
      if (!current) return { kind: "not_found" as const };

      if (
        expectedUpdatedAt &&
        current.updatedAt.getTime() !== expectedUpdatedAt.getTime()
      ) {
        return { kind: "conflict" as const };
      }

      const contentChanges = content !== undefined && content !== (current.content ?? "");
      const titleChanges = title !== undefined && title !== current.title;

      // Snapshot the prior state before overwriting so edits can be restored.
      if (contentChanges || titleChanges) {
        await snapshotEbookRevision(
          tx,
          { id: current.id, title: current.title, content: current.content },
          "MANUAL_SAVE",
          { throttle: true },
        );
      }

      const updated = await tx.ebook.update({
        where: { id: ebookId },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content, wordCount: countWords(content) }),
        },
      });

      return { kind: "ok" as const, ebook: updated };
    });

    if (result.kind === "not_found") return notFound("E-book not found.");
    if (result.kind === "conflict") {
      return conflict("This e-book was changed elsewhere. Reload to get the latest version.");
    }

    return NextResponse.json({ ebook: result.ebook });
  } catch (error) {
    console.error(error);
    return serverError("Could not save the e-book.");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { ebookId } = await params;
  const ebook = await getOwned(ebookId, userId);
  if (!ebook) return notFound("E-book not found.");

  await prisma.ebook.delete({ where: { id: ebookId } });
  return NextResponse.json({ success: true });
}
