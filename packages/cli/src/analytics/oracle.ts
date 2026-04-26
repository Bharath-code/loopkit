import { readTasksFile, listProjects } from "../storage/local.js";

interface SnoozeStats {
  totalSnoozed: number;
  completedAfterSnooze: number;
  neverCompleted: number;
  stillSnoozed: number;
  completionRate: number;
  averageSnoozeCount: number;
  mostSnoozedCategory: string;
  summary: string;
}

function parseAllTasks(): Array<{
  title: string;
  done: boolean;
  snoozedUntil?: string;
  hadSnoozed: boolean;
}> {
  const projects = listProjects();
  const all: Array<{
    title: string;
    done: boolean;
    snoozedUntil?: string;
    hadSnoozed: boolean;
  }> = [];

  for (const slug of projects) {
    const content = readTasksFile(slug);
    if (!content) continue;

    let currentSection = "";
    const lines = content.split("\n");

    for (const line of lines) {
      if (/##\s*this\s*week/i.test(line)) {
        currentSection = "week";
        continue;
      }
      if (/##\s*backlog/i.test(line)) {
        currentSection = "backlog";
        continue;
      }

      const match = line.match(/^-\s*\[([ x])\]\s*(?:#\d+\s)?(.+?)(?:\s*—\s*(.+))?$/);
      if (match) {
        const done = match[1] === "x";
        const title = match[2].trim();
        const meta = match[3] || "";
        const snoozedUntil = meta.match(/snoozed:(\d{4}-\d{2}-\d{2})/)?.[1];

        all.push({
          title,
          done,
          snoozedUntil,
          hadSnoozed: meta.includes("snoozed:"),
        });
      }
    }
  }

  return all;
}

export function computeSnoozeStats(): SnoozeStats {
  const tasks = parseAllTasks();
  const today = new Date().toISOString().split("T")[0];

  const snoozedTasks = tasks.filter((t) => t.hadSnoozed);
  const completedAfterSnooze = snoozedTasks.filter((t) => t.done);
  // snooze expired (past date or no date) and still not done = never completed
  const neverCompleted = snoozedTasks.filter(
    (t) => !t.done && (!t.snoozedUntil || t.snoozedUntil < today)
  );
  // snooze date is in the future and not done = still snoozed
  const stillSnoozed = snoozedTasks.filter(
    (t) => !t.done && t.snoozedUntil && t.snoozedUntil >= today
  );

  if (snoozedTasks.length === 0) {
    return {
      totalSnoozed: 0,
      completedAfterSnooze: 0,
      neverCompleted: 0,
      stillSnoozed: 0,
      completionRate: 0,
      averageSnoozeCount: 0,
      mostSnoozedCategory: "none",
      summary: "No historical data yet. Track a few weeks to unlock snooze predictions.",
    };
  }

  const completionRate = Math.round((completedAfterSnooze.length / snoozedTasks.length) * 100);
  const neverRate = Math.round((neverCompleted.length / snoozedTasks.length) * 100);

  const snoozeCounts = new Map<string, number>();
  for (const t of snoozedTasks) {
    const count = snoozeCounts.get(t.title) || 0;
    snoozeCounts.set(t.title, count + 1);
  }
  const totalSnoozes = [...snoozeCounts.values()].reduce((s, c) => s + c, 0);
  const avgSnooze = snoozeCounts.size > 0
    ? Math.round((totalSnoozes / snoozeCounts.size) * 10) / 10
    : 0;
  const maxSnooze = [...snoozeCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  let summary: string;
  if (neverRate >= 60) {
    summary = `${neverRate}% of snoozed tasks are never completed. Only snooze things that genuinely need time — not things you're avoiding.`;
  } else if (completionRate >= 50) {
    summary = `${completionRate}% of your snoozed tasks eventually get done. Snoozing isn't avoidance — it's prioritization.`;
  } else {
    summary = `${neverRate}% of snoozed tasks go unfinished. Consider cutting instead of snoozing.`;
  }

  return {
    totalSnoozed: snoozedTasks.length,
    completedAfterSnooze: completedAfterSnooze.length,
    neverCompleted: neverCompleted.length,
    stillSnoozed: stillSnoozed.length,
    completionRate,
    averageSnoozeCount: avgSnooze,
    mostSnoozedCategory: maxSnooze ? maxSnooze[0] : "none",
    summary,
  };
}

let _cachedSnoozeStats: SnoozeStats | null = null;

export function getSnoozeWarning(): string | null {
  // Cache within a single track command invocation (stale tasks loop)
  if (!_cachedSnoozeStats) {
    _cachedSnoozeStats = computeSnoozeStats();
  }
  const stats = _cachedSnoozeStats;

  if (stats.totalSnoozed < 3) return null;

  const neverRate = Math.round((stats.neverCompleted / stats.totalSnoozed) * 100);

  if (neverRate >= 67) {
    return `${neverRate}% of your snoozed tasks were never completed. This one might join them.`;
  }

  if (stats.neverCompleted > stats.completedAfterSnooze) {
    return `More snoozed tasks go unfinished than finished (${stats.completedAfterSnooze}/${stats.neverCompleted + stats.completedAfterSnooze} completed). Consider cutting instead.`;
  }

  return null;
}
