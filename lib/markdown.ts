export type InlineRun = { text: string; bold?: boolean; italic?: boolean };

export type MarkdownBlock =
  | { type: "heading"; level: number; runs: InlineRun[] }
  | { type: "paragraph"; runs: InlineRun[] }
  | { type: "bullet"; runs: InlineRun[] }
  | { type: "ordered"; number: number; runs: InlineRun[] };

/**
 * Parses a single line of inline Markdown into styled runs. Supports `**bold**`
 * / `__bold__` and `*italic*` / `_italic_`. Nesting is not supported (kept
 * simple and predictable for document export).
 */
export function parseInline(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const regex = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      runs.push({ text: text.slice(last, match.index) });
    }
    if (match[2] !== undefined) {
      runs.push({ text: match[2], bold: true });
    } else if (match[4] !== undefined) {
      runs.push({ text: match[4], italic: true });
    }
    last = regex.lastIndex;
  }

  if (last < text.length) {
    runs.push({ text: text.slice(last) });
  }
  if (runs.length === 0) {
    runs.push({ text: "" });
  }
  return runs;
}

/**
 * Parses Markdown text into a flat list of block descriptors (headings,
 * paragraphs, bullet items, ordered items). Blank lines separate paragraphs;
 * consecutive ordered items are numbered sequentially and restart after any
 * interruption.
 */
export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  let paragraph: string[] = [];
  let orderedCounter = 0;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      const text = paragraph.join(" ").trim();
      if (text) {
        blocks.push({ type: "paragraph", runs: parseInline(text) });
      }
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      orderedCounter = 0;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      orderedCounter = 0;
      blocks.push({ type: "heading", level: heading[1].length, runs: parseInline(heading[2].trim()) });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      orderedCounter = 0;
      blocks.push({ type: "bullet", runs: parseInline(bullet[1].trim()) });
      continue;
    }

    const ordered = /^(\d+)[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      orderedCounter += 1;
      blocks.push({ type: "ordered", number: orderedCounter, runs: parseInline(ordered[2].trim()) });
      continue;
    }

    orderedCounter = 0;
    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}
