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

export const updateChapterSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(60000).optional(),
  summary: z.string().max(4000).optional(),
  status: chapterStatusSchema.optional(),
});

export const outlineResponseSchema = z.object({
  summary: z.string().trim().min(1),
  chapters: z.array(
    z.object({
      chapterNumber: z.number().int().positive(),
      title: z.string().trim().min(1),
      bullets: z.array(z.string().trim().min(1)).min(3).max(5),
    }),
  ),
});

export const briefResponseSchema = chapterBriefSchema;

export const draftResponseSchema = z.object({
  content: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  continuityNotes: z.string().trim().min(1),
});

export type ChapterBrief = z.infer<typeof chapterBriefSchema>;
export type OutlineResponse = z.infer<typeof outlineResponseSchema>;
export type BriefResponse = z.infer<typeof briefResponseSchema>;
export type DraftResponse = z.infer<typeof draftResponseSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type UpdateOutlineInput = z.infer<typeof updateOutlineSchema>;

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
