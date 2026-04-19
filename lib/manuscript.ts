import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import { safeFilename } from "@/lib/utils";

type ManuscriptChapter = {
  chapterNumber: number;
  title: string;
  content: string | null;
};

type ManuscriptProject = {
  title: string;
  summary: string | null;
  chapters: ManuscriptChapter[];
};

export function buildManuscriptText(project: ManuscriptProject) {
  const segments: string[] = [project.title];

  if (project.summary) {
    segments.push(project.summary);
  }

  for (const chapter of project.chapters) {
    segments.push(`Chapter ${chapter.chapterNumber}: ${chapter.title}`);
    segments.push(chapter.content?.trim() || "[No content yet]");
  }

  return segments.join("\n\n").trim();
}

export async function buildDocxBuffer(project: ManuscriptProject) {
  const children: Paragraph[] = [
    new Paragraph({
      text: project.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 280 },
    }),
  ];

  if (project.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun(project.summary)],
        spacing: { after: 280 },
      }),
    );
  }

  for (const chapter of project.chapters) {
    children.push(
      new Paragraph({
        text: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 180 },
      }),
    );

    const blocks = (chapter.content?.trim() || "[No content yet]")
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    for (const block of blocks) {
      children.push(
        new Paragraph({
          children: [new TextRun(block)],
          spacing: { after: 140 },
        }),
      );
    }
  }

  const document = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

export function buildExportFilename(title: string) {
  return `${safeFilename(title) || "book-manuscript"}.docx`;
}
