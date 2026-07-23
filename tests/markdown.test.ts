import { describe, expect, it } from "vitest";

import { parseInline, parseMarkdownBlocks } from "@/lib/markdown";

describe("parseInline", () => {
  it("returns a single plain run for text without markup", () => {
    expect(parseInline("hello world")).toEqual([{ text: "hello world" }]);
  });

  it("parses bold and italic", () => {
    expect(parseInline("a **b** c *d*")).toEqual([
      { text: "a " },
      { text: "b", bold: true },
      { text: " c " },
      { text: "d", italic: true },
    ]);
  });

  it("supports underscore emphasis", () => {
    expect(parseInline("__x__ _y_")).toEqual([
      { text: "x", bold: true },
      { text: " " },
      { text: "y", italic: true },
    ]);
  });

  it("always returns at least one run", () => {
    expect(parseInline("")).toEqual([{ text: "" }]);
  });
});

describe("parseMarkdownBlocks", () => {
  it("parses headings at their level", () => {
    const blocks = parseMarkdownBlocks("## Section\n### Sub");
    expect(blocks).toEqual([
      { type: "heading", level: 2, runs: [{ text: "Section" }] },
      { type: "heading", level: 3, runs: [{ text: "Sub" }] },
    ]);
  });

  it("groups wrapped lines into a single paragraph", () => {
    const blocks = parseMarkdownBlocks("one\ntwo\n\nthree");
    expect(blocks).toEqual([
      { type: "paragraph", runs: [{ text: "one two" }] },
      { type: "paragraph", runs: [{ text: "three" }] },
    ]);
  });

  it("parses bullet lists with -, * and +", () => {
    const blocks = parseMarkdownBlocks("- a\n* b\n+ c");
    expect(blocks.map((b) => b.type)).toEqual(["bullet", "bullet", "bullet"]);
  });

  it("numbers ordered items sequentially and restarts after an interruption", () => {
    const blocks = parseMarkdownBlocks("1. a\n2. b\n\nbreak\n\n1. c");
    const ordered = blocks.filter((b) => b.type === "ordered");
    expect(ordered).toEqual([
      { type: "ordered", number: 1, runs: [{ text: "a" }] },
      { type: "ordered", number: 2, runs: [{ text: "b" }] },
      { type: "ordered", number: 1, runs: [{ text: "c" }] },
    ]);
  });

  it("renumbers ordered items regardless of the source numbers", () => {
    const blocks = parseMarkdownBlocks("5. a\n6. b");
    expect(blocks).toEqual([
      { type: "ordered", number: 1, runs: [{ text: "a" }] },
      { type: "ordered", number: 2, runs: [{ text: "b" }] },
    ]);
  });

  it("ignores blank input", () => {
    expect(parseMarkdownBlocks("\n\n  \n")).toEqual([]);
  });
});
