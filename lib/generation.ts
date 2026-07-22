import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

// A lock is considered stale (crashed mid-generation) after this long, so a
// chapter can never get permanently stuck in RUNNING.
const STALE_LOCK_MS = 5 * 60 * 1000;

export function readIdempotencyKey(request: Request) {
  return request.headers.get("idempotency-key") || randomUUID();
}

/**
 * Atomically claims the generation lock for a chapter. Succeeds only if no
 * generation is currently RUNNING (or the running lock is stale). This prevents
 * two simultaneous generation requests for the same chapter.
 */
export async function acquireChapterGenerationLock(chapterId: string, key: string) {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  const result = await prisma.chapter.updateMany({
    where: {
      id: chapterId,
      OR: [
        { generationStatus: { not: "RUNNING" } },
        { generationStartedAt: { lt: staleBefore } },
      ],
    },
    data: {
      generationStatus: "RUNNING",
      generationStartedAt: new Date(),
      generationKey: key,
    },
  });
  return result.count > 0;
}

/** Marks a chapter's generation as failed without touching its saved content. */
export async function markChapterGenerationFailed(chapterId: string) {
  await prisma.chapter
    .update({
      where: { id: chapterId },
      data: { generationStatus: "FAILED" },
    })
    .catch(() => {
      // The chapter may have been deleted; failure bookkeeping is best-effort.
    });
}
