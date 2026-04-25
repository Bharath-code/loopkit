import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { type ZodSchema } from "zod";
import { readConfig } from "../storage/local.js";

// ─── Provider Setup ─────────────────────────────────────────────

function getAnthropicClient() {
  const config = readConfig();
  const apiKey = config.auth?.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI analysis requires an API key. Set ANTHROPIC_API_KEY or run `loopkit auth`."
    );
  }

  return createAnthropic({ apiKey });
}

// ─── Model Selection ────────────────────────────────────────────

export type ModelTier = "fast" | "creative";

function getModelId(tier: ModelTier): string {
  switch (tier) {
    case "fast":
      return "claude-sonnet-4-20250514";
    case "creative":
      return "claude-sonnet-4-20250514";
  }
}

// ─── Structured Generation ──────────────────────────────────────

export async function generateStructured<T>(options: {
  system: string;
  prompt: string;
  schema: ZodSchema<T>;
  tier?: ModelTier;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const {
    system,
    prompt,
    schema,
    tier = "fast",
    maxTokens = 1024,
    temperature = 0.3,
  } = options;

  const anthropic = getAnthropicClient();
  const modelId = getModelId(tier);

  const { object } = await generateObject({
    model: anthropic(modelId),
    schema,
    system,
    prompt,
    maxTokens,
    temperature,
  });

  return object;
}
