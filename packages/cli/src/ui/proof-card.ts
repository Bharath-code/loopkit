/**
 * Proof Card — GF-2
 *
 * Generates a beautiful terminal-boxed weekly summary card
 * that is tweet-ready and auto-copied to clipboard.
 *
 * Pure function — takes data, returns formatted string.
 * No side effects, no file reads.
 */

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
 * Build the full terminal-boxed Proof Card.
 * Returns the multi-line box string (with ANSI codes for terminal).
 */
export function buildProofCard(data: ProofCardData): string {
  const lines: string[] = [];

  // Title row
  lines.push(`🚀 ${data.productName} — Week ${data.weekNum}`);
  lines.push("");

  // Shipping
  const taskRatio =
    data.tasksTotal > 0
      ? `${data.tasksCompleted}/${data.tasksTotal} tasks`
      : "No tasks tracked";
  lines.push(`  ✅ Shipped: ${taskRatio} (${data.shippingScore}%)`);

  // LoopKit Score (omit gracefully if not enough data)
  if (data.loopkitScore !== null) {
    lines.push(`  📊 LoopKit Score: ${data.loopkitScore}/100`);
  }

  // Streak
  if (data.streak >= 1) {
    const streakEmoji = data.streak >= 4 ? "🔥" : "📅";
    lines.push(`  ${streakEmoji} Streak: ${data.streak} consecutive week${data.streak !== 1 ? "s" : ""}`);
  }

  // Feedback
  if (data.feedbackResponses > 0) {
    lines.push(`  💬 Feedback: ${data.feedbackResponses} response${data.feedbackResponses !== 1 ? "s" : ""} collected`);
  }

  // Revenue (only when logged)
  if (data.mrr !== null && data.mrr > 0) {
    const currency = data.currency ?? "USD";
    lines.push(`  💰 MRR: ${formatMrr(data.mrr, currency)}`);
  }

  lines.push("");
  lines.push(`  Next: ${data.oneThing}`);
  lines.push("");
  lines.push("  Built with LoopKit · loopkit.dev");

  return lines.join("\n");
}

/**
 * Build the compact single-line tweet summary (≤ 280 chars).
 * Used as the "paste and tweet" version.
 */
export function buildTweetLine(data: ProofCardData): string {
  const parts: string[] = [
    `Week ${data.weekNum}: shipped ${data.shippingScore}%`,
  ];

  if (data.streak >= 2) parts.push(`${data.streak}-week streak 🔥`);
  if (data.loopkitScore !== null) parts.push(`LoopKit Score: ${data.loopkitScore}/100`);
  if (data.mrr !== null && data.mrr > 0) {
    parts.push(`MRR: ${formatMrr(data.mrr, data.currency ?? "USD")}`);
  }

  parts.push("@loopkit");

  const line = parts.join(" · ");
  // Hard-truncate at 280 with ellipsis if needed
  return line.length > 280 ? line.slice(0, 277) + "…" : line;
}

// ─── Clipboard ───────────────────────────────────────────────────

/**
 * Copy text to macOS clipboard via pbcopy.
 * Silently fails on non-macOS or when pbcopy is unavailable.
 * Returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (process.platform !== "darwin") return false;
  try {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("pbcopy", [], {
      input: text,
      encoding: "utf-8",
    });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatMrr(mrr: number, currency: string): string {
  // Use Intl.NumberFormat for currency formatting
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(mrr) + "/mo";
  } catch {
    // Fallback for unknown currency codes
    return `${currency} ${mrr}/mo`;
  }
}
