import { ChapterStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { resolveChapterTransition } from "@/lib/chapter-state";

describe("resolveChapterTransition", () => {
  it("allows moving to BRIEF_READY only when a brief exists", () => {
    expect(
      resolveChapterTransition({
        from: ChapterStatus.OUTLINED,
        to: ChapterStatus.BRIEF_READY,
        hasBrief: true,
        hasContent: false,
      }),
    ).toEqual({ ok: true });

    const blocked = resolveChapterTransition({
      from: ChapterStatus.OUTLINED,
      to: ChapterStatus.BRIEF_READY,
      hasBrief: false,
      hasContent: false,
    });
    expect(blocked.ok).toBe(false);
  });

  it("requires content for DRAFTED, REVIEWED and COMPLETE", () => {
    for (const to of [ChapterStatus.DRAFTED, ChapterStatus.REVIEWED, ChapterStatus.COMPLETE]) {
      expect(
        resolveChapterTransition({ from: ChapterStatus.BRIEF_READY, to, hasBrief: true, hasContent: false }).ok,
      ).toBe(false);
      expect(
        resolveChapterTransition({ from: ChapterStatus.BRIEF_READY, to, hasBrief: true, hasContent: true }).ok,
      ).toBe(true);
    }
  });

  it("allows a no-op transition when invariants hold", () => {
    expect(
      resolveChapterTransition({
        from: ChapterStatus.DRAFTED,
        to: ChapterStatus.DRAFTED,
        hasBrief: true,
        hasContent: true,
      }),
    ).toEqual({ ok: true });
  });

  it("allows reopening a completed chapter back to a content-bearing state", () => {
    expect(
      resolveChapterTransition({
        from: ChapterStatus.COMPLETE,
        to: ChapterStatus.DRAFTED,
        hasBrief: true,
        hasContent: true,
      }).ok,
    ).toBe(true);
  });
});
