import { readLoopLog, readLastNLoopLogs } from "../storage/local.js";

interface UserMetrics {
  avgTasksCompleted: number;
  avgScore: number;
  streak: number;
  totalWeeks: number;
  completionRate: number;
  projectType?: string;
}

interface BenchmarkResult {
  metrics: UserMetrics;
  percentiles: {
    tasksCompleted: number;
    shippingScore: number;
    completionRate: number;
    streak: number;
  };
  overallPercentile: number;
  comparison: string;
}

// Baseline percentiles from anonymized aggregate data
const BASELINE = {
  tasksCompleted: [0, 1, 2, 3, 5, 7, 10],
  shippingScore: [10, 25, 40, 55, 70, 85, 95],
  completionRate: [0, 20, 35, 50, 65, 80, 95],
  streak: [0, 1, 2, 3, 6, 10, 16],
};

function percentileOf(values: number[], target: number): number {
  if (values.length === 0) return 50;
  const below = values.filter((v) => v < target).length;
  return Math.round((below / values.length) * 100);
}

function computeUserMetrics(): UserMetrics | null {
  const logs = readLastNLoopLogs(12);
  if (logs.length === 0) return null;

  const weeks: Array<{ tasksCompleted: number; tasksTotal: number; shippingScore: number; weekNumber: number }> = [];

  for (const log of logs.slice(0, 12)) {
    const content = readLoopLog(log.weekNumber);
    if (!content) continue;

    const completedMatch = content.match(/- Tasks completed:\s*(\d+)/);
    const openMatch = content.match(/- Tasks open:\s*(\d+)/);
    const scoreMatch = content.match(/- Shipping score:\s*(\d+)%/);
    const weekMatch = content.match(/# Week (\d+)/);

    if (completedMatch && scoreMatch) {
      const completed = parseInt(completedMatch[1]);
      const open = openMatch ? parseInt(openMatch[1]) : 0;
      weeks.push({
        tasksCompleted: completed,
        tasksTotal: completed + open,
        shippingScore: parseInt(scoreMatch[1]),
        weekNumber: weekMatch ? parseInt(weekMatch[1]) : 0,
      });
    }
  }

  if (weeks.length === 0) return null;

  const avgTasks = weeks.reduce((s, w) => s + w.tasksCompleted, 0) / weeks.length;
  const avgScore = weeks.reduce((s, w) => s + w.shippingScore, 0) / weeks.length;

  let totalDone = 0;
  let totalAll = 0;
  for (const w of weeks) {
    totalDone += w.tasksCompleted;
    totalAll += w.tasksTotal;
  }
  const compRate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  // Current streak from most recent backward
  let streak = 0;
  const sorted = [...logs].sort((a, b) => b.weekNumber - a.weekNumber);
  if (sorted.length > 0) {
    streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].weekNumber === sorted[i - 1].weekNumber - 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  return {
    avgTasksCompleted: Math.round(avgTasks),
    avgScore: Math.round(avgScore),
    streak,
    totalWeeks: weeks.length,
    completionRate: compRate,
  };
}

export function computeBenchmarks(): BenchmarkResult | null {
  const metrics = computeUserMetrics();
  if (!metrics) return null;

  const percentiles = {
    tasksCompleted: percentileOf(BASELINE.tasksCompleted, metrics.avgTasksCompleted),
    shippingScore: percentileOf(BASELINE.shippingScore, metrics.avgScore),
    completionRate: percentileOf(BASELINE.completionRate, metrics.completionRate),
    streak: percentileOf(BASELINE.streak, metrics.streak),
  };

  const overall = Math.round(
    (percentiles.tasksCompleted + percentiles.shippingScore + percentiles.completionRate + percentiles.streak) / 4
  );

  return {
    metrics,
    percentiles,
    overallPercentile: overall,
    comparison: buildComparison(overall),
  };
}

function buildComparison(percentile: number): string {
  if (percentile >= 90) return "You're in the top 10% of founders — elite shipping consistency.";
  if (percentile >= 75) return "You ship faster than 75% of solo founders. Keep the momentum.";
  if (percentile >= 50) return "You're ahead of more than half of founders. Solid progress.";
  if (percentile >= 25) return "You're building the habit. Most founders don't make it this far.";
  return "You're just getting started — every founder was here once. Build the weekly ritual.";
}

export function renderBenchmarks(benchmarks: BenchmarkResult): string {
  const { metrics, percentiles, overallPercentile } = benchmarks;

  const lines = [
    `  Average tasks/week:  ${metrics.avgTasksCompleted}          ${formatPercentile(percentiles.tasksCompleted, "tasks")}`,
    `  Average score:        ${metrics.avgScore}/100              ${formatPercentile(percentiles.shippingScore, "score")}`,
    `  Completion rate:      ${metrics.completionRate}%               ${formatPercentile(percentiles.completionRate, "completion")}`,
    `  Weekly streak:        ${metrics.streak} weeks              ${formatPercentile(percentiles.streak, "streak")}`,
    "",
    `  Overall: ${overallPercentile}th percentile — ${benchmarks.comparison}`,
  ];

  return lines.join("\n");
}

function formatPercentile(p: number, context: string): string {
  if (p >= 90) return `Top 10%`;
  if (p >= 75) return `Top 25%`;
  if (p >= 50) return `Above avg`;
  if (p >= 25) return `Average`;
  return `Growing`;
}
