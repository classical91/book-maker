import { describe, expect, it } from "vitest";

import { normalizeOutline } from "@/lib/outline";
import type { OutlineResponse } from "@/lib/schemas";

function chapter(chapterNumber: number): OutlineResponse["chapters"][number] {
  return {
    chapterNumber,
    title: `Chapter ${chapterNumber}`,
    bullets: ["a", "b", "c"],
    purpose: "p",
    readerTransformation: "t",
    wordTarget: 1000,
    dependsOn: [],
    sourceNeeds: [],
  };
}

describe("normalizeOutline", () => {
  it("sorts chapters and returns them for a valid sequence", () => {
    const payload: OutlineResponse = { summary: "s", chapters: [chapter(2), chapter(1), chapter(3)] };
    const result = normalizeOutline(payload, 3);
    expect(result.chapters.map((c) => c.chapterNumber)).toEqual([1, 2, 3]);
    expect(result.summary).toBe("s");
  });

  it("throws when the chapter count does not match", () => {
    const payload: OutlineResponse = { summary: "s", chapters: [chapter(1), chapter(2)] };
    expect(() => normalizeOutline(payload, 3)).toThrow(/Expected 3 chapters/);
  });

  it("throws when numbering is not sequential from 1", () => {
    const payload: OutlineResponse = { summary: "s", chapters: [chapter(1), chapter(3), chapter(4)] };
    expect(() => normalizeOutline(payload, 3)).toThrow(/sequentially/);
  });
});
