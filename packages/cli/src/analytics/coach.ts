import { readLastNLoopLogs, readLoopLog, readConfig, writeConfig, readTasksFile } from "../storage/local.js";
import {
  type CoachingPlan,
  type CoachingMoment,
  CoachingPlanSchema,
  formatDate,
} from "@loopkit/shared";
import { computeShippingDNA } from "./dna.js";
import { detectChurnRisk } from "./churn.js";
import { predictSuccess } from "./predictor.js";
import { detectPatterns } from "./patterns.js";

// ─── Coaching Rules ─────────────────────────────────────────────

export interface RuleContext {
  slug: string;
  totalWeeks: number;
  dna: ReturnType<typeof computeShippingDNA>;
  churnRisk: ReturnType<typeof detectChurnRisk>;
  prediction: ReturnType<typeof predictSuccess>;
  patterns: ReturnType<typeof detectPatterns>;
  tasksContent: string | null;
  lastShownId: string | undefined;
}

type CoachingRule = (ctx: RuleContext) => CoachingMoment | null;

const rules: CoachingRule[] = [
  // CRITICAL: Ship avoider — never miss this
  (ctx) => {
    if (!ctx.patterns) return null;
    const shipAvoider = ctx.patterns.patterns.find((p) => p.type === "ship_avoider");
    if (!shipAvoider) return null;
    return {
      id: "ship_avoider_critical",
      priority: "critical",
      title: "Ship Avoider Detected",
      message: `You haven't shipped in ${shipAvoider.weeksObserved} weeks. Building without shipping is just inventory.`,
      action: "Ship anything this week — even if it's imperfect.",
      command: "loopkit ship",
      condition: "ship_avoider pattern active",
    };
  },

  // CRITICAL: ICP drift
  (ctx) => {
    if (!ctx.patterns) return null;
    const icpDrift = ctx.patterns.patterns.find((p) => p.type === "icp_drift");
    if (!icpDrift) return null;
    return {
      id: "icp_drift_critical",
      priority: "critical",
      title: "ICP Drift Alert",
      message: icpDrift.message,
      action: "Pressure-test your current brief before building more.",
      command: "loopkit init --analyze",
      condition: "icp_drift pattern active",
    };
  },

  // CRITICAL: Low velocity
  (ctx) => {
    if (!ctx.churnRisk) return null;
    const lowVelocity = ctx.churnRisk.signals.find((s) => s.type === "low_velocity" && s.severity === "critical");
    if (!lowVelocity) return null;
    return {
      id: "low_velocity_critical",
      priority: "critical",
      title: "Stuck?",
      message: lowVelocity.message,
      action: "Break your next task into something you can do in 30 minutes.",
      command: "loopkit loop",
      condition: "low_velocity critical",
    };
  },

  // CRITICAL: High churn risk
  (ctx) => {
    if (!ctx.churnRisk || ctx.churnRisk.level !== "high") return null;
    return {
      id: "churn_high_critical",
      priority: "critical",
      title: "Momentum at Risk",
      message: `Multiple warning signs detected: ${ctx.churnRisk.signals.map((s) => s.message).join("; ")}`,
      action: "Pick one small task and finish it today. Momentum compounds.",
      command: "loopkit track --add \"One 30-minute task\"",
      condition: "churn risk high",
    };
  },

  // WARNING: Overplanner
  (ctx) => {
    if (!ctx.patterns) return null;
    const overplanner = ctx.patterns.patterns.find((p) => p.type === "overplanner");
    if (!overplanner) return null;
    return {
      id: "overplanner_warning",
      priority: "warning",
      title: "Overplanning",
      message: overplanner.message,
      action: "Plan 3 must-do tasks per week. Everything else goes to backlog.",
      command: "loopkit track",
      condition: "overplanner pattern active",
    };
  },

  // WARNING: Snooze loop
  (ctx) => {
    if (!ctx.patterns) return null;
    const snooze = ctx.patterns.patterns.find((p) => p.type === "snooze_loop");
    if (!snooze) return null;
    return {
      id: "snooze_loop_warning",
      priority: "warning",
      title: "Snooze Loop",
      message: snooze.message,
      action: "Batch annoying tasks on Monday. Don't let them survive Tuesday.",
      command: "loopkit track",
      condition: "snooze_loop pattern active",
    };
  },

  // WARNING: Scope creep
  (ctx) => {
    if (!ctx.patterns) return null;
    const scope = ctx.patterns.patterns.find((p) => p.type === "scope_creep");
    if (!scope) return null;
    return {
      id: "scope_creep_warning",
      priority: "warning",
      title: "Scope Creep",
      message: scope.message,
      action: "Lock your weekly scope on Sunday. No new tasks until Friday ship.",
      command: "loopkit track",
      condition: "scope_creep pattern active",
    };
  },

  // WARNING: Medium churn risk
  (ctx) => {
    if (!ctx.churnRisk || ctx.churnRisk.level !== "medium") return null;
    return {
      id: "churn_medium_warning",
      priority: "warning",
      title: "Warning Signs",
      message: ctx.churnRisk.signals[0]?.message || "Your metrics show a concerning trend.",
      action: ctx.churnRisk.suggestions[0] || "Review your weekly rhythm.",
      command: "loopkit loop",
      condition: "churn risk medium",
    };
  },

  // WARNING: Low success probability
  (ctx) => {
    if (!ctx.prediction || ctx.prediction.probability >= 40) return null;
    return {
      id: "low_probability_warning",
      priority: "warning",
      title: "Low Success Probability",
      message: `Your current trajectory shows a ${ctx.prediction.probability}% chance of revenue in 6 months.`,
      action: `Focus on: ${ctx.prediction.shiftFactors.filter((f) => f.direction === "positive").slice(0, 2).map((f) => f.factor).join(", ")}`,
      command: "loopkit loop",
      condition: "prediction probability < 40%",
    };
  },

  // INFO: Week 3 milestone
  (ctx) => {
    if (ctx.totalWeeks !== 3) return null;
    return {
      id: "week_3_milestone",
      priority: "info",
      title: "Week 3 Milestone",
      message: "You've been validating for 3 weeks. 73% of founders who ship by week 4 reach revenue within 6 months.",
      action: "Make this week the one you ship something public.",
      command: "loopkit ship",
      condition: "week == 3",
    };
  },

  // INFO: Week 8 milestone (with predictor)
  (ctx) => {
    if (ctx.totalWeeks !== 8 || !ctx.prediction) return null;
    return {
      id: "week_8_milestone",
      priority: "info",
      title: "Week 8 Check-In",
      message: `Success predictor: ${ctx.prediction.probability}% chance of revenue. ${ctx.prediction.strengths[0] || "Keep building consistency."}`,
      action: ctx.prediction.risks[0] || "Keep your current rhythm.",
      command: "loopkit loop",
      condition: "week == 8 && prediction available",
    };
  },

  // INFO: Week 16 milestone (archetype-specific)
  (ctx) => {
    if (ctx.totalWeeks !== 16 || !ctx.dna) return null;
    const archetypeAdvice: Record<string, string> = {
      Sprinter: "As a Sprinter, you're great at shipping fast. Watch for ICP drift — your last 2 pivots were problem changes.",
      Marathoner: "As a Marathoner, your consistency is your superpower. Consider raising your ambition — you've proven you can deliver.",
      Perfectionist: "As a Perfectionist, your quality is high but volume is low. Ship 2 things this week instead of 1 perfect thing.",
      Reactor: "As a Reactor, your output varies. Build a Sunday ritual — same time, same place, same first task.",
      "All-Star": "You're in the top 8% of founders. The next frontier: are you building the RIGHT thing? Get more user feedback.",
    };
    return {
      id: "week_16_milestone",
      priority: "info",
      title: "Week 16 — Archetype Check",
      message: archetypeAdvice[ctx.dna.pattern] || "You're building real momentum. Keep going.",
      action: "Revisit your brief. Does it still match what users are asking for?",
      command: "loopkit init --analyze",
      condition: "week == 16 && dna available",
    };
  },

  // INFO: Stuck — 0 tasks (triggered from track command)
  (ctx) => {
    if (!ctx.tasksContent) return null;
    const hasTasks = /-\s*\[[ x]\]/.test(ctx.tasksContent);
    if (hasTasks) return null;
    return {
      id: "stuck_zero_tasks",
      priority: "warning",
      title: "No Tasks Yet",
      message: "Your tasks.md is empty. Every journey starts with a single step.",
      action: "Generate 3 micro-tasks from your brief to get unstuck.",
      command: "loopkit loop",
      condition: "tasks.md has no tasks",
    };
  },
];

// ─── Core Engine ────────────────────────────────────────────────

function buildContext(slug: string): RuleContext {
  const logs = readLastNLoopLogs(16, slug);
  const config = readConfig();

  return {
    slug,
    totalWeeks: logs.length,
    dna: computeShippingDNA(),
    churnRisk: detectChurnRisk(),
    prediction: predictSuccess(slug),
    patterns: detectPatterns(slug),
    tasksContent: readTasksFile(slug),
    lastShownId: config.coaching?.lastShownMomentId,
  };
}

export function filterDeduplicated(moments: CoachingMoment[], lastShownId: string | undefined): CoachingMoment[] {
  // Never show the exact same moment twice in a row
  if (lastShownId) {
    return moments.filter((m) => m.id !== lastShownId);
  }
  return moments;
}

export function sortByPriority(moments: CoachingMoment[]): CoachingMoment[] {
  const order = { critical: 0, warning: 1, info: 2 };
  return [...moments].sort((a, b) => order[a.priority] - order[b.priority]);
}

export function getCoachingPlan(slug: string): CoachingPlan | null {
  const ctx = buildContext(slug);

  // Not enough data for meaningful coaching
  if (ctx.totalWeeks < 2) return null;

  const allMoments: CoachingMoment[] = [];
  for (const rule of rules) {
    const moment = rule(ctx);
    if (moment) allMoments.push(moment);
  }

  const deduped = filterDeduplicated(allMoments, ctx.lastShownId);
  const sorted = sortByPriority(deduped);

  // Cap at 3 moments max
  const moments = sorted.slice(0, 3);

  if (moments.length === 0 && ctx.totalWeeks < 4) {
    // Not enough for coaching yet
    return null;
  }

  const plan: CoachingPlan = {
    moments,
    totalWeeks: ctx.totalWeeks,
    dna: ctx.dna || undefined,
    churnRisk: ctx.churnRisk || undefined,
    prediction: ctx.prediction || undefined,
    activePatterns: ctx.patterns?.patterns || undefined,
    generatedAt: formatDate(),
  };

  // Validate with shared schema before returning
  return CoachingPlanSchema.parse(plan);
}

export function getPriorityMoment(slug: string): CoachingMoment | null {
  const plan = getCoachingPlan(slug);
  if (!plan || plan.moments.length === 0) return null;
  return plan.moments[0];
}

export function recordMomentShown(momentId: string): void {
  const config = readConfig();
  config.coaching = {
    ...config.coaching,
    enabled: config.coaching?.enabled ?? true,
    lastShownMomentId: momentId,
    lastShownAt: formatDate(),
  };
  writeConfig(config);
}

export function evaluateRules(ctx: RuleContext): CoachingMoment[] {
  const moments: CoachingMoment[] = [];
  for (const rule of rules) {
    const moment = rule(ctx);
    if (moment) moments.push(moment);
  }
  return moments;
}

export function isCoachingEnabled(): boolean {
  const config = readConfig();
  return config.coaching?.enabled !== false;
}
