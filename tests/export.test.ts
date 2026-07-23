import { describe, expect, it } from "vitest";

import {
  ebookToExportDocument,
  exportFilename,
  isExportScope,
  projectToExportDocument,
  selectChaptersForExport,
} from "@/lib/export";

const chapters = [
  { chapterNumber: 1, title: "One", content: "written", status: "COMPLETE" },
  { chapterNumber: 2, title: "Two", content: "draft here", status: "DRAFTED" },
  { chapterNumber: 3, title: "Three", content: null, status: "OUTLINED" },
];

describe("selectChaptersForExport", () => {
  it("completed → only COMPLETE chapters", () => {
    expect(selectChaptersForExport(chapters, "completed").map((c) => c.chapterNumber)).toEqual([1]);
  });

  it("drafted → only chapters with content", () => {
    expect(selectChaptersForExport(chapters, "drafted").map((c) => c.chapterNumber)).toEqual([1, 2]);
  });

  it("all → every chapter", () => {
    expect(selectChaptersForExport(chapters, "all").map((c) => c.chapterNumber)).toEqual([1, 2, 3]);
  });
});

describe("projectToExportDocument", () => {
  it("never emits placeholder content for drafted scope", () => {
    const doc = projectToExportDocument({ title: "Book", summary: "s", chapters }, "drafted");
    expect(doc.sections).toHaveLength(2);
    expect(doc.sections.every((section) => section.content && !section.content.includes("No content yet"))).toBe(true);
  });

  it("includes a placeholder for empty chapters only in all scope", () => {
    const doc = projectToExportDocument({ title: "Book", summary: null, chapters }, "all");
    expect(doc.sections).toHaveLength(3);
    expect(doc.sections[2].content).toContain("No content yet");
  });
});

describe("ebookToExportDocument", () => {
  it("wraps the ebook body as a single headingless section", () => {
    const doc = ebookToExportDocument({ title: "My Ebook", content: "body" });
    expect(doc.title).toBe("My Ebook");
    expect(doc.sections).toEqual([{ heading: null, content: "body" }]);
  });
});

describe("exportFilename", () => {
  it("normalizes the title and appends .docx", () => {
    expect(exportFilename("My Book!")).toBe("my-book.docx");
    expect(exportFilename("!!!")).toBe("book-manuscript.docx");
  });
});

describe("isExportScope", () => {
  it("validates known scopes", () => {
    expect(isExportScope("completed")).toBe(true);
    expect(isExportScope("drafted")).toBe(true);
    expect(isExportScope("all")).toBe(true);
    expect(isExportScope("nope")).toBe(false);
    expect(isExportScope(null)).toBe(false);
  });
});
