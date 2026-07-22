import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.1";

export type GenerationOperation = "outline" | "brief" | "draft";

// Each operation can use its own model; all fall back to OPENAI_MODEL.
const MODEL_ENV: Record<GenerationOperation, string> = {
  outline: "OPENAI_OUTLINE_MODEL",
  brief: "OPENAI_BRIEF_MODEL",
  draft: "OPENAI_DRAFT_MODEL",
};

export function modelForOperation(operation: GenerationOperation) {
  return process.env[MODEL_ENV[operation]] || OPENAI_MODEL;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8_000;

/** A user-safe error; the original cause is logged, never surfaced. */
export class GenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "GenerationError";
  }
}

let openaiClient: OpenAI | null = null;

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new GenerationError("OPENAI_API_KEY is not configured.");
  }
  if (!openaiClient) {
    // We manage retries ourselves, so disable the SDK's built-in retries.
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  }
  return openaiClient;
}

function isRetryable(error: unknown): boolean {
  // Bad output shape is a validation failure — retrying rarely helps and the
  // plan calls for not retrying it.
  if (error instanceof z.ZodError) return false;

  const status = (error as { status?: number })?.status;
  if (typeof status === "number") {
    // 408 request timeout, 409 lock, 429 rate limit, and any 5xx are transient.
    if (status === 408 || status === 409 || status === 429 || status >= 500) return true;
    // 400/401/403/404/422 (bad request, auth, model, validation) are not.
    return false;
  }

  // Network/timeout errors from the SDK have no HTTP status.
  const name = (error as { name?: string })?.name ?? "";
  const message = String((error as Error)?.message ?? "");
  return /Connection|Timeout|ECONNRESET|ETIMEDOUT|network/i.test(name + message);
}

function backoffDelay(attempt: number) {
  const ceiling = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt);
  // Full jitter across [ceiling/2, ceiling] to avoid synchronized retries.
  return ceiling / 2 + Math.random() * (ceiling / 2);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GenerationLog = {
  operation: GenerationOperation;
  model: string;
  attempt: number;
  success: boolean;
  latencyMs: number;
  requestId?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  willRetry?: boolean;
  error?: string;
};

function logGeneration(entry: GenerationLog) {
  // Structured, single-line log for observability / later cost tracking.
  console.log(`[generation] ${JSON.stringify(entry)}`);
}

type StructuredGenerationOptions<TSchema extends z.ZodTypeAny> = {
  operation: GenerationOperation;
  name: string;
  instructions: string;
  input: string;
  schema: TSchema;
  timeoutMs?: number;
};

/**
 * Calls the model for a structured (schema-validated) result with bounded
 * retries (transient failures only), exponential backoff with jitter, a request
 * timeout, and per-attempt observability logging. Throws a user-safe
 * GenerationError; the original cause is logged.
 */
export async function generateStructuredOutput<TSchema extends z.ZodTypeAny>({
  operation,
  name,
  instructions,
  input,
  schema,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: StructuredGenerationOptions<TSchema>): Promise<z.infer<TSchema>> {
  const openai = getOpenAIClient();
  const model = modelForOperation(operation);
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const start = Date.now();
    try {
      const response = await openai.responses.parse(
        {
          model,
          store: false,
          instructions,
          input,
          text: { format: zodTextFormat(schema, name) },
        },
        { timeout: timeoutMs },
      );

      if (!response.output_parsed) {
        throw new Error("The model returned no parsed output.");
      }

      const data = schema.parse(response.output_parsed);
      logGeneration({
        operation,
        model,
        attempt,
        success: true,
        latencyMs: Date.now() - start,
        requestId: response._request_id,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      });
      return data;
    } catch (error) {
      lastError = error;
      const retryable = isRetryable(error);
      const willRetry = retryable && attempt < MAX_ATTEMPTS - 1;
      logGeneration({
        operation,
        model,
        attempt,
        success: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
        willRetry,
      });
      if (!willRetry) break;
      await sleep(backoffDelay(attempt));
    }
  }

  throw new GenerationError(`The ${operation} request failed. Please try again.`, lastError);
}
