import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API error shape used across all routes:
 *   { error: { code, message } }
 *
 * `code` is a stable machine-readable identifier; `message` is human-readable.
 */
export type ApiErrorCode =
  | "unauthorized"
  | "not_found"
  | "validation_error"
  | "invalid_json"
  | "conflict"
  | "invalid_state"
  | "server_error";

export function apiError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthorized(message = "You must be signed in.") {
  return apiError("unauthorized", message, 401);
}

export function notFound(message = "Not found.") {
  return apiError("not_found", message, 404);
}

export function conflict(message: string) {
  return apiError("conflict", message, 409);
}

export function invalidState(message: string) {
  return apiError("invalid_state", message, 422);
}

export function serverError(message = "Something went wrong.") {
  return apiError("server_error", message, 500);
}

export function validationError(error: ZodError) {
  const first = error.issues[0];
  const path = first?.path.join(".");
  const message = first
    ? `${path ? `${path}: ` : ""}${first.message}`
    : "Invalid request.";
  return NextResponse.json(
    {
      error: {
        code: "validation_error" as const,
        message,
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
    { status: 400 },
  );
}

/**
 * Parses a JSON request body. Returns `{ data }` on success or a ready-to-return
 * error response on failure so callers can `if ("response" in parsed) return ...`.
 */
export async function readJson(
  request: Request,
): Promise<{ data: unknown; response?: never } | { data?: never; response: NextResponse }> {
  try {
    return { data: await request.json() };
  } catch {
    return { response: apiError("invalid_json", "Request body must be valid JSON.", 400) };
  }
}
