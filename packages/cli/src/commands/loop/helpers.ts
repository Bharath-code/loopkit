/**
 * Loop pipeline — pure helpers.
 *
 * Extracted from commands/loop.ts to make the orchestrator maintainable.
 * No side effects beyond reading local files. All UI is in render.ts.
 */

import { readLastNLoopLogs, readLoopLog, readPulseResponses } from "../../storage/local.js";

export interface LoopProof {
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  weeksActive: number;
  decisionsMade: number;
  feedbackResponses: number;
  feedbackActedOn: boolean;
}

/**
 * Parse a shipping score from a loop log's content.
 * Accepts both "Shipping score: 75%" and "**Shipping Score:** 75%".
 * Returns null if no match.
 */
export function parseShippingScore(content: string | null): number | null {
  if (!content) return null;
  const match =
    content.match(/Shipping score:\s*(\d+)%/i) ||
    content.match(/\*\*Shipping Score:\*\*\s*(\d+)%/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * Walk through prior week logs in descending order and return the first
 * non-null shipping score. Returns 0 if none found.
 */
export function findPreviousScore(weekNumbers: number[]): number {
  for (const weekNumber of [...weekNumbers].sort((a, b) => b - a)) {
    const log = readLoopLog(weekNumber);
    const score = parseShippingScore(log);
    if (score !== null) return score;
  }
  return 0;
}

/**
 * Heuristic: did this week's tasks actually act on user feedback?
 * Looks for feedback-related keywords in task text. Crude but useful
 * until we have explicit task→feedback linking.
 */
export function didActOnFeedback(tasksText: string, feedbackResponses: number): boolean {
  if (feedbackResponses === 0) return false;
  return /\b(feedback|pulse|user|customer|fix|onboarding|response)\b/.test(
    tasksText.toLowerCase(),
  );
}

/**
 * Compute the proof card for the current week.
 * - previousScore: most recent prior loop log's shipping score
 * - weeksActive: number of prior loops + 1
 * - feedbackActedOn: heuristic over this week's task text
 */
export function computeLoopProof({
  slug,
  weekNum,
  shippingScore,
  tasksCompleted,
  tasksOpen,
}: {
  slug: string;
  weekNum: number;
  shippingScore: number;
  tasksCompleted: string[];
  tasksOpen: string[];
}): LoopProof {
  const previousLogs = readLastNLoopLogs(100, slug).filter(
    (log) => log.weekNumber !== weekNum,
  );
  const previousScore = findPreviousScore(previousLogs.map((log) => log.weekNumber));
  const feedbackResponses = readPulseResponses().length;
  const taskText = [...tasksCompleted, ...tasksOpen].join(" ");
  const feedbackActedOn = didActOnFeedback(taskText, feedbackResponses);

  return {
    previousScore,
    currentScore: shippingScore,
    scoreDelta: shippingScore - previousScore,
    weeksActive: previousLogs.length + 1,
    decisionsMade: previousLogs.length + 1,
    feedbackResponses,
    feedbackActedOn,
  };
}

/**
 * Format a score delta with a leading + for positive numbers.
 */
export function formatScoreDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * Detect if override rate is high (≥2 overrides in last 4 weeks).
 * Returns the override count, or null if not enough history.
 */
export function detectHighOverrideRate(slug: string, window = 4, threshold = 2): {
  overrideCount: number;
  window: number;
  threshold: number;
} | null {
  const logs = readLastNLoopLogs(window, slug);
  if (logs.length < window) return null;

  const overrideCount = logs.filter((l) => l.overridden).length;
  if (overrideCount < threshold) return null;

  return { overrideCount, window, threshold };
}
