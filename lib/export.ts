import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  TableOfContents,
  TextRun,
} from "docx";

import { type InlineRun, parseMarkdownBlocks } from "@/lib/markdown";
import { safeFilename } from "@/lib/utils";

// Both AI projects and manual e-books normalize to this shape before export.
export type ExportSection = {
  heading?: string | null; // chapter title; omitted → no heading and no page break
  content: string | null; // Markdown or plain text
};

export type ExportDocument = {
  title: string;
  subtitle?: string | null;
  author?: string | null;
  description?: string | null;
  sections: ExportSection[];
};

export type ExportScope = "completed" | "drafted" | "all";

export function isExportScope(value: string | null): value is ExportScope {
  return value === "completed" || value === "drafted" || value === "all";
}

type ChapterLike = {
  chapterNumber: number;
  title: string;
  content: string | null;
  status: string;
};

/** Selects which chapters to include for a given export scope. */
export function selectChaptersForExport<T extends ChapterLike>(
  chapters: T[],
  scope: ExportScope,
): T[] {
  if (scope === "completed") {
    return chapters.filter((chapter) => chapter.status === "COMPLETE");
  }
  if (scope === "drafted") {
    return chapters.filter((chapter) => Boolean(chapter.content?.trim()));
  }
  return chapters;
}

export function projectToExportDocument(
  project: { title: string; summary: string | null; chapters: ChapterLike[] },
  scope: ExportScope,
): ExportDocument {
  const chapters = selectChaptersForExport(project.chapters, scope);
  const sections: ExportSection[] = chapters.map((chapter) => ({
    heading: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
    // Placeholders appear only when the caller explicitly asks for everything.
    content: chapter.content?.trim()
      ? chapter.content
      : scope === "all"
        ? "_(No content yet.)_"
        : null,
  }));

  return {
    title: project.title,
    description: project.summary,
    sections,
  };
}

export function ebookToExportDocument(ebook: {
  title: string;
  content: string | null;
}): ExportDocument {
  return {
    title: ebook.title,
    sections: [{ heading: null, content: ebook.content }],
  };
}

export function exportFilename(title: string) {
  return `${safeFilename(title) || "book-manuscript"}.docx`;
}

function mapHeadingLevel(level: number) {
  // Chapter titles use Heading 1; in-chapter Markdown headings start at "##".
  if (level <= 2) return HeadingLevel.HEADING_2;
  if (level === 3) return HeadingLevel.HEADING_3;
  return HeadingLevel.HEADING_4;
}

function toTextRuns(runs: InlineRun[]) {
  return runs.map((run) => new TextRun({ text: run.text, bold: run.bold, italics: run.italic }));
}

function markdownToParagraphs(markdown: string): Paragraph[] {
  return parseMarkdownBlocks(markdown).map((block) => {
    if (block.type === "heading") {
      return new Paragraph({
        heading: mapHeadingLevel(block.level),
        children: toTextRuns(block.runs),
        spacing: { before: 200, after: 120 },
      });
    }
    if (block.type === "bullet") {
      return new Paragraph({
        children: toTextRuns(block.runs),
        bullet: { level: 0 },
        spacing: { after: 80 },
      });
    }
    if (block.type === "ordered") {
      return new Paragraph({
        children: [new TextRun({ text: `${block.number}. ` }), ...toTextRuns(block.runs)],
        indent: { left: 720, hanging: 360 },
        spacing: { after: 80 },
      });
    }
    return new Paragraph({ children: toTextRuns(block.runs), spacing: { after: 140 } });
  });
}

/**
 * Renders a normalized ExportDocument to a polished DOCX: title page, optional
 * front matter, a table of contents (when there are chapter headings), a page
 * break before each chapter, Markdown parsing, book margins, page numbers, and
 * document metadata. Never inserts placeholder text on its own — the caller
 * decides via the document's section content.
 */
export async function buildBookDocx(doc: ExportDocument): Promise<Buffer> {
  const hasHeadings = doc.sections.some((section) => section.heading);
  const year = new Date().getFullYear();
  const children: (Paragraph | TableOfContents)[] = [];

  // Title page.
  children.push(
    new Paragraph({
      text: doc.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 240 },
    }),
  );
  if (doc.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: doc.subtitle, italics: true, size: 28 })],
        spacing: { after: 240 },
      }),
    );
  }
  if (doc.author) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: doc.author, size: 26 })],
        spacing: { before: 480 },
      }),
    );
  }

  // Front matter / copyright page.
  children.push(new Paragraph({ children: [new PageBreak()] }));
  if (doc.description) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: doc.description })],
        spacing: { after: 240 },
      }),
    );
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `© ${year}${doc.author ? ` ${doc.author}` : ""}. All rights reserved.`,
          size: 20,
          color: "666666",
        }),
      ],
    }),
  );

  // Table of contents (only meaningful when there are chapter headings).
  if (hasHeadings) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Contents", bold: true, size: 32 })],
        spacing: { after: 200 },
      }),
    );
    children.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
  }

  // Body.
  for (const section of doc.sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 200 },
        }),
      );
    }
    const body = section.content?.trim();
    if (body) {
      for (const paragraph of markdownToParagraphs(body)) {
        children.push(paragraph);
      }
    }
  }

  const document = new Document({
    title: doc.title,
    description: doc.description ?? undefined,
    creator: doc.author ?? "Draftloom",
    styles: {
      default: {
        document: { run: { font: "Georgia", size: 24 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: doc.title, size: 18, color: "888888" })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}
