import type { Chapter, ChapterStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const draftLockedStatuses: ChapterStatus[] = ["DRAFTED", "REVIEWED", "COMPLETE"];
const ownedProjectInclude = {
  chapters: {
    orderBy: {
      chapterNumber: "asc",
    },
  },
  memory: true,
} satisfies Prisma.BookProjectInclude;

export type OwnedProject = Prisma.BookProjectGetPayload<{
  include: typeof ownedProjectInclude;
}>;

export function isDraftLockedStatus(status: ChapterStatus) {
  return draftLockedStatuses.includes(status);
}

export function getHighestDraftedChapterNumber(
  chapters: Array<Pick<Chapter, "chapterNumber" | "status">>,
) {
  return chapters.reduce((highest, chapter) => {
    if (isDraftLockedStatus(chapter.status)) {
      return Math.max(highest, chapter.chapterNumber);
    }

    return highest;
  }, 0);
}

export function canGenerateForChapter(
  chapters: Array<Pick<Chapter, "chapterNumber" | "status">>,
  chapterNumber: number,
) {
  return chapters
    .filter((chapter) => chapter.chapterNumber < chapterNumber)
    .every((chapter) => isDraftLockedStatus(chapter.status));
}

export function getProjectStatusFromChapters(
  chapters: Array<Pick<Chapter, "status">>,
  hasOutline: boolean,
) {
  if (!hasOutline) {
    return "DRAFT";
  }

  if (chapters.length > 0 && chapters.every((chapter) => chapter.status === "COMPLETE")) {
    return "COMPLETE";
  }

  if (chapters.some((chapter) => isDraftLockedStatus(chapter.status))) {
    return "WRITING";
  }

  return "OUTLINE_READY";
}

export async function getOwnedProject(
  ownerId: string,
  projectId: string,
): Promise<OwnedProject | null> {
  return prisma.bookProject.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
    include: ownedProjectInclude,
  });
}

export async function syncProjectStatus(projectId: string) {
  const chapters = await prisma.chapter.findMany({
    where: {
      projectId,
    },
    select: {
      status: true,
    },
  });

  const status = getProjectStatusFromChapters(chapters, chapters.length > 0);

  return prisma.bookProject.update({
    where: {
      id: projectId,
    },
    data: {
      status,
    },
  });
}
