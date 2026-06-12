/**
 * Decoder for `--from-web` payload from the web onboarding flow.
 *
 * Pure function — no I/O, no side effects. Tested independently so the
 * CLI command can stay an orchestrator.
 */

import type { InitAnswers } from "@loopkit/shared";

export interface WebPayload {
  product?: string;
  problem?: string;
  metric?: "revenue" | "users" | "shipped";
  // Optional extras the web flow might add in future
  icp?: string;
  whyUnsolved?: string;
  mvp?: string;
}

export interface DecodeResult {
  ok: boolean;
  answers: Partial<InitAnswers>;
  error?: string;
}

/**
 * Decode a base64-encoded JSON payload from the web onboarding flow.
 * Returns `{ ok: true, answers }` on success, `{ ok: false, error }` on failure.
 */
export function decodeWebPayload(encoded: string): DecodeResult {
  if (!encoded || typeof encoded !== "string") {
    return { ok: false, answers: {}, error: "Empty payload" };
  }
  try {
    const json = Buffer.from(encoded, "base64").toString("utf-8");
    const parsed = JSON.parse(json) as WebPayload;
    const answers: Partial<InitAnswers> = {};
    if (typeof parsed.product === "string" && parsed.product.trim()) {
      answers.name = parsed.product.trim();
    }
    if (typeof parsed.problem === "string" && parsed.problem.trim()) {
      answers.problem = parsed.problem.trim();
    }
    if (typeof parsed.icp === "string" && parsed.icp.trim()) {
      answers.icp = parsed.icp.trim();
    }
    if (typeof parsed.whyUnsolved === "string" && parsed.whyUnsolved.trim()) {
      answers.whyUnsolved = parsed.whyUnsolved.trim();
    }
    if (typeof parsed.mvp === "string" && parsed.mvp.trim()) {
      answers.mvp = parsed.mvp.trim();
    }
    return { ok: true, answers };
  } catch (err) {
    return {
      ok: false,
      answers: {},
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Build a slug from a product name. Mirrors slugify() in @loopkit/shared
 * but kept local so this helper has no dependency on the schema package
 * (useful in tests).
 */
export function slugFromProduct(product: string): string {
  return product
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
