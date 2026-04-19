import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.1";

let openaiClient: OpenAI | null = null;

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

type StructuredGenerationOptions<TSchema extends z.ZodTypeAny> = {
  name: string;
  instructions: string;
  input: string;
  schema: TSchema;
};

export async function generateStructuredOutput<TSchema extends z.ZodTypeAny>({
  name,
  instructions,
  input,
  schema,
}: StructuredGenerationOptions<TSchema>): Promise<z.infer<TSchema>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const openai = getOpenAIClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await openai.responses.parse({
        model: OPENAI_MODEL,
        store: false,
        instructions,
        input,
        text: {
          format: zodTextFormat(schema, name),
        },
      });

      if (!response.output_parsed) {
        throw new Error("The model returned no parsed output.");
      }

      return schema.parse(response.output_parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
