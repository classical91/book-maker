import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function requireUserId() {
  const { userId } = await auth();
  return userId;
}

export async function requireUserIdOrRedirect() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

export function unauthorizedJson(message = "You must be signed in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
