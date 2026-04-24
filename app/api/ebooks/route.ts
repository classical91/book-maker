import { NextResponse } from "next/server";

import { requireUserId, unauthorizedJson } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  const ebooks = await prisma.ebook.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ ebooks });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedJson();

  try {
    const { title } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const ebook = await prisma.ebook.create({
      data: { ownerId: userId, title: title.trim() },
    });

    return NextResponse.json({ ebook }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create e-book." }, { status: 400 });
  }
}
