import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { readJson, serverError, unauthorized, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createEbookSchema } from "@/lib/schemas";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const ebooks = await prisma.ebook.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ ebooks });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (body.response) return body.response;

  const parsed = createEbookSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const ebook = await prisma.ebook.create({
      data: { ownerId: userId, title: parsed.data.title },
    });
    return NextResponse.json({ ebook }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("Could not create e-book.");
  }
}
