import type { OutlineResponse } from "@/lib/schemas";

/**
 * Validates and normalizes a generated outline: sorts chapters, enforces the
 * expected count, and requires a 1..N sequential numbering. Throws on any
 * violation so the caller can reject the generation.
 */
export function normalizeOutline(payload: OutlineResponse, expectedCount: number) {
  const chapters = [...payload.chapters].sort(
    (left, right) => left.chapterNumber - right.chapterNumber,
  );

  if (chapters.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} chapters but received ${chapters.length}.`);
  }

  const hasExactSequence = chapters.every(
    (chapter, index) => chapter.chapterNumber === index + 1,
  );

  if (!hasExactSequence) {
    throw new Error("Outline chapters must be numbered sequentially starting at 1.");
  }

  return { summary: payload.summary, chapters };
}
