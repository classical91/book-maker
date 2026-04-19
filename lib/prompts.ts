import type { ChapterBrief } from "@/lib/schemas";

type ProjectPromptContext = {
  title: string;
  genre: string;
  audience: string;
  tone: string;
  premise: string;
  targetWords: number;
  totalChapters: number;
  summary?: string | null;
};

type OutlinePromptContext = ProjectPromptContext;

type BriefPromptContext = ProjectPromptContext & {
  chapterNumber: number;
  chapterTitle: string;
  outlineBullets: string[];
  previousChapterSummaries: string[];
  chapterTitles: Array<{ chapterNumber: number; title: string }>;
};

type DraftPromptContext = ProjectPromptContext & {
  chapterNumber: number;
  chapterTitle: string;
  outlineBullets: string[];
  brief: ChapterBrief;
  previousChapterSummaries: string[];
  continuityNotes?: string | null;
  styleRules?: Record<string, unknown> | null;
};

function formatList(items: string[]) {
  if (!items.length) {
    return "None yet.";
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function buildOutlinePrompt(input: OutlinePromptContext) {
  return `
Title: ${input.title}
Genre: ${input.genre}
Audience: ${input.audience}
Tone: ${input.tone}
Premise: ${input.premise}
Target length: about ${input.targetWords} words
Chapter count: exactly ${input.totalChapters}

Generate a nonfiction book blueprint for this project.

Requirements:
- Produce exactly ${input.totalChapters} chapters.
- Each chapter must have a practical, specific title.
- Each chapter must include 3 to 5 bullet points.
- Keep the sequence cumulative so later chapters build on earlier ones.
- The summary should read like a sharp jacket summary for a serious nonfiction book.
- Avoid generic filler chapter names like "Conclusion" unless it truly fits the structure.
`.trim();
}

export function buildBriefPrompt(input: BriefPromptContext) {
  return `
Book title: ${input.title}
Book summary: ${input.summary || "Not generated yet"}
Genre: ${input.genre}
Audience: ${input.audience}
Tone: ${input.tone}
Premise: ${input.premise}
Chapter target length: about ${Math.max(900, Math.round(input.targetWords / input.totalChapters))} words

Full chapter list:
${input.chapterTitles.map((chapter) => `- Chapter ${chapter.chapterNumber}: ${chapter.title}`).join("\n")}

Current chapter:
Chapter ${input.chapterNumber}: ${input.chapterTitle}

Approved outline bullets:
${formatList(input.outlineBullets)}

Previous chapter summaries:
${formatList(input.previousChapterSummaries)}

Create a chapter brief for a nonfiction writer.

Requirements:
- Explain what the chapter must accomplish.
- Propose clean subsection headings in a sensible order.
- Include takeaways the reader should leave with.
- Add a transition note that connects from the previous chapter and sets up the next move.
- Keep the brief practical and specific to this project.
`.trim();
}

export function buildDraftPrompt(input: DraftPromptContext) {
  return `
Book title: ${input.title}
Book summary: ${input.summary || "Not generated yet"}
Genre: ${input.genre}
Audience: ${input.audience}
Tone: ${input.tone}
Premise: ${input.premise}
Target chapter length: about ${Math.max(900, Math.round(input.targetWords / input.totalChapters))} words

Current chapter:
Chapter ${input.chapterNumber}: ${input.chapterTitle}

Approved outline bullets:
${formatList(input.outlineBullets)}

Chapter brief:
${input.brief.brief}

Suggested sections:
${formatList(input.brief.sections)}

Reader takeaways:
${formatList(input.brief.takeaways)}

Transition note:
${input.brief.transitionNote}

Previous chapter summaries:
${formatList(input.previousChapterSummaries)}

Continuity notes:
${input.continuityNotes || "None yet."}

Style rules:
${JSON.stringify(input.styleRules || {}, null, 2)}

Write the full nonfiction chapter in plain text.

Requirements:
- Follow the approved outline and brief.
- Use section headings when they improve readability.
- Keep the prose polished, specific, and instructional without sounding robotic.
- Do not restart the book or repeat earlier chapters.
- End with forward momentum into the next chapter instead of a generic wrap-up.
`.trim();
}
