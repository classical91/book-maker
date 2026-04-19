import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/schemas";

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedJson();
  }

  const projects = await prisma.bookProject.findMany({
    where: {
      ownerId: userId,
    },
    include: {
      chapters: {
        orderBy: {
          chapterNumber: "asc",
        },
      },
      memory: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedJson();
  }

  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const project = await prisma.bookProject.create({
      data: {
        ownerId: userId,
        ...data,
        memory: {
          create: {
            keyTerms: [data.title, data.genre, data.audience],
            styleRules: {
              nonfiction: true,
              tone: data.tone,
              audience: data.audience,
              genre: data.genre,
            },
            continuityNotes: "",
          },
        },
      },
      include: {
        chapters: true,
        memory: true,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not create the project.",
      },
      { status: 400 },
    );
  }
}
