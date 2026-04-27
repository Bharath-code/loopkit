import { readLastNLoopLogs, readLoopLog, readTasksFile, readPulseResponses } from "../storage/local.js";
import { getWeekNumber } from "@loopkit/shared";

export interface Pattern {
  type: "overplanner" | "snooze_loop" | "ship_avoider" | "icp_drift" | "scope_creep";
  severity: "warning" | "critical";
  message: string;
  suggestions: string[];
  weeksObserved: number;
}

export interface PatternResult {
  patterns: Pattern[];
  totalWeeks: number;
}

interface WeekData {
  weekNumber: number;
  tasksCompleted: number;
  tasksOpen: number;
  shippingScore: number;
  shipped: boolean;
  overridden: boolean;
  pulseFixNow: boolean;
  content: string;
}

function parseLoopLog(weekNum: number, slug: string): WeekData | null {
  const content = readLoopLog(weekNum);
  if (!content) return null;

  // Filter by project slug to avoid cross-contamination
  const hasProjectRef = content.includes("project:");
  if (hasProjectRef && !content.includes(`project:${slug}`)) {
    return null;
  }

  const tasksCompletedMatch = content.match(/- Tasks completed:\s*(\d+)/);
  const tasksOpenMatch = content.match(/- Tasks open:\s*(\d+)/);
  const scoreMatch = content.match(/- Shipping score:\s*(\d+)%/);
  const shippedMatch = content.match(/- Shipped Friday:\s*(Yes|No)/);
  const overridden = content.includes("_Override:");
  const pulseFixNow = /fix now|fixnow/i.test(content) && content.includes("Pulse");

  return {
    weekNumber: weekNum,
    tasksCompleted: tasksCompletedMatch ? parseInt(tasksCompletedMatch[1]) : 0,
    tasksOpen: tasksOpenMatch ? parseInt(tasksOpenMatch[1]) : 0,
    shippingScore: scoreMatch ? parseInt(scoreMatch[1]) : 0,
    shipped: shippedMatch ? shippedMatch[1] === "Yes" : false,
    overridden,
    pulseFixNow,
    content,
  };
}

function getRecentWeeks(n: number, slug: string): WeekData[] {
  const currentWeek = getWeekNumber();
  const weeks: WeekData[] = [];
  for (let i = 0; i < n; i++) {
    const data = parseLoopLog(currentWeek - i, slug);
    if (data) weeks.push(data);
  }
  return weeks;
}

// ─── Pattern Detectors ──────────────────────────────────────────

function detectOverplanner(weeks: WeekData[]): Pattern | null {
  if (weeks.length < 3) return null;

  let overplanCount = 0;
  let totalCompletionRate = 0;
  let overplanWeeks = 0;

  for (const w of weeks) {
    const total = w.tasksCompleted + w.tasksOpen;
    const rate = total > 0 ? w.tasksCompleted / total : 0;
    if (total >= 8 && rate <= 0.3) {
      overplanCount++;
      totalCompletionRate += rate;
      overplanWeeks++;
    }
  }

  if (overplanCount >= 3) {
    const avgRate = overplanWeeks > 0
      ? Math.round((totalCompletionRate / overplanWeeks) * 100)
      : 0;

    return {
      type: "overplanner",
      severity: overplanCount >= 4 ? "critical" : "warning",
      message: `You plan 8+ tasks but finish ~${avgRate}% of them.`,
      suggestions: [
        "Plan 3 must-do tasks per week. Everything else goes to backlog.",
        "If a task has been open 2+ weeks, cut it or ship it.",
      ],
      weeksObserved: overplanCount,
    };
  }
  return null;
}

function detectSnoozeLoop(weeks: WeekData[], slug: string): Pattern | null {
  if (weeks.length < 3) return null;

  // Check current tasks for snoozed items
  const tasksContent = readTasksFile(slug);
  const hasSnoozedNow = tasksContent ? /snooze|⏸|postponed|later/i.test(tasksContent) : false;

  // Check loop logs for low completion (snoozing = not completing)
  let lowCompletionWeeks = 0;
  for (const w of weeks) {
    const total = w.tasksCompleted + w.tasksOpen;
    if (total > 0 && w.tasksCompleted / total <= 0.3) lowCompletionWeeks++;
  }

  if (hasSnoozedNow && lowCompletionWeeks >= 3) {
    return {
      type: "snooze_loop",
      severity: lowCompletionWeeks >= 4 ? "critical" : "warning",
      message: "You keep snoozing or leaving tasks open. Same tasks reappear week after week.",
      suggestions: [
        "Batch 'annoying' tasks on Monday morning. Don't let them survive Tuesday.",
        "If a task is snoozed 2+ times, cut it permanently.",
      ],
      weeksObserved: lowCompletionWeeks,
    };
  }
  return null;
}

function detectShipAvoider(weeks: WeekData[]): Pattern | null {
  if (weeks.length < 3) return null;

  const noShipWeeks = weeks.filter((w) => !w.shipped && w.shippingScore <= 40);
  if (noShipWeeks.length >= 3) {
    return {
      type: "ship_avoider",
      severity: noShipWeeks.length >= 4 ? "critical" : "warning",
      message: `You haven't shipped in ${noShipWeeks.length} weeks. Building without shipping is just inventory.`,
      suggestions: [
        "Next week's #1 priority: ship anything, even if it's imperfect.",
        "Set a Friday 4pm 'ship alarm'. No exceptions.",
      ],
      weeksObserved: noShipWeeks.length,
    };
  }
  return null;
}

function detectICPDrift(weeks: WeekData[]): Pattern | null {
  if (weeks.length < 3) return null;

  // Check for declining score + pulse fix-now mentions
  const scores = weeks.map((w) => w.shippingScore).filter((s) => s > 0);
  const hasDecline = scores.length >= 3 && scores[0] < scores[1] && scores[1] < scores[2];
  const fixNowWeeks = weeks.filter((w) => w.pulseFixNow).length;

  if (hasDecline && fixNowWeeks >= 2) {
    return {
      type: "icp_drift",
      severity: fixNowWeeks >= 3 ? "critical" : "warning",
      message: "Feedback says you're solving the wrong problem, and your score is dropping.",
      suggestions: [
        "Run `loopkit init --analyze` to re-examine your ICP and riskiest assumption.",
        "Talk to 3 users this week. Ask what they actually paid for last month.",
      ],
      weeksObserved: fixNowWeeks,
    };
  }

  // Also detect from raw pulse responses if available
  const pulses = readPulseResponses();
  const recentPulses = pulses.slice(-10);
  const offTrackSignals = recentPulses.filter((p) =>
    /wrong|doesn.t need|not useful|confusing|don.t understand|not for me/i.test(p)
  );

  if (offTrackSignals.length >= 3 && hasDecline) {
    return {
      type: "icp_drift",
      severity: "critical",
      message: `${offTrackSignals.length}/10 recent feedback responses suggest you're building the wrong thing.`,
      suggestions: [
        "Pivot your ICP or problem. The data is clearer than your intuition.",
        `loopkit init --analyze to pressure-test your current brief.`,
      ],
      weeksObserved: offTrackSignals.length,
    };
  }

  return null;
}

function detectScopeCreep(weeks: WeekData[], slug: string): Pattern | null {
  if (weeks.length < 4) return null;

  // Check current tasks for mid-week additions (tasks with created: date not on Sunday)
  const tasksContent = readTasksFile(slug);
  if (!tasksContent) return null;

  const currentWeek = getWeekNumber();
  const sundayDate = getSundayDate();
  const sundayStr = sundayDate.toISOString().split("T")[0];

  // Count tasks with creation dates after Sunday of current week
  const createdMatches = tasksContent.match(/created:(\d{4}-\d{2}-\d{2})/g);
  let midweekAdds = 0;
  if (createdMatches) {
    for (const match of createdMatches) {
      const date = match.replace("created:", "");
      if (date > sundayStr) midweekAdds++;
    }
  }

  // Also check loop logs for mentions of adding tasks mid-week
  let addMentions = 0;
  for (const w of weeks) {
    if (/added.*task|new task|scope|feature creep/i.test(w.content)) {
      addMentions++;
    }
  }

  if (midweekAdds >= 2 || addMentions >= 3) {
    return {
      type: "scope_creep",
      severity: addMentions >= 4 ? "critical" : "warning",
      message: `You added ${midweekAdds} tasks mid-week${addMentions > 0 ? ` and mentioned scope changes in ${addMentions} loop logs` : ""}.`,
      suggestions: [
        "Lock your weekly scope on Sunday. No new tasks until Friday ship.",
        "If an idea comes up mid-week, add it to 'Next Week' — not 'This Week'.",
      ],
      weeksObserved: Math.max(midweekAdds, addMentions),
    };
  }
  return null;
}

function getSundayDate(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// ─── Public API ─────────────────────────────────────────────────

export function detectPatterns(slug: string): PatternResult | null {
  const weeks = getRecentWeeks(8, slug);
  if (weeks.length < 4) return null;

  const patterns: Pattern[] = [];

  const overplanner = detectOverplanner(weeks);
  if (overplanner) patterns.push(overplanner);

  const snooze = detectSnoozeLoop(weeks, slug);
  if (snooze) patterns.push(snooze);

  const shipAvoider = detectShipAvoider(weeks);
  if (shipAvoider) patterns.push(shipAvoider);

  const icpDrift = detectICPDrift(weeks);
  if (icpDrift) patterns.push(icpDrift);

  const scopeCreep = detectScopeCreep(weeks, slug);
  if (scopeCreep) patterns.push(scopeCreep);

  if (patterns.length === 0) return null;

  return {
    patterns,
    totalWeeks: weeks.length,
  };
}

// NOTE: Pattern rendering is handled by patternCard() in ui/theme.ts
// to ensure consistent theming and avoid raw ANSI escape codes.
