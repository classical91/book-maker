const requiredClerkVariables = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

export const CLERK_SETUP_MESSAGE =
  "Authentication is not configured on this deployment yet. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable sign-in.";

const CLERK_REQUIRED_MESSAGE =
  "APP_MODE=multi_user requires Clerk. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.";

const MISCONFIGURED_MESSAGE =
  "Authentication is not configured. Set Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY) for multi-user mode, " +
  "or explicitly set APP_MODE=single_user (with SINGLE_USER_ID) for a single-user deployment.";

// Default owner id for single-user mode. Kept as "jason" so existing single-user
// deployments keep ownership of their previously created books.
const DEFAULT_SINGLE_USER_ID = "jason";

export type AppMode = "single_user" | "multi_user";

export function hasClerkConfig() {
  return requiredClerkVariables.every((key) => Boolean(process.env[key]));
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Resolves how the app authenticates requests.
 *
 * - `single_user`: every request is attributed to `SINGLE_USER_ID`. Only allowed
 *   when explicitly opted into, or in non-production when Clerk is absent.
 * - `multi_user`: requests are authenticated with Clerk.
 *
 * When `APP_MODE` is unset the mode is inferred: multi-user if Clerk is
 * configured, single-user in development, and otherwise a hard configuration
 * error in production. This makes production fail closed rather than silently
 * sharing one account across everyone.
 */
export function getAppMode(): AppMode {
  const raw = process.env.APP_MODE?.trim().toLowerCase();

  if (raw === "single_user") {
    return "single_user";
  }

  if (raw === "multi_user") {
    if (!hasClerkConfig()) {
      throw new Error(CLERK_REQUIRED_MESSAGE);
    }
    return "multi_user";
  }

  if (raw) {
    throw new Error(
      `Invalid APP_MODE "${process.env.APP_MODE}". Expected "single_user" or "multi_user".`,
    );
  }

  // APP_MODE unset: infer from the environment.
  if (hasClerkConfig()) {
    return "multi_user";
  }

  if (isProduction()) {
    throw new Error(MISCONFIGURED_MESSAGE);
  }

  return "single_user";
}

export function isSingleUserMode() {
  return getAppMode() === "single_user";
}

export function getSingleUserId() {
  return process.env.SINGLE_USER_ID?.trim() || DEFAULT_SINGLE_USER_ID;
}
