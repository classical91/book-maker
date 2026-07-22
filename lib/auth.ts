import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { getSingleUserId, isSingleUserMode } from "@/lib/runtime-config";

export async function getOptionalUserId() {
  if (isSingleUserMode()) {
    return getSingleUserId();
  }
  const { userId } = await auth();
  return userId;
}

export async function requireUserId() {
  if (isSingleUserMode()) {
    return getSingleUserId();
  }
  const { userId } = await auth();
  return userId;
}

export async function requireUserIdOrRedirect() {
  if (isSingleUserMode()) {
    return getSingleUserId();
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
