import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Anonymized aggregate benchmarks across all users ────────────

interface LogEntry {
  projectId: Id<"projects">;
  weekNumber: number;
  tasksCompleted: number;
  tasksTotal: number;
  shippingScore: number;
}

export const getBenchmarks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(12);

    if (logs.length === 0) {
      return { user: null, message: "Not enough data yet. Complete your first weekly loop to see benchmarks." };
    }

    // All logs across all projects (anonymized aggregation)
    const allLogs = await ctx.db.query("loopLogs").order("desc").take(500);

    const allCompletionRates = allLogs
      .filter((l) => l.tasksTotal > 0)
      .map((l) => Math.round((l.tasksCompleted / l.tasksTotal) * 100));

    const allScores = allLogs.map((l) => l.shippingScore);
    const allTasksCompleted = allLogs.map((l) => l.tasksCompleted);

    // Compute streaks per-project to avoid interleaving users' data
    const allStreaks = computeStreaksByProject(allLogs as LogEntry[]);

    // Latest user metrics
    const latest = logs[0];
    const userCompletionRate = latest.tasksTotal > 0
      ? Math.round((latest.tasksCompleted / latest.tasksTotal) * 100)
      : 0;

    // User averages over last 4 weeks
    const recent = logs.slice(0, 4);
    const avgTasksCompleted = recent.length > 0
      ? Math.round(recent.reduce((s, l) => s + l.tasksCompleted, 0) / recent.length)
      : 0;
    const avgScore = recent.length > 0
      ? Math.round(recent.reduce((s, l) => s + l.shippingScore, 0) / recent.length)
      : 0;

    // Current streak (from most recent backward)
    const userStreak = computeCurrentStreak(logs);

    return {
      user: {
        tasksCompletedWeekly: avgTasksCompleted,
        shippingScore: avgScore,
        completionRate: userCompletionRate,
        streak: userStreak,
        totalLoops: logs.length,
        trend: computeTrend(recent),
      },
      percentiles: {
        tasksCompleted: percentileOf(allTasksCompleted, avgTasksCompleted),
        shippingScore: percentileOf(allScores, avgScore),
        completionRate: percentileOf(allCompletionRates, userCompletionRate),
        streak: percentileOf(allStreaks, userStreak),
      },
      cohortSize: allLogs.length,
      hasEnoughData: allLogs.length >= 20,
    };
  },
});

export const getShareCard = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    const logs = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(4);

    if (logs.length === 0) return null;

    const avgScore = Math.round(logs.reduce((s, l) => s + l.shippingScore, 0) / logs.length);
    const avgTasks = Math.round(logs.reduce((s, l) => s + l.tasksCompleted, 0) / logs.length);
    const streak = computeCurrentStreak(logs);

    // Get aggregated score distribution for percentile
    const allLogs = await ctx.db.query("loopLogs").take(500);
    const allScores = allLogs.map((l) => l.shippingScore);

    return {
      projectName: project?.name || "Project",
      avgScore,
      avgTasks,
      streak,
      scorePercentile: percentileOf(allScores, avgScore),
      totalWeeks: logs.length,
      shareText: buildShareText(project?.name || "Project", avgScore, avgTasks, streak),
    };
  },
});

// ─── Percentile calculation ───────────────────────────────────────

function percentileOf(values: number[], target: number): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < target).length;
  return Math.round((below / sorted.length) * 100);
}

// ─── Streak computation (current, from most recent backward) ───────

function computeCurrentStreak(
  logs: Array<{ weekNumber: number }>
): number {
  if (logs.length === 0) return 0;

  // logs are sorted desc (most recent first)
  const sorted = [...logs].sort((a, b) => b.weekNumber - a.weekNumber);
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

// ─── Streaks grouped by project (avoids interleaving users) ───────

function computeStreaksByProject(
  allLogs: LogEntry[]
): number[] {
  if (allLogs.length === 0) return [];

  const byProject = new Map<Id<"projects">, Array<{ weekNumber: number }>>();
  for (const log of allLogs) {
    if (!byProject.has(log.projectId)) {
      byProject.set(log.projectId, []);
    }
    byProject.get(log.projectId)!.push(log);
  }

  const streaks: number[] = [];
  for (const [, projectLogs] of byProject) {
    const strek = computeCurrentStreak(projectLogs);
    if (strek > 0) {
      streaks.push(strek);
    }
  }

  return streaks;
}

// ─── Trend computation ────────────────────────────────────────────

function computeTrend(recent: Array<{ shippingScore: number }>): "up" | "down" | "flat" {
  if (recent.length < 2) return "flat";
  const first = recent[recent.length - 1].shippingScore;
  const last = recent[0].shippingScore;
  const diff = last - first;
  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "flat";
}

// ─── Share text builder ───────────────────────────────────────────

function buildShareText(projectName: string, score: number, tasks: number, streak: number): string {
  return [
    `🚀 ${projectName}`,
    `  Shipping Score: ${score}/100`,
    `  Weekly Tasks: ${tasks}`,
    `  ${streak}-Week Streak 🔥`,
    `  Built with @loopkit`,
  ].join("\n");
}

// ─── Founder Archetype Detection ─────────────────────────────────

export type Archetype = "Sprinter" | "Marathoner" | "Perfectionist" | "Reactor" | "All-Star";

export const getArchetype = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(12);

    if (logs.length < 4) {
      return null;
    }

    const sorted = [...logs].sort((a, b) => a.weekNumber - b.weekNumber);
    const scores = sorted.map((l) => l.shippingScore);
    const tasks = sorted.map((l) => l.tasksCompleted);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgTasks = tasks.reduce((a, b) => a + b, 0) / tasks.length;
    const scoreVariance = Math.max(...scores) - Math.min(...scores);
    const taskVariance = Math.max(...tasks) - Math.min(...tasks);

    let archetype: Archetype;
    let description: string;
    let emoji: string;

    if (avgScore >= 80 && scoreVariance <= 20 && taskVariance <= 4) {
      archetype = "All-Star";
      emoji = "🌟";
      description = "Rare profile — you maintain both high output and high consistency. You're in the top tier of solo founders.";
    } else if (avgScore >= 75 && avgTasks <= 3) {
      archetype = "Perfectionist";
      emoji = "🎯";
      description = "You complete what you start at a high level, but your volume is low. Consider shipping more often and iterating based on feedback.";
    } else if (sorted.length >= 4) {
      const firstTwo = sorted.slice(0, 2);
      const lastTwo = sorted.slice(-2);
      const firstAvg = firstTwo.reduce((a, b) => a + b.tasksCompleted, 0) / 2;
      const lastAvg = lastTwo.reduce((a, b) => a + b.tasksCompleted, 0) / 2;
      if (firstAvg > lastAvg * 1.5 && firstAvg >= 5) {
        archetype = "Sprinter";
        emoji = "⚡";
        description = "High initial energy that fades over time. You start fast but struggle with pacing. Try adding fewer tasks per week.";
      } else if (scores.every((s) => s >= 40) && scoreVariance <= 25) {
        archetype = "Marathoner";
        emoji = "🏃";
        description = "Steady, consistent, and reliable. You ship at a sustainable pace and rarely miss a week. This is the highest-retention founder profile.";
      } else {
        archetype = "Reactor";
        emoji = "🌊";
        description = "Your output varies significantly week to week. Building a regular rhythm will help smooth out the volatility.";
      }
    } else {
      archetype = "Reactor";
      emoji = "🌊";
      description = "Not enough data to determine your pattern yet. Keep tracking for more accurate insights.";
    }

    return {
      archetype,
      emoji,
      description,
      avgScore: Math.round(avgScore),
      avgTasks: Math.round(avgTasks),
      scoreVariance: Math.round(scoreVariance),
      taskVariance: Math.round(taskVariance),
      weeksAnalyzed: logs.length,
    };
  },
});
