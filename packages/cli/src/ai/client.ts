import { createAnthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { type ZodSchema } from "zod";
import { readConfig, writeConfig } from "../storage/local.js";
import { getCachedResult, setCachedResult } from "../storage/cache.js";
import { colors, confirm, text, isCancel, clog } from "../ui/theme.js";

interface ResolvedAuth {
  anthropicKey: string | null;
  token: string | null;
}

function resolveAuth(): ResolvedAuth {
  const config = readConfig();
  return {
    anthropicKey: process.env.ANTHROPIC_API_KEY || config.anthropicKey || null,
    token: config.auth?.apiKey || null,
  };
}

// ─── Model Selection ────────────────────────────────────────────

export type ModelTier = "fast" | "creative";

function getModelId(tier: ModelTier): string {
  switch (tier) {
    case "fast":
      return "claude-3-5-haiku-latest";
    case "creative":
      return "claude-sonnet-4-20250514";
  }
}

// ─── Structured Generation ──────────────────────────────────────

export async function generateStructured<T extends object>(options: {
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

  const { anthropicKey, token } = resolveAuth();

  if (!anthropicKey && !token) {
    throw new Error(
      "AI analysis requires authentication. Run `loopkit auth` or set ANTHROPIC_API_KEY."
    );
  }

  const schemaName = schema._def?.description || schema.constructor?.name || "unknown";

  const cached = getCachedResult<T>(options.command, system, prompt, schemaName);
  if (cached) {
    return cached;
  }

  let result: T;

  if (anthropicKey) {
    const anthropic = createAnthropic({ apiKey: anthropicKey });
    const modelId = getModelId(tier);

    const { partialObjectStream, object } = streamObject({
      model: anthropic(modelId),
      schema,
      system,
      prompt,
      maxTokens,
      temperature,
    });

    let keyCount = 0;
    for await (const partial of partialObjectStream) {
      if (!partial) continue;
      const keys = Object.keys(partial as object).length;
      if (keys > keyCount) {
        keyCount = keys;
        process.stdout.write(keyCount === 1 ? "  ↳ receiving..." : `  ↳ ${keyCount} fields parsed\r`);
      }
    }

    result = await object;
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

    if (res.status === 401) {
      throw new Error("Your session has expired. Please run `loopkit auth` to log in again.");
    }

    if (res.status === 402 || res.status === 403) {
      clog.warn("⚠️  Hosted AI requires a Solo/Pro subscription.");
      clog.message("You can upgrade your plan or Bring Your Own Key (BYOK) for free.\n");

      const useByok = await confirm({
        message: "Would you like to configure your local Anthropic API Key?",
        active: "Yes, enter key",
        inactive: "No, cancel",
      });

      if (!isCancel(useByok) && useByok) {
        const apiKey = await text({
          message: "Enter your Anthropic API Key (starts with sk-ant-):",
          placeholder: "sk-ant-...",
          validate: (val) => {
            if (!val.startsWith("sk-ant-")) {
              return "Invalid key format. Key must start with 'sk-ant-'.";
            }
            if (val.length < 20) {
              return "API key seems too short.";
            }
            return undefined;
          },
        });

        if (!isCancel(apiKey) && apiKey) {
          const config = readConfig();
          config.anthropicKey = apiKey;
          writeConfig(config);
          clog.success("API key saved securely. Retrying request...\n");

          return generateStructured(options);
        }
      }
      
      throw new Error("Hosted AI is disabled on the free tier. Please upgrade or provide a local API key.");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate AI response from LoopKit servers.");
    }

    result = data.result as T;
  }

  setCachedResult(options.command, system, prompt, schemaName, result);
  return result;
}
