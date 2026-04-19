import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import ProjectSidebar from "@/components/project-sidebar";
import { requireUserIdOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const userId = await requireUserIdOrRedirect();
  const { projectId } = await params;

  const project = await prisma.bookProject.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      totalChapters: true,
      chapters: {
        orderBy: {
          chapterNumber: "asc",
        },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          status: true,
          wordCount: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[320px_1fr]">
      <ProjectSidebar
        projectId={project.id}
        projectTitle={project.title}
        projectStatus={project.status}
        totalChapters={project.totalChapters}
        chapters={project.chapters}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
