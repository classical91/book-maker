import { ChapterStatus } from "@prisma/client";

/**
 * Canonical forward progression for a chapter. Movement backward (reopening a
 * completed chapter, resetting to re-brief) is allowed, but the invariants below
 * always hold regardless of direction.
 */
export const CHAPTER_STATUS_ORDER: ChapterStatus[] = [
  ChapterStatus.OUTLINED,
  ChapterStatus.BRIEF_READY,
  ChapterStatus.DRAFTED,
  ChapterStatus.REVIEWED,
  ChapterStatus.COMPLETE,
];

const CONTENT_REQUIRED: ChapterStatus[] = [
  ChapterStatus.DRAFTED,
  ChapterStatus.REVIEWED,
  ChapterStatus.COMPLETE,
];

export type ChapterTransitionInput = {
  from: ChapterStatus;
  to: ChapterStatus;
  hasBrief: boolean;
  hasContent: boolean;
};

export type ChapterTransitionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validates a requested chapter status change. Rather than allowing arbitrary
 * jumps, it enforces the invariants that make each status meaningful:
 *
 * - `BRIEF_READY` requires a generated brief.
 * - `DRAFTED`, `REVIEWED`, and `COMPLETE` require written content.
 *
 * A no-op (same status) is always allowed provided its invariants still hold, so
 * routine saves never fail the check.
 */
export function resolveChapterTransition({
  to,
  hasBrief,
  hasContent,
}: ChapterTransitionInput): ChapterTransitionResult {
  if (CONTENT_REQUIRED.includes(to) && !hasContent) {
    return {
      ok: false,
      message: "A chapter needs content before it can be drafted, reviewed, or completed.",
    };
  }

  if (to === ChapterStatus.BRIEF_READY && !hasBrief) {
    return {
      ok: false,
      message: "Generate a brief before setting this status.",
    };
  }

  return { ok: true };
}
