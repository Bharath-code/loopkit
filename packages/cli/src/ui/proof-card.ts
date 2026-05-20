/**
 * Proof Card — GF-2
 *
 * Generates a beautiful terminal-boxed weekly summary card
 * that is tweet-ready and auto-copied to clipboard.
 *
 * Pure function — takes data, returns formatted string.
 * No side effects, no file reads.
 */

import { token, sym } from "./tokens.js";
import { box, progressBar, kvList, streakMini } from "./layout.js";

// ─── Types ───────────────────────────────────────────────────────

export interface ProofCardData {
  /** Product / project name */
  productName: string;
  /** ISO week number */
  weekNum: number;
  /** Shipping score 0–100 */
  shippingScore: number;
  /** Tasks completed this week */
  tasksCompleted: number;
  /** Total tasks planned this week */
  tasksTotal: number;
  /** Consecutive week streak */
  streak: number;
  /** Last N weeks of shipping history (true = shipped) */
  streakHistory?: boolean[];
  /** Number of pulse feedback responses */
  feedbackResponses: number;
  /** LoopKit Score 0–100 (null if not enough data yet) */
  loopkitScore: number | null;
  /** The one thing for next week */
  oneThing: string;
  /** MRR in user's currency (null if no revenue logged) */
  mrr: number | null;
  /** Currency code, e.g. "USD" */
  currency?: string;
}

// ─── Card Builder ─────────────────────────────────────────────────

/**
 * Build the full terminal-boxed Proof Card using design system primitives.
 */
export function buildProofCard(data: ProofCardData): string {
  const lines: string[] = [];

  // Title
  lines.push(
    `${sym.rocket} ${token.heading(data.productName)}  ${token.dim(`Week ${data.weekNum}`)}`,
  );
  lines.push("");

  // Task progress bar
  if (data.tasksTotal > 0) {
    lines.push(progressBar(data.tasksCompleted, data.tasksTotal));
  } else {
    lines.push(token.dim("No tasks tracked this week"));
  }
  lines.push("");

  // Core stats as aligned kv pairs
  const pairs: Array<[string, string]> = [
    ["Shipped", `${data.shippingScore}%`],
  ];

  if (data.loopkitScore !== null) {
    pairs.push(["Score", `${data.loopkitScore}/100`]);
  }

  if (data.streak >= 1) {
    const streakStr = `${data.streak} week${data.streak !== 1 ? "s" : ""}`;
    pairs.push([
      "Streak",
      data.streak >= 4
        ? token.energy(`${sym.fire} ${streakStr}`)
        : token.success(streakStr),
    ]);
  }

  if (data.feedbackResponses > 0) {
    pairs.push([
      "Feedback",
      `${data.feedbackResponses} response${data.feedbackResponses !== 1 ? "s" : ""}`,
    ]);
  }

  if (data.mrr !== null && data.mrr > 0) {
    pairs.push(["MRR", token.successBold(formatMrr(data.mrr, data.currency ?? "USD"))]);
  }

  lines.push(kvList(pairs, ""));
  lines.push("");

  // Streak history mini-bar
  if (data.streakHistory && data.streakHistory.length > 0) {
    lines.push(
      `${token.dim(`Last ${data.streakHistory.length}w`)}  ${streakMini(data.streakHistory)}`,
    );
    lines.push("");
  }

  // Next week bet
  lines.push(`${token.muted("Next:")} ${token.body(data.oneThing)}`);
  lines.push("");
  lines.push(token.dim("Built with LoopKit · loopkit.dev"));

  return box(lines.join("\n"), `${sym.loop} Proof Card`, "success");
}

/**
 * Build the compact single-line tweet summary (≤ 280 chars).
 */
export function buildTweetLine(data: ProofCardData): string {
  const parts: string[] = [`Week ${data.weekNum}: shipped ${data.shippingScore}%`];

  if (data.streak >= 2) parts.push(`${data.streak}-week streak 🔥`);
  if (data.loopkitScore !== null) parts.push(`LoopKit Score: ${data.loopkitScore}/100`);
  if (data.mrr !== null && data.mrr > 0) {
    parts.push(`MRR: ${formatMrr(data.mrr, data.currency ?? "USD")}`);
  }
  parts.push("@loopkit");

  const line = parts.join(" · ");
  return line.length > 280 ? line.slice(0, 277) + "…" : line;
}

// ─── Clipboard ───────────────────────────────────────────────────

/**
 * Copy text to macOS clipboard via pbcopy.
 * Silently fails on non-macOS or when pbcopy is unavailable.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (process.platform !== "darwin") return false;
  try {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("pbcopy", [], { input: text, encoding: "utf-8" });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

// ─── Social Sharing ──────────────────────────────────────────────

export function buildTwitterIntentUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function openUrl(url: string): Promise<boolean> {
  try {
    const { spawnSync } = await import("node:child_process");
    const cmd =
      process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start"
      : "xdg-open";
    const result = spawnSync(cmd, [url], { stdio: "ignore" });
    return !result.error;
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatMrr(mrr: number, currency: string): string {
  try {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(mrr) + "/mo"
    );
  } catch {
    return `${currency} ${mrr}/mo`;
  }
}
