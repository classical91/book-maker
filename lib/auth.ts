import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { hasClerkConfig } from "@/lib/runtime-config";

// When Clerk is not configured, use a hardcoded owner ID (single-user mode)
const DEFAULT_USER_ID = "jason";

export async function getOptionalUserId() {
  if (!hasClerkConfig()) {
    return DEFAULT_USER_ID;
  }
  const { userId } = await auth();
  return userId;
}

export async function requireUserId() {
  if (!hasClerkConfig()) {
    return DEFAULT_USER_ID;
  }
  const { userId } = await auth();
  return userId;
}

export async function requireUserIdOrRedirect() {
  if (!hasClerkConfig()) {
    return DEFAULT_USER_ID;
  }
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}

export function unauthorizedJson(message = "You must be signed in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
