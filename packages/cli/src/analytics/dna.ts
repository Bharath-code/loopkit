import { readLastNLoopLogs, readLoopLog } from "../storage/local.js";

export interface ShippingDNA {
  pattern: "Marathoner" | "Sprinter" | "Perfectionist" | "Reactor" | "All-Star";
  patternDescription: string;
  velocityTrend: "accelerating" | "steady" | "declining" | "volatile";
  avgTasksCompleted: number;
  avgScore: number;
  peakDay: string;
  completionStyle: "finisher" | "starter" | "balancer";
  totalWeeks: number;
  streak: number;
  riskWarnings: string[];
  strengths: string[];
}

interface WeekData {
  weekNumber: number;
  tasksCompleted: number;
  tasksTotal: number;
  shippingScore: number;
  date: string;
}

function parseLoopLogMarkdown(content: string): Partial<WeekData> {
  const tasksMatch = content.match(/- Tasks completed:\s*(\d+)/);
  const tasksTotalMatch = content.match(/- Tasks open:\s*(\d+)/);
  const scoreMatch = content.match(/- Shipping score:\s*(\d+)%/);
  const dateMatch = content.match(/Week \d+ — (\d{4}-\d{2}-\d{2})/);
  const weekMatch = content.match(/# Week (\d+)/);

  return {
    weekNumber: weekMatch ? parseInt(weekMatch[1]) : 0,
    tasksCompleted: tasksMatch ? parseInt(tasksMatch[1]) : 0,
    tasksTotal: tasksTotalMatch ? parseInt(tasksTotalMatch[1]) : 0,
    shippingScore: scoreMatch ? parseInt(scoreMatch[1]) : 0,
    date: dateMatch ? dateMatch[1] : "",
  };
}

export function computeShippingDNA(): ShippingDNA | null {
  // Need at least 4 weeks of data
  const logs = readLastNLoopLogs(12);
  if (logs.length < 4) return null;

  const weeks: WeekData[] = [];
  for (const log of logs.slice(0, 12)) {
    const content = readLoopLog(log.weekNumber);
    if (content) {
      const data = parseLoopLogMarkdown(content);
      if (data.weekNumber > 0) {
        weeks.push({
          weekNumber: data.weekNumber,
          tasksCompleted: data.tasksCompleted,
          tasksTotal: data.tasksCompleted + data.tasksTotal + (data.tasksCompleted || 0),
          shippingScore: data.shippingScore,
          date: data.date,
        });
        // Fix: tasksTotal from markdown is just open tasks, add completed for real total
        weeks[weeks.length - 1].tasksTotal = data.tasksTotal || 0;
      }
    }
  }

  // Recompute total tasks correctly
  for (const w of weeks) {
    const content = readLoopLog(w.weekNumber);
    if (content) {
      const completed = content.match(/- Tasks completed:\s*(\d+)/);
      const open = content.match(/- Tasks open:\s*(\d+)/);
      if (completed && open) {
        w.tasksTotal = parseInt(completed[1]) + parseInt(open[1]);
        w.tasksCompleted = parseInt(completed[1]);
      }
    }
  }

  if (weeks.length < 4) return null;

  // Recent 8 weeks for pattern analysis
  const recent = weeks.slice(0, 8);
  const currentWeeks = weeks.length;

  // Averages
  const avgTasks = Math.round(recent.reduce((s, w) => s + w.tasksCompleted, 0) / recent.length);
  const avgScore = Math.round(recent.reduce((s, w) => s + w.shippingScore, 0) / recent.length);

  // Velocity trend
  const velocityTrend = computeVelocity(weeks);

  // Pattern detection
  const pattern = detectPattern(weeks, avgTasks);

  // Peak day detection based on ship logs
  const peakDay = "Not enough ship data"; // would need ship log dates

  // Completion style
  const completionStyle = detectCompletionStyle(weeks);

  // Streak
  const streak = computeStreak(logs);

  // Risk warnings
  const riskWarnings = detectRisks(weeks, avgScore, avgTasks);

  // Strengths
  const strengths = detectStrengths(weeks, avgScore, avgTasks, pattern);

  return {
    pattern,
    patternDescription: getPatternDescription(pattern),
    velocityTrend,
    avgTasksCompleted: avgTasks,
    avgScore,
    peakDay,
    completionStyle,
    totalWeeks: currentWeeks,
    streak,
    riskWarnings,
    strengths,
  };
}

function computeVelocity(weeks: WeekData[]): ShippingDNA["velocityTrend"] {
  if (weeks.length < 2) return "steady";
  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  const firstAvg = firstHalf.reduce((s, w) => s + w.tasksCompleted, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, w) => s + w.tasksCompleted, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;

  if (diff > 2) return "accelerating";
  if (diff < -2) return "declining";

  // Check for volatility
  const variations = sorted.map((w) => w.tasksCompleted);
  const maxVar = Math.max(...variations) - Math.min(...variations);
  if (maxVar > 6) return "volatile";

  return "steady";
}

function detectPattern(
  weeks: WeekData[],
  avgTasks: number
): ShippingDNA["pattern"] {
  if (weeks.length < 4) return "Reactor";

  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const scores = sorted.map((w) => w.shippingScore);
  const tasks = sorted.map((w) => w.tasksCompleted);

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const scoreVariance = Math.max(...scores) - Math.min(...scores);
  const taskVariance = Math.max(...tasks) - Math.min(...tasks);

  // All-Star: high and consistent
  if (avgScore >= 80 && scoreVariance <= 20 && taskVariance <= 4) {
    return "All-Star";
  }

  // Perfectionist: high score but low volume
  if (avgScore >= 75 && avgTasks <= 3) {
    return "Perfectionist";
  }

  // Sprinter: starts high, drops
  if (sorted.length >= 4) {
    const firstTwo = sorted.slice(0, 2);
    const lastTwo = sorted.slice(-2);
    const firstAvg = firstTwo.reduce((a, b) => a + b.tasksCompleted, 0) / 2;
    const lastAvg = lastTwo.reduce((a, b) => a + b.tasksCompleted, 0) / 2;
    if (firstAvg > lastAvg * 1.5 && firstAvg >= 5) {
      return "Sprinter";
    }
  }

  // Marathoner: consistent across weeks
  if (scores.every((s) => s >= 40) && scoreVariance <= 25) {
    return "Marathoner";
  }

  return "Reactor";
}

function detectCompletionStyle(weeks: WeekData[]): ShippingDNA["completionStyle"] {
  if (weeks.length < 2) return "starter";

  let completes = 0;
  let partials = 0;

  for (const w of weeks) {
    if (w.tasksTotal === 0) continue;
    const rate = w.tasksCompleted / w.tasksTotal;
    if (rate >= 0.8) completes++;
    else if (rate < 0.4) partials++;
  }

  const compRate = completes / weeks.length;
  const partRate = partials / weeks.length;

  if (compRate >= 0.6) return "finisher";
  if (partRate >= 0.6) return "starter";
  return "balancer";
}

function computeStreak(logs: Array<{ weekNumber: number; overridden: boolean }>): number {
  // Sort descending (newest first), count until first gap = current streak
  const sorted = [...logs].sort((a, b) => b.weekNumber - a.weekNumber);
  if (sorted.length === 0) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].weekNumber === sorted[i - 1].weekNumber - 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function detectRisks(
  weeks: WeekData[],
  avgScore: number,
  avgTasks: number
): string[] {
  const warnings: string[] = [];

  if (avgScore < 30) {
    warnings.push("Very low shipping score — may need to reduce scope or re-evaluate the brief.");
  }

  if (avgTasks < 2) {
    warnings.push("Average less than 2 tasks per week — consider micro-tasks to build momentum.");
  }

  if (weeks.length >= 3) {
    // weeks is most-recent-first; reverse to oldest-first for trend check
    const last3 = [...weeks.slice(0, 3)].reverse();
    const declining = last3.every(
      (w, i) => i === 0 || w.shippingScore < (last3[i - 1].shippingScore || 0)
    );
    if (declining) {
      warnings.push("Shipping score declining for 3+ consecutive weeks — check for burnout or scope creep.");
    }
  }

  const skippedWeeks = findSkippedWeeks(weeks);
  if (skippedWeeks > 1) {
    warnings.push(`${skippedWeeks} skipped weeks — consistency is the strongest predictor of success.`);
  }

  return warnings;
}

function findSkippedWeeks(weeks: WeekData[]): number {
  if (weeks.length < 2) return 0;
  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  let skipped = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].weekNumber - sorted[i - 1].weekNumber > 1) {
      skipped += sorted[i].weekNumber - sorted[i - 1].weekNumber - 1;
    }
  }
  return skipped;
}

function detectStrengths(
  weeks: WeekData[],
  avgScore: number,
  avgTasks: number,
  pattern: ShippingDNA["pattern"]
): string[] {
  const strengths: string[] = [];

  if (pattern === "Marathoner" || pattern === "All-Star") {
    strengths.push("Strong weekly consistency — you show up every week and that's the #1 success predictor.");
  }

  if (avgScore >= 70) {
    strengths.push("High shipping score — you finish what you start.");
  }

  if (avgTasks >= 5) {
    strengths.push("High output — you're shipping at a professional founder's pace.");
  }

  if (pattern === "Perfectionist" && avgScore >= 80) {
    strengths.push("Quality over quantity — your completion rate is excellent.");
  }

  if (weeks.length >= 8) {
    strengths.push(`${weeks.length} weeks tracked — you've built a real shipping habit.`);
  }

  if (strengths.length === 0) {
    strengths.push("You're showing up — momentum builds through consistency. Keep going.");
  }

  return strengths;
}

function getPatternDescription(pattern: ShippingDNA["pattern"]): string {
  switch (pattern) {
    case "Marathoner":
      return "Steady, consistent, and reliable. You ship at a sustainable pace and rarely miss a week. This is the highest-retention founder profile.";
    case "Sprinter":
      return "High initial energy that fades over time. You start fast but struggle with pacing. Try adding fewer tasks and focusing on one thing per week.";
    case "Perfectionist":
      return "You complete what you start at a high level, but your volume is low. Consider shipping more often and iterating based on feedback.";
    case "Reactor":
      return "Your output varies significantly week to week. Building a regular rhythm will help smooth out the volatility.";
    case "All-Star":
      return "Rare to see — you maintain both high output and high consistency. You're in the top 8% of founders.";
  }
}
