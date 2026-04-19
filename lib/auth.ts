import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { CLERK_SETUP_MESSAGE, hasClerkConfig } from "@/lib/runtime-config";

export async function getOptionalUserId() {
  if (!hasClerkConfig()) {
    return null;
  }

  const { userId } = await auth();
  return userId;
}

export async function requireUserId() {
  return getOptionalUserId();
}

export async function requireUserIdOrRedirect() {
  const userId = await getOptionalUserId();

  if (!userId) {
    redirect(hasClerkConfig() ? "/sign-in" : "/");
  }

  return userId;
}

export function unauthorizedJson(message = "You must be signed in.") {
  if (!hasClerkConfig()) {
    return NextResponse.json({ error: CLERK_SETUP_MESSAGE }, { status: 503 });
  }

  return NextResponse.json({ error: message }, { status: 401 });
}
