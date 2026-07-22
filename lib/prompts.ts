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
  chapterTargetWords: number;
  purpose?: string | null;
  readerTransformation?: string | null;
  recentSummaries: string[];
  chapterTitles: Array<{ chapterNumber: number; title: string }>;
};

type DraftPromptContext = ProjectPromptContext & {
  chapterNumber: number;
  chapterTitle: string;
  outlineBullets: string[];
  brief: ChapterBrief;
  chapterTargetWords: number;
  purpose?: string | null;
  readerTransformation?: string | null;
  sourceNeeds?: string[];
  outlineChapters: Array<{ chapterNumber: number; title: string }>;
  globalMemory: string;
  recentSummaries: string[];
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
Total book length: about ${input.targetWords} words
Chapter count: exactly ${input.totalChapters}

Generate a nonfiction book blueprint for this project.

Requirements:
- Produce exactly ${input.totalChapters} chapters, numbered 1..${input.totalChapters}.
- Each chapter needs a practical, specific title and 3 to 5 outline bullets.
- For each chapter also provide:
  - purpose: what the chapter exists to do.
  - readerTransformation: what the reader can do or understand afterward.
  - wordTarget: a weighted word budget for the chapter. Do NOT split the total
    evenly — give heavier chapters more words and lighter ones fewer. The
    wordTargets across all chapters should sum to roughly ${input.targetWords}.
  - dependsOn: chapter numbers this chapter relies on (empty if none).
  - sourceNeeds: any external facts/research the writer must supply (e.g.
    "current statistics on X"); empty if the chapter is purely conceptual.
- Keep the sequence cumulative so later chapters build on earlier ones.
- The summary should read like a sharp jacket summary for a serious nonfiction book.
- Avoid generic filler chapters like "Conclusion" unless it truly fits.
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
Chapter target length: about ${input.chapterTargetWords} words

Full chapter list:
${input.chapterTitles.map((chapter) => `- Chapter ${chapter.chapterNumber}: ${chapter.title}`).join("\n")}

Current chapter:
Chapter ${input.chapterNumber}: ${input.chapterTitle}
Chapter purpose: ${input.purpose || "Not specified"}
Reader transformation: ${input.readerTransformation || "Not specified"}

Approved outline bullets:
${formatList(input.outlineBullets)}

Recent chapter summaries:
${formatList(input.recentSummaries)}

Create a chapter brief for a nonfiction writer.

Requirements:
- Explain what the chapter must accomplish and where it sits in the arc.
- Propose clean subsection headings in a sensible order.
- Include concrete takeaways the reader should leave with.
- Add a transition note that connects from the previous chapter and sets up the next move.
- Keep the brief practical and specific to this project; do not repeat the premise verbatim.
`.trim();
}

export function buildDraftPrompt(input: DraftPromptContext) {
  const low = Math.round(input.chapterTargetWords * 0.85);
  const high = Math.round(input.chapterTargetWords * 1.15);

  return `
Book title: ${input.title}
Book summary: ${input.summary || "Not generated yet"}
Genre: ${input.genre}
Audience: ${input.audience}
Tone: ${input.tone}
Premise: ${input.premise}

Book outline (for orientation only — do not re-explain earlier chapters):
${input.outlineChapters.map((chapter) => `- Chapter ${chapter.chapterNumber}: ${chapter.title}`).join("\n")}

Current chapter:
Chapter ${input.chapterNumber}: ${input.chapterTitle}
Chapter purpose: ${input.purpose || "Not specified"}
Reader transformation: ${input.readerTransformation || "Not specified"}
Target length: ${input.chapterTargetWords} words (acceptable range ${low}–${high}).

Approved outline bullets:
${formatList(input.outlineBullets)}

Chapter brief:
${input.brief.brief}

Required sections (follow this order, one "## " heading each):
${formatList(input.brief.sections)}

Reader takeaways:
${formatList(input.brief.takeaways)}

Transition note:
${input.brief.transitionNote}

Sources the user must supply for this chapter:
${formatList(input.sourceNeeds ?? [])}

Compressed book memory (preserve terminology and consistency):
${input.globalMemory}

Most recent chapter summaries:
${formatList(input.recentSummaries)}

Style rules:
${JSON.stringify(input.styleRules || {}, null, 2)}

Write the full nonfiction chapter.

Output contract:
- Return the chapter body in Markdown. Use "## " for each required section, in
  the given order. Use "### " for sub-points and "-" for lists where useful.
- Do NOT restate the book premise or re-introduce material from earlier chapters;
  assume the reader has read them.
- Avoid generic openings ("In today's world…") and generic summaries. Open and
  close with substance specific to this chapter.
- Keep the body within ${low}–${high} words.
- Do NOT fabricate quotations, studies, statistics, citations, or named experts.
  If a point needs an external source, phrase it as a claim and add it to the
  memory "claims" list rather than inventing a citation.
- Clearly distinguish hypothetical illustrations from real, verifiable case studies.
- Preserve established terminology and locked definitions from book memory.

Also return structured memory for this chapter: a concise summary, the concepts
it introduces, key definitions, examples used, claims that need consistency or
user-provided sources, open threads it leaves, and its transition note.
`.trim();
}
