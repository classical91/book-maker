import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { notFound, serverError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { snapshotEbookRevision } from "@/lib/revisions";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ ebookId: string; revisionId: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const { ebookId, revisionId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.ebook.findFirst({ where: { id: ebookId, ownerId: userId } });
      if (!current) return { kind: "not_found" as const };

      const revision = await tx.ebookRevision.findFirst({
        where: { id: revisionId, ebookId },
      });
      if (!revision) return { kind: "not_found" as const };

      // Snapshot the current state so restoring is itself reversible.
      await snapshotEbookRevision(
        tx,
        { id: current.id, title: current.title, content: current.content },
        "MANUAL_SAVE",
      );

      const updated = await tx.ebook.update({
        where: { id: ebookId },
        data: { title: revision.title, content: revision.content },
      });

      return { kind: "ok" as const, ebook: updated };
    });

    if (result.kind === "not_found") return notFound("E-book or revision not found.");
    return NextResponse.json({ ebook: result.ebook });
  } catch (error) {
    console.error(error);
    return serverError("Could not restore the revision.");
  }
}
