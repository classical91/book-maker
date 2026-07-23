import { describe, expect, it } from "vitest";

import {
  MAX_CHAPTER_CONTENT,
  createEbookSchema,
  updateChapterSchema,
  updateEbookSchema,
} from "@/lib/schemas";

describe("createEbookSchema", () => {
  it("trims and accepts a valid title", () => {
    const parsed = createEbookSchema.parse({ title: "  My Book  " });
    expect(parsed.title).toBe("My Book");
  });

  it("rejects an empty title", () => {
    expect(createEbookSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createEbookSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an over-long title", () => {
    expect(createEbookSchema.safeParse({ title: "x".repeat(201) }).success).toBe(false);
  });
});

describe("updateEbookSchema", () => {
  it("accepts partial updates and coerces expectedUpdatedAt to a Date", () => {
    const parsed = updateEbookSchema.parse({
      content: "hello",
      expectedUpdatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(parsed.content).toBe("hello");
    expect(parsed.expectedUpdatedAt).toBeInstanceOf(Date);
  });

  it("rejects invalid types", () => {
    expect(updateEbookSchema.safeParse({ title: 123 }).success).toBe(false);
  });
});

describe("updateChapterSchema", () => {
  it("enforces the shared max content length", () => {
    expect(updateChapterSchema.safeParse({ content: "x".repeat(MAX_CHAPTER_CONTENT) }).success).toBe(true);
    expect(updateChapterSchema.safeParse({ content: "x".repeat(MAX_CHAPTER_CONTENT + 1) }).success).toBe(false);
  });
});
