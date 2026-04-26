import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { type ZodSchema } from "zod";
import { readConfig } from "../storage/local.js";

// ─── Provider Setup ─────────────────────────────────────────────

function getAnthropicClient() {
  const config = readConfig();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return null;
  }

  return createAnthropic({ apiKey });
}

function getLoopKitToken() {
  const config = readConfig();
  return config.auth?.apiKey;
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
  command: "init" | "ship" | "pulse" | "loop";
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
  const token = getLoopKitToken();

  if (!anthropic && !token) {
    throw new Error(
      "AI analysis requires authentication. Run `loopkit auth` or set ANTHROPIC_API_KEY."
    );
  }

  if (anthropic) {
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
  } else {
    // Proxy through LoopKit API
    const API_URL = process.env.LOOPKIT_API_URL || "http://localhost:3000";
    const res = await fetch(`${API_URL}/api/ai/${options.command}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        system,
        prompt,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate AI response from LoopKit servers.");
    }

    return data.result as T;
  }
}
