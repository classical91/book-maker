import { describe, expect, it } from "vitest";

import {
  buildGlobalMemory,
  recentChapterSummaries,
  toChapterMemoryRecord,
  type ChapterMemoryRecord,
} from "@/lib/memory";

function record(overrides: Partial<ChapterMemoryRecord> & { chapterNumber: number }): ChapterMemoryRecord {
  return {
    title: `Chapter ${overrides.chapterNumber}`,
    summary: `summary ${overrides.chapterNumber}`,
    introducedConcepts: [],
    keyDefinitions: [],
    examplesUsed: [],
    claims: [],
    openLoops: [],
    transitionNote: null,
    ...overrides,
  };
}

describe("buildGlobalMemory", () => {
  it("only uses chapters before the current one", () => {
    const records = [
      record({ chapterNumber: 1, introducedConcepts: ["alpha"] }),
      record({ chapterNumber: 2, introducedConcepts: ["beta"] }),
      record({ chapterNumber: 3, introducedConcepts: ["gamma"] }),
    ];
    const memory = buildGlobalMemory(records, 2);
    expect(memory).toContain("alpha");
    expect(memory).not.toContain("beta");
    expect(memory).not.toContain("gamma");
  });

  it("deduplicates concepts and lets later chapters override a definition", () => {
    const records = [
      record({
        chapterNumber: 1,
        introducedConcepts: ["shared"],
        keyDefinitions: [{ term: "X", definition: "first" }],
      }),
      record({
        chapterNumber: 2,
        introducedConcepts: ["shared"],
        keyDefinitions: [{ term: "X", definition: "second" }],
      }),
    ];
    const memory = buildGlobalMemory(records, 3);
    expect(memory.match(/shared/g)?.length).toBe(1);
    expect(memory).toContain("X: second");
    expect(memory).not.toContain("X: first");
  });

  it("returns a placeholder when there is no prior context", () => {
    expect(buildGlobalMemory([record({ chapterNumber: 1 })], 1)).toMatch(/first chapter/i);
  });
});

describe("recentChapterSummaries", () => {
  it("returns the most recent prior summaries, oldest-first", () => {
    const records = [
      record({ chapterNumber: 1, summary: "s1" }),
      record({ chapterNumber: 2, summary: "s2" }),
      record({ chapterNumber: 3, summary: "s3" }),
    ];
    const summaries = recentChapterSummaries(records, 4, 2);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toContain("s2");
    expect(summaries[1]).toContain("s3");
  });
});

describe("toChapterMemoryRecord", () => {
  it("parses JSON fields and falls back to the chapter summary", () => {
    const rec = toChapterMemoryRecord(
      { chapterNumber: 1, title: "T", summary: "chapter summary" },
      {
        summary: null,
        introducedConcepts: ["a", "b"],
        keyDefinitions: [{ term: "T", definition: "D" }],
        examplesUsed: [],
        claims: ["c1"],
        openLoops: [],
        transitionNote: "next",
      },
    );
    expect(rec.summary).toBe("chapter summary");
    expect(rec.introducedConcepts).toEqual(["a", "b"]);
    expect(rec.keyDefinitions).toEqual([{ term: "T", definition: "D" }]);
    expect(rec.claims).toEqual(["c1"]);
    expect(rec.transitionNote).toBe("next");
  });

  it("tolerates malformed JSON shapes", () => {
    const rec = toChapterMemoryRecord(
      { chapterNumber: 1, title: "T", summary: null },
      {
        summary: "m",
        introducedConcepts: "not-an-array" as unknown as null,
        keyDefinitions: [{ term: "", definition: "x" }],
        examplesUsed: null,
        claims: null,
        openLoops: null,
        transitionNote: null,
      },
    );
    expect(rec.introducedConcepts).toEqual([]);
    expect(rec.keyDefinitions).toEqual([]); // empty term is dropped
  });
});
