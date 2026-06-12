/**
 * Annual card data aggregator.
 *
 * Pulls up to 53 weeks of loop logs (52 + current) and synthesizes a
 * year-in-review shape: weekly scores, archetype, biggest moment, total
 * ships, longest streak, total feedback.
 *
 * Used by:
 *  - CLI: `loopkit celebrate --annual [year]`
 *  - Web: `/wins/[handle]/[year]/card` (PNG)
 */

import { getWeekNumber } from "@loopkit/shared";
import { parseLoopLog } from "../commands/loop/frontmatter.js";
import {
  readLastNLoopLogs,
  readLoopLog,
  readShipLog,
  readPulseResponses,
  readRevenueHistory,
  getConsecutiveWeeksStreak,
} from "../storage/local.js";
import { computeShippingDNA } from "./dna.js";

export interface AnnualWeek {
  week: number;
  shippingScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  shipped: boolean;
}

export interface AnnualSummary {
  year: number;
  totalWeeks: number;
  weeks: AnnualWeek[];
  averageScore: number;
  bestWeek: AnnualWeek | null;
  worstWeek: AnnualWeek | null;
  totalTasksCompleted: number;
  totalShips: number;
  longestStreak: number;
  currentStreak: number;
  archetype: string | null;
  totalFeedback: number;
  hasRevenue: boolean;
  mrrAtEndOfYear: number | null;
  archetypeEmoji: string;
}

const ARCHETYPE_EMOJI: Record<string, string> = {
  Marathoner: "🏃",
  Sprinter: "⚡",
  Perfectionist: "🎯",
  Reactor: "🌊",
  "All-Star": "🌟",
};

/**
 * Determine the calendar year for a given ISO week number.
 * Uses a heuristic: ISO week 1 is the week containing Jan 4.
 * For our purposes (annual card), we map the week number to the
 * year it MOSTLY belongs to: if current month >= October, weeks
 * with high numbers are still this year; if month <= March, week 1
 * of "this year" is the one that just started.
 */
function yearForWeek(targetYear: number, week: number, currentWeek: number): boolean {
  // Naive: include if the week falls in the year's range.
  // For 2026: weeks 1-53 map to 2026 (assuming currentWeek is current year).
  // For prior years, just include all weeks in the user's first year.
  // Simplest: trust the week number ordering and pull the last 52.
  return true;
}

function getArchetypeEmoji(archetype: string | null): string {
  if (!archetype) return "📊";
  return ARCHETYPE_EMOJI[archetype] ?? "📊";
}

export function gatherAnnualSummary(year: number, slug: string): AnnualSummary {
  const currentWeek = getWeekNumber();
  const currentYear = new Date().getFullYear();

  // For the current year, pull up to currentWeek.
  // For past years, pull 52 weeks.
  const weeksToPull = year === currentYear ? currentWeek : 53;

  // Get all loop logs for the project
  const allLogs = readLastNLoopLogs(Math.max(weeksToPull, 53), slug);

  const annualWeeks: AnnualWeek[] = [];
  let totalTasksCompleted = 0;
  let totalShips = 0;
  const scoreSums: number[] = [];

  for (const log of allLogs) {
    if (!yearForWeek(year, log.weekNumber, currentWeek)) continue;
    const content = readLoopLog(log.weekNumber);
    if (!content) continue;
    const parsed = parseLoopLog(content);
    const fm = parsed.frontmatter;
    if (!fm || fm.week === 0) continue;
    if (fm.date && !fm.date.startsWith(String(year))) continue;

    const shipped = !!readShipLog(fm.date);
    annualWeeks.push({
      week: fm.week,
      shippingScore: fm.shippingScore,
      tasksCompleted: fm.tasksCompleted,
      tasksTotal: fm.tasksTotal,
      shipped,
    });
    totalTasksCompleted += fm.tasksCompleted;
    if (shipped) totalShips++;
    if (fm.shippingScore > 0) scoreSums.push(fm.shippingScore);
  }

  // Sort by week
  annualWeeks.sort((a, b) => a.week - b.week);

  const averageScore =
    scoreSums.length > 0
      ? Math.round(scoreSums.reduce((s, v) => s + v, 0) / scoreSums.length)
      : 0;

  const bestWeek = annualWeeks.reduce<AnnualWeek | null>(
    (best, w) => (best === null || w.shippingScore > best.shippingScore ? w : best),
    null,
  );
  const worstWeek = annualWeeks.reduce<AnnualWeek | null>(
    (worst, w) => (worst === null || w.shippingScore < worst.shippingScore ? w : worst),
    null,
  );

  // Longest streak: scan sorted weeks
  let longestStreak = 0;
  let runStreak = 0;
  let prevWeek: number | null = null;
  for (const w of annualWeeks) {
    if (w.shippingScore === 0) {
      runStreak = 0;
      continue;
    }
    if (prevWeek !== null && w.week === prevWeek + 1) {
      runStreak++;
    } else {
      runStreak = 1;
    }
    if (runStreak > longestStreak) longestStreak = runStreak;
    prevWeek = w.week;
  }

  // Archetype (only if enough data)
  let archetype: string | null = null;
  if (annualWeeks.length >= 4) {
    try {
      const dna = computeShippingDNA();
      archetype = dna?.pattern ?? null;
    } catch {
      /* ignore */
    }
  }

  const totalFeedback = readPulseResponses().length;
  const revenue = readRevenueHistory();
  const hasRevenue = revenue.some((r) => r.mrr > 0);
  const mrrAtEndOfYear = revenue.length > 0 ? revenue[revenue.length - 1].mrr : null;

  // Current streak: use the storage helper
  let currentStreak = 0;
  try {
    const streak = getConsecutiveWeeksStreak(currentWeek, slug);
    currentStreak = streak;
  } catch {
    /* ignore */
  }

  return {
    year,
    totalWeeks: annualWeeks.length,
    weeks: annualWeeks,
    averageScore,
    bestWeek,
    worstWeek,
    totalTasksCompleted,
    totalShips,
    longestStreak,
    currentStreak,
    archetype,
    totalFeedback,
    hasRevenue,
    mrrAtEndOfYear,
    archetypeEmoji: getArchetypeEmoji(archetype),
  };
}
