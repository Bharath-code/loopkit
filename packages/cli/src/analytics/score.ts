/**
 * LoopKit Score™ — GF-1
 *
 * A single 0–100 vanity metric that combines:
 *   - Shipping score (0–100)    → base score
 *   - Streak multiplier (1–1.5) → consistency bonus (5% per week, max 50%)
 *   - Feedback bonus (0–20)     → engagement bonus (2 pts per response, max 20)
 *
 * Formula:
 *   base      = shippingScore (0–100)
 *   streakMul = min(1 + streak × 0.05, 1.5)
 *   fbBonus   = min(feedbackResponses × 2, 20)
 *   score     = clamp(round(base × streakMul + fbBonus), 0, 100)
 *
 * Returns null when there is insufficient data (< 1 completed loop log).
 */

import { getWeekNumber } from "@loopkit/shared";
import {
  readLastNLoopLogs,
  readLoopLog,
  readPulseResponses,
  getConsecutiveWeeksStreak,
} from "../storage/local.js";
import { colors } from "../ui/theme.js";

// ─── Types ───────────────────────────────────────────────────────

export interface LoopKitScoreBreakdown {
  /** Final clamped score 0–100 */
  score: number;
  /** Raw shipping score used as base (0–100) */
  shippingScore: number;
  /** Multiplier from streak (1.0–1.5) */
  streakMultiplier: number;
  /** Bonus points from feedback responses (0–20) */
  feedbackBonus: number;
  /** Current streak in weeks */
  streak: number;
  /** Number of feedback responses counted */
  feedbackResponses: number;
}

// ─── Core Computation ────────────────────────────────────────────

/**
 * Compute the LoopKit Score for the active project.
 * Returns null if there is no loop log data yet (not enough history).
 */
export function computeLoopKitScore(): LoopKitScoreBreakdown | null {
  const weekNum = getWeekNumber();

  // Need at least 1 loop log to compute a meaningful score
  const logs = readLastNLoopLogs(10);
  if (logs.length === 0) return null;

  // ── Shipping score: parse from most recent loop log ────────────
  const shippingScore = getMostRecentShippingScore(logs.map((l) => l.weekNumber));
  if (shippingScore === null) return null;

  // ── Streak multiplier ──────────────────────────────────────────
  // pastStreak = consecutive weeks BEFORE current week with a loop log
  const pastStreak = getConsecutiveWeeksStreak(weekNum);
  const currentStreak = pastStreak + (logs.some((l) => l.weekNumber === weekNum) ? 1 : 0);
  const streakMultiplier = Math.min(1 + currentStreak * 0.05, 1.5);

  // ── Feedback bonus ─────────────────────────────────────────────
  const feedbackResponses = readPulseResponses().length;
  const feedbackBonus = Math.min(feedbackResponses * 2, 20);

  // ── Final score ────────────────────────────────────────────────
  const raw = shippingScore * streakMultiplier + feedbackBonus;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    shippingScore,
    streakMultiplier,
    feedbackBonus,
    streak: currentStreak,
    feedbackResponses,
  };
}

/**
 * Parse the most recent shipping score from loop log files.
 */
function getMostRecentShippingScore(weekNumbers: number[]): number | null {
  // Sort descending — check most recent first
  const sorted = [...weekNumbers].sort((a, b) => b - a);
  for (const weekNumber of sorted) {
    const content = readLoopLog(weekNumber);
    const score = parseShippingScore(content);
    if (score !== null) return score;
  }
  return null;
}

function parseShippingScore(content: string | null): number | null {
  if (!content) return null;
  // Handles both "Shipping score: 75%" and "**Shipping Score:** 75%"
  const match =
    content.match(/[Ss]hipping score:\s*(\d+)%/i) ||
    content.match(/\*\*Shipping Score:\*\*\s*(\d+)%/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  return Number.isNaN(val) ? null : Math.max(0, Math.min(100, val));
}

// ─── Read previous score from loop logs ──────────────────────────

/**
 * Read the LoopKit Score from a specific week's log.
 * Returns null if the log doesn't exist or has no score.
 */
export function readLoopKitScoreFromLog(weekNumber: number): number | null {
  const content = readLoopLog(weekNumber);
  if (!content) return null;
  const match = content.match(/\*\*LoopKit Score:\*\*\s*(\d+)/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  return Number.isNaN(val) ? null : val;
}

/**
 * Read the last N LoopKit Scores from loop logs (for trend visualization).
 */
export function readLastNLoopKitScores(n: number): Array<{ week: number; score: number }> {
  const logs = readLastNLoopLogs(n);
  const result: Array<{ week: number; score: number }> = [];
  for (const log of logs) {
    const score = readLoopKitScoreFromLog(log.weekNumber);
    if (score !== null) {
      result.push({ week: log.weekNumber, score });
    }
  }
  return result.sort((a, b) => a.week - b.week);
}

// ─── Rendering ───────────────────────────────────────────────────

/**
 * Render the LoopKit Score line for terminal display.
 * Shows delta vs previous week if available.
 */
export function renderLoopKitScore(
  breakdown: LoopKitScoreBreakdown,
  previousScore?: number | null,
): string {
  const { score } = breakdown;

  // Score color: green ≥ 70, yellow ≥ 40, red < 40
  const scoreColor =
    score >= 70 ? colors.success : score >= 40 ? colors.warning : colors.danger;

  // Delta arrow
  let deltaStr = "";
  if (previousScore != null) {
    const delta = score - previousScore;
    if (delta > 0) {
      deltaStr = colors.success(` ↑+${delta}`);
    } else if (delta < 0) {
      deltaStr = colors.danger(` ↓${delta}`);
    } else {
      deltaStr = colors.muted(" →same");
    }
  }

  return (
    `  ${colors.secondary("◆")} LoopKit Score: ` +
    `${scoreColor.bold(`${score}/100`)}${deltaStr}` +
    colors.muted(
      ` (ship:${breakdown.shippingScore}% × ${breakdown.streakMultiplier.toFixed(2)} + fb:${breakdown.feedbackBonus})`
    )
  );
}

/**
 * One-liner score for embedding in cards (e.g. Proof Card, share text).
 */
export function formatLoopKitScoreShort(score: number): string {
  return `${score}/100`;
}
