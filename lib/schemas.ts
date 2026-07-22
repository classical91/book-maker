import { ChapterStatus, ProjectStatus, Prisma } from "@prisma/client";
import { z } from "zod";

export const chapterStatusSchema = z.nativeEnum(ChapterStatus);
export const projectStatusSchema = z.nativeEnum(ProjectStatus);

export const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(140),
  genre: z.string().trim().min(2).max(80),
  audience: z.string().trim().min(2).max(120),
  tone: z.string().trim().min(2).max(120),
  premise: z.string().trim().min(20).max(5000),
  targetWords: z.coerce.number().int().min(3000).max(150000),
  totalChapters: z.coerce.number().int().min(3).max(20),
});

export const updateProjectSchema = createProjectSchema.partial();

export const outlineChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  bullets: z.array(z.string().trim().min(1).max(280)).min(1).max(7),
});

export const updateOutlineSchema = z.object({
  summary: z.string().trim().min(20).max(5000),
  chapters: z.array(outlineChapterSchema).min(1),
});

export const chapterBriefSchema = z.object({
  brief: z.string().trim().min(1),
  sections: z.array(z.string().trim().min(1)).min(3).max(8),
  takeaways: z.array(z.string().trim().min(1)).min(2).max(5),
  transitionNote: z.string().trim().min(1),
});

// Shared upper bound so generated output and editor updates agree on limits.
export const MAX_CHAPTER_CONTENT = 60000;
export const MAX_EBOOK_CONTENT = 500000;

export const updateChapterSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(MAX_CHAPTER_CONTENT).optional(),
  summary: z.string().max(4000).optional(),
  status: chapterStatusSchema.optional(),
  // Optimistic concurrency: the `updatedAt` the client last observed.
  expectedUpdatedAt: z.coerce.date().optional(),
});

export const createEbookSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const updateEbookSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(MAX_EBOOK_CONTENT).optional(),
  // Optimistic concurrency: the `updatedAt` the client last observed.
  expectedUpdatedAt: z.coerce.date().optional(),
});

export const outlineResponseSchema = z.object({
  summary: z.string().trim().min(1),
  chapters: z.array(
    z.object({
      chapterNumber: z.number().int().positive(),
      title: z.string().trim().min(1),
      bullets: z.array(z.string().trim().min(1)).min(3).max(5),
      purpose: z.string().trim().min(1),
      readerTransformation: z.string().trim().min(1),
      wordTarget: z.number().int().positive(),
      dependsOn: z.array(z.number().int().positive()).max(20),
      sourceNeeds: z.array(z.string().trim().min(1)).max(10),
    }),
  ),
});

export const briefResponseSchema = chapterBriefSchema;

// Structured continuity a chapter draft contributes to book memory. Regenerating
// a chapter replaces its record rather than appending, keeping memory accurate.
export const chapterMemorySchema = z.object({
  summary: z.string().trim().min(1),
  introducedConcepts: z.array(z.string().trim().min(1)).max(15),
  keyDefinitions: z
    .array(
      z.object({
        term: z.string().trim().min(1),
        definition: z.string().trim().min(1),
      }),
    )
    .max(15),
  examplesUsed: z.array(z.string().trim().min(1)).max(15),
  claims: z.array(z.string().trim().min(1)).max(15),
  openLoops: z.array(z.string().trim().min(1)).max(15),
  transitionNote: z.string().trim().min(1),
});

export const draftResponseSchema = z.object({
  content: z.string().trim().min(1),
  memory: chapterMemorySchema,
});

// Per-chapter planning data captured on the outline chapter's `plan` JSON field.
export const chapterPlanSchema = z.object({
  purpose: z.string(),
  readerTransformation: z.string(),
  dependsOn: z.array(z.number().int().positive()),
  sourceNeeds: z.array(z.string()),
});

export type ChapterBrief = z.infer<typeof chapterBriefSchema>;
export type OutlineResponse = z.infer<typeof outlineResponseSchema>;
export type BriefResponse = z.infer<typeof briefResponseSchema>;
export type DraftResponse = z.infer<typeof draftResponseSchema>;
export type ChapterMemoryData = z.infer<typeof chapterMemorySchema>;
export type ChapterPlan = z.infer<typeof chapterPlanSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type UpdateOutlineInput = z.infer<typeof updateOutlineSchema>;
export type CreateEbookInput = z.infer<typeof createEbookSchema>;
export type UpdateEbookInput = z.infer<typeof updateEbookSchema>;

export function parseOutlineBullets(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
}

export function parseChapterBrief(value: Prisma.JsonValue | null): ChapterBrief | null {
  if (!value) {
    return null;
  }

  const parsed = chapterBriefSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
