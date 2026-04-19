const requiredClerkVariables = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

export const CLERK_SETUP_MESSAGE =
  "Authentication is not configured on this deployment yet. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable sign-in.";

export function hasClerkConfig() {
  return requiredClerkVariables.every((key) => Boolean(process.env[key]));
}
