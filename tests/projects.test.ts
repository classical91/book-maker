import { describe, expect, it } from "vitest";

import {
  canGenerateForChapter,
  getHighestDraftedChapterNumber,
  getProjectStatusFromChapters,
  isDraftLockedStatus,
} from "@/lib/projects";

describe("isDraftLockedStatus", () => {
  it("treats drafted/reviewed/complete as locked", () => {
    expect(isDraftLockedStatus("DRAFTED")).toBe(true);
    expect(isDraftLockedStatus("REVIEWED")).toBe(true);
    expect(isDraftLockedStatus("COMPLETE")).toBe(true);
    expect(isDraftLockedStatus("OUTLINED")).toBe(false);
    expect(isDraftLockedStatus("BRIEF_READY")).toBe(false);
  });
});

describe("canGenerateForChapter", () => {
  const chapters = [
    { chapterNumber: 1, status: "COMPLETE" as const },
    { chapterNumber: 2, status: "DRAFTED" as const },
    { chapterNumber: 3, status: "OUTLINED" as const },
  ];

  it("allows generation when all earlier chapters are drafted", () => {
    expect(canGenerateForChapter(chapters, 3)).toBe(true);
    expect(canGenerateForChapter(chapters, 1)).toBe(true); // no earlier chapters
  });

  it("blocks generation when an earlier chapter is not yet drafted", () => {
    const gapped = [
      { chapterNumber: 1, status: "OUTLINED" as const },
      { chapterNumber: 2, status: "OUTLINED" as const },
    ];
    expect(canGenerateForChapter(gapped, 2)).toBe(false);
  });
});

describe("getHighestDraftedChapterNumber", () => {
  it("returns the highest drafted chapter number", () => {
    expect(
      getHighestDraftedChapterNumber([
        { chapterNumber: 1, status: "COMPLETE" },
        { chapterNumber: 2, status: "DRAFTED" },
        { chapterNumber: 3, status: "OUTLINED" },
      ]),
    ).toBe(2);
  });

  it("returns 0 when nothing is drafted", () => {
    expect(getHighestDraftedChapterNumber([{ chapterNumber: 1, status: "OUTLINED" }])).toBe(0);
  });
});

describe("getProjectStatusFromChapters", () => {
  it("is DRAFT without an outline", () => {
    expect(getProjectStatusFromChapters([], false)).toBe("DRAFT");
  });

  it("is OUTLINE_READY when outlined but nothing drafted", () => {
    expect(
      getProjectStatusFromChapters([{ status: "OUTLINED" }, { status: "BRIEF_READY" }], true),
    ).toBe("OUTLINE_READY");
  });

  it("is WRITING once any chapter is drafted", () => {
    expect(getProjectStatusFromChapters([{ status: "DRAFTED" }, { status: "OUTLINED" }], true)).toBe(
      "WRITING",
    );
  });

  it("is COMPLETE only when all chapters are complete", () => {
    expect(getProjectStatusFromChapters([{ status: "COMPLETE" }, { status: "COMPLETE" }], true)).toBe(
      "COMPLETE",
    );
  });
});
