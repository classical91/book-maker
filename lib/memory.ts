import type { Prisma } from "@prisma/client";

export type KeyDefinition = { term: string; definition: string };

export type ChapterMemoryRecord = {
  chapterNumber: number;
  title: string;
  summary: string | null;
  introducedConcepts: string[];
  keyDefinitions: KeyDefinition[];
  examplesUsed: string[];
  claims: string[];
  openLoops: string[];
  transitionNote: string | null;
};

// How much prior context to carry forward — bounded so prompts never grow with
// the whole book.
const MAX_CONCEPTS = 40;
const MAX_DEFINITIONS = 30;
const RECENT_CHAPTERS_FOR_LOOPS = 3;
const MAX_OPEN_LOOPS = 15;
const MAX_CLAIMS = 15;
const RECENT_SUMMARY_COUNT = 2;

function toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

function toDefinitions(value: Prisma.JsonValue | null | undefined): KeyDefinition[] {
  if (!Array.isArray(value)) return [];
  const result: KeyDefinition[] = [];
  for (const item of value) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const term = "term" in item ? String((item as Record<string, unknown>).term ?? "") : "";
      const definition =
        "definition" in item ? String((item as Record<string, unknown>).definition ?? "") : "";
      if (term.trim() && definition.trim()) {
        result.push({ term: term.trim(), definition: definition.trim() });
      }
    }
  }
  return result;
}

type MemoryFields = {
  summary: string | null;
  introducedConcepts: Prisma.JsonValue | null;
  keyDefinitions: Prisma.JsonValue | null;
  examplesUsed: Prisma.JsonValue | null;
  claims: Prisma.JsonValue | null;
  openLoops: Prisma.JsonValue | null;
  transitionNote: string | null;
};

/** Builds a normalized record from a chapter and its (optional) memory row. */
export function toChapterMemoryRecord(
  chapter: { chapterNumber: number; title: string; summary: string | null },
  memory: MemoryFields | null | undefined,
): ChapterMemoryRecord {
  return {
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    summary: memory?.summary ?? chapter.summary ?? null,
    introducedConcepts: toStringArray(memory?.introducedConcepts),
    keyDefinitions: toDefinitions(memory?.keyDefinitions),
    examplesUsed: toStringArray(memory?.examplesUsed),
    claims: toStringArray(memory?.claims),
    openLoops: toStringArray(memory?.openLoops),
    transitionNote: memory?.transitionNote ?? null,
  };
}

function dedupe(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
    if (result.length >= limit) break;
  }
  return result;
}

/**
 * Compressed, bounded global memory built from the records of chapters that come
 * before `currentChapterNumber`. Deduplicates concepts and definitions across
 * the book and keeps open loops/claims from only the most recent chapters.
 */
export function buildGlobalMemory(
  records: ChapterMemoryRecord[],
  currentChapterNumber: number,
): string {
  const prior = records
    .filter((record) => record.chapterNumber < currentChapterNumber)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  if (prior.length === 0) {
    return "This is the first chapter with prior context. No earlier material to preserve yet.";
  }

  const concepts = dedupe(
    prior.flatMap((record) => record.introducedConcepts),
    MAX_CONCEPTS,
  );

  const definitionMap = new Map<string, string>();
  for (const record of prior) {
    for (const def of record.keyDefinitions) {
      definitionMap.set(def.term, def.definition); // later chapters win
    }
  }
  const definitions = Array.from(definitionMap.entries()).slice(-MAX_DEFINITIONS);

  const recent = prior.slice(-RECENT_CHAPTERS_FOR_LOOPS);
  const openLoops = dedupe(
    recent.flatMap((record) => record.openLoops),
    MAX_OPEN_LOOPS,
  );
  const claims = dedupe(
    recent.flatMap((record) => record.claims),
    MAX_CLAIMS,
  );

  const sections: string[] = [];
  if (concepts.length) {
    sections.push(`Established concepts:\n${concepts.map((c) => `- ${c}`).join("\n")}`);
  }
  if (definitions.length) {
    sections.push(
      `Locked definitions (use consistently):\n${definitions
        .map(([term, definition]) => `- ${term}: ${definition}`)
        .join("\n")}`,
    );
  }
  if (openLoops.length) {
    sections.push(`Open threads to honor or resolve:\n${openLoops.map((l) => `- ${l}`).join("\n")}`);
  }
  if (claims.length) {
    sections.push(
      `Claims that must stay consistent:\n${claims.map((c) => `- ${c}`).join("\n")}`,
    );
  }

  return sections.length ? sections.join("\n\n") : "No structured memory captured yet.";
}

/** The most recent chapter summaries (full text), oldest-first. */
export function recentChapterSummaries(
  records: ChapterMemoryRecord[],
  currentChapterNumber: number,
  count = RECENT_SUMMARY_COUNT,
): string[] {
  return records
    .filter((record) => record.chapterNumber < currentChapterNumber && record.summary?.trim())
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .slice(-count)
    .map((record) => `Chapter ${record.chapterNumber} — ${record.title}: ${record.summary}`);
}
