import { describe, expect, it } from "vitest";

import { countWords, formatNumber, safeFilename } from "@/lib/utils";

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("collapses irregular whitespace and trims", () => {
    expect(countWords("  a\n\nb\t c  ")).toBe(3);
  });

  it("returns 0 for empty or nullish input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWords("   ")).toBe(0);
  });
});

describe("safeFilename", () => {
  it("slugifies a title", () => {
    expect(safeFilename("My Great Book!")).toBe("my-great-book");
  });

  it("strips leading/trailing separators and caps length", () => {
    expect(safeFilename("  ---Hello---  ")).toBe("hello");
    expect(safeFilename("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(safeFilename("!!!")).toBe("");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(12345)).toBe("12,345");
  });
});
