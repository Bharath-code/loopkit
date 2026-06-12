/**
 * Audit data layer.
 *
 * Gathers structured facts about the founder's recent work (last 8 weeks
 * by default) so the AI generation step has clean inputs and can focus
 * on interpretation rather than data wrangling.
 *
 * The data layer is deliberately *rule-based* — no AI calls. AI is only
 * used in the prompt layer to interpret what's already collected.
 */

import { getWeekNumber } from "@loopkit/shared";
import { parseLoopLog } from "../commands/loop/frontmatter.js";
import {
  readLastNLoopLogs,
  readLoopLog,
  readTasksFile,
  readShipLog,
  readPulseResponses,
  readConfig,
  listProjects,
} from "../storage/local.js";
import { computeShippingDNA } from "./dna.js";
import { detectPatterns } from "./patterns.js";
import { detectChurnRisk } from "./churn.js";
import { detectHighOverrideRate } from "../commands/loop/helpers.js";
import { parseShippingScore } from "../commands/loop/helpers.js";

export interface AuditFacts {
  periodWeeks: number;
  weeks: AuditWeek[];
  totalTasksCompleted: number;
  totalTasksShipped: number;
  totalPulseResponses: number;
  overrideRate: number;
  feedbackActedOnRate: number;
  velocityTrend: "accelerating" | "steady" | "declining" | "volatile";
  currentStreak: number;
  currentShippingScore: number;
  dnaPattern: string | null;
  activePatterns: string[];
  churnLevel: "low" | "medium" | "high" | null;
  hasEnoughData: boolean;
}

export interface AuditWeek {
  week: number;
  date: string;
  shippingScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  shipped: boolean;
  pulseResponses: number;
  override: boolean;
  dominantTaskType: "distribution" | "product" | "admin" | "feedback" | "design" | "infra" | null;
}

const DISTRIBUTION_KEYWORDS = /\b(tweet|post|launch|ship|share|announce|newsletter|outreach|dm|content|blog|thread|public|announce|talk|podcast)\b/i;
const PRODUCT_KEYWORDS = /\b(build|ship|feature|coding|implement|code|api|bug|fix|deploy|release|engineer|prototype)\b/i;
const ADMIN_KEYWORDS = /\b(invoice|tax|legal|setup|configure|billing|admin|ops|account|domain|hosting|email setup)\b/i;
const FEEDBACK_KEYWORDS = /\b(feedback|interview|user|customer|test|pulse|response|review)\b/i;
const DESIGN_KEYWORDS = /\b(design|logo|color|font|wireframe|mock|figma|brand|illustration)\b/i;
const INFRA_KEYWORDS = /\b(deploy|ci|test|docker|k8s|aws|vercel|github action|monitor|sentry|observability)\b/i;

function classifyTasks(tasksText: string): AuditWeek["dominantTaskType"] {
  const counts: Record<string, number> = {
    distribution: 0,
    product: 0,
    admin: 0,
    feedback: 0,
    design: 0,
    infra: 0,
  };
  const lines = tasksText.split("\n");
  for (const line of lines) {
    if (!/^\s*-\s*\[/.test(line)) continue;
    if (DISTRIBUTION_KEYWORDS.test(line)) counts.distribution++;
    if (PRODUCT_KEYWORDS.test(line)) counts.product++;
    if (ADMIN_KEYWORDS.test(line)) counts.admin++;
    if (FEEDBACK_KEYWORDS.test(line)) counts.feedback++;
    if (DESIGN_KEYWORDS.test(line)) counts.design++;
    if (INFRA_KEYWORDS.test(line)) counts.infra++;
  }
  let best: AuditWeek["dominantTaskType"] = null;
  let bestCount = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > bestCount) {
      best = k as AuditWeek["dominantTaskType"];
      bestCount = v;
    }
  }
  return best;
}

function computeVelocity(weeks: AuditWeek[]): AuditFacts["velocityTrend"] {
  if (weeks.length < 3) return "steady";
  const recent = weeks.slice(0, Math.max(2, Math.floor(weeks.length / 2)));
  const older = weeks.slice(Math.floor(weeks.length / 2));

  const recentAvg =
    recent.reduce((s, w) => s + w.shippingScore, 0) / recent.length;
  const olderAvg =
    older.reduce((s, w) => s + w.shippingScore, 0) / older.length;
  const delta = recentAvg - olderAvg;

  // Variance check
  const variance =
    weeks.reduce((s, w) => s + Math.pow(w.shippingScore - recentAvg, 2), 0) /
    weeks.length;
  if (variance > 800) return "volatile"; // high variance
  if (delta > 5) return "accelerating";
  if (delta < -5) return "declining";
  return "steady";
}

export function gatherAuditFacts(weeks = 8, slug?: string): AuditFacts {
  const config = readConfig();
  const projectSlug = slug ?? config.activeProject;

  if (!projectSlug) {
    return {
      periodWeeks: 0,
      weeks: [],
      totalTasksCompleted: 0,
      totalTasksShipped: 0,
      totalPulseResponses: 0,
      overrideRate: 0,
      feedbackActedOnRate: 0,
      velocityTrend: "steady",
      currentStreak: 0,
      currentShippingScore: 0,
      dnaPattern: null,
      activePatterns: [],
      churnLevel: null,
      hasEnoughData: false,
    };
  }

  const logs = readLastNLoopLogs(weeks, projectSlug);
  const auditWeeks: AuditWeek[] = [];
  const currentWeek = getWeekNumber();

  for (const log of logs) {
    const content = readLoopLog(log.weekNumber);
    if (!content) continue;
    const parsed = parseLoopLog(content);
    const fm = parsed.frontmatter;
    if (!fm || fm.week === 0) continue;

    // Tasks for this week
    let tasksText = "";
    try {
      const allTasks = readTasksFile(projectSlug) || "";
      tasksText = allTasks;
    } catch {
      tasksText = "";
    }

    auditWeeks.push({
      week: fm.week,
      date: fm.date,
      shippingScore: fm.shippingScore,
      tasksCompleted: fm.tasksCompleted,
      tasksTotal: fm.tasksTotal,
      shipped: !!readShipLog(fm.date),
      pulseResponses: 0, // filled below
      override: fm.override,
      dominantTaskType: classifyTasks(tasksText),
    });
  }

  const allPulse = readPulseResponses();
  const totalPulseResponses = allPulse.length;
  // Distribute pulse count per week (heuristic: 1/periodWeeks)
  const pulsePerWeek =
    auditWeeks.length > 0 ? Math.round(totalPulseResponses / auditWeeks.length) : 0;
  for (const w of auditWeeks) {
    w.pulseResponses = pulsePerWeek;
  }

  const totalTasksCompleted = auditWeeks.reduce(
    (s, w) => s + w.tasksCompleted,
    0,
  );
  const totalTasksShipped = auditWeeks.filter((w) => w.shipped).length;
  const overridden = auditWeeks.filter((w) => w.override).length;
  const overrideRate =
    auditWeeks.length > 0 ? overridden / auditWeeks.length : 0;

  // Feedback acted on: weeks where tasks touched feedback (heuristic)
  const feedbackActedOn = auditWeeks.filter((w) => {
    if (w.pulseResponses === 0) return false;
    return w.dominantTaskType === "feedback" || w.dominantTaskType === "product";
  }).length;
  const feedbackActedOnRate =
    totalPulseResponses > 0
      ? Math.min(1, feedbackActedOn / Math.max(1, auditWeeks.length))
      : 0;

  const velocityTrend = computeVelocity(auditWeeks);
  const currentShippingScore = auditWeeks[0]?.shippingScore ?? 0;

  // External signals (only call if we have data)
  let dnaPattern: string | null = null;
  let activePatterns: string[] = [];
  let churnLevel: "low" | "medium" | "high" | null = null;
  if (auditWeeks.length >= 4) {
    try {
      const dna = computeShippingDNA();
      dnaPattern = dna?.pattern ?? null;
    } catch {
      /* ignore */
    }
    try {
      const patterns = detectPatterns(projectSlug);
      activePatterns = (patterns?.patterns ?? []).map((p) => p.type);
    } catch {
      /* ignore */
    }
    try {
      const churn = detectChurnRisk();
      churnLevel = churn?.level ?? null;
    } catch {
      /* ignore */
    }
  }

  // Streak: count consecutive weeks back from currentWeek
  let currentStreak = 0;
  for (const w of auditWeeks) {
    if (Math.abs(currentWeek - w.week) <= 1 || currentStreak > 0) {
      currentStreak++;
    }
    if (currentStreak > 0 && w.week !== currentWeek - currentStreak) break;
  }

  return {
    periodWeeks: auditWeeks.length,
    weeks: auditWeeks,
    totalTasksCompleted,
    totalTasksShipped,
    totalPulseResponses,
    overrideRate,
    feedbackActedOnRate,
    velocityTrend,
    currentStreak,
    currentShippingScore,
    dnaPattern,
    activePatterns,
    churnLevel,
    hasEnoughData: auditWeeks.length >= 2,
  };
}

/**
 * Compare the founder against a synthetic baseline (no PII).
 * In a future release this will hit /api/benchmarks; for now we use
 * a stable reference distribution so the relative language is consistent.
 */
export function compareToCohort(facts: AuditFacts): {
  shippingScore: { you: number; cohortMedian: number };
  streak: { you: number; cohortMedian: number };
  tasksPerWeek: { you: number; cohortMedian: number };
} {
  const tasksPerWeek =
    facts.periodWeeks > 0
      ? Math.round(facts.totalTasksCompleted / facts.periodWeeks)
      : 0;
  // Synthetic cohort medians (pre-PMF solo founders)
  return {
    shippingScore: { you: facts.currentShippingScore, cohortMedian: 55 },
    streak: { you: facts.currentStreak, cohortMedian: 3 },
    tasksPerWeek: { you: tasksPerWeek, cohortMedian: 4 },
  };
}
