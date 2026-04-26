import { readLastNLoopLogs, readLoopLog, readBriefJson } from "../storage/local.js";
import { colors, header, pass, warn, box } from "../ui/theme.js";

export interface SuccessPrediction {
  probability: number;
  confidence: "low" | "medium" | "high";
  strengths: string[];
  risks: string[];
  shiftFactors: ShiftFactor[];
  weeksAnalyzed: number;
}

export interface ShiftFactor {
  factor: string;
  impact: number;
  direction: "positive" | "negative";
}

export function predictSuccess(slug: string): SuccessPrediction | null {
  const logs = readLastNLoopLogs(12, slug);
  if (logs.length < 8) return null;

  const weeks: Array<{
    tasksCompleted: number;
    tasksTotal: number;
    shippingScore: number;
    overridden: boolean;
    weekNumber: number;
  }> = [];

  for (const log of logs) {
    const content = readLoopLog(log.weekNumber);
    if (!content) continue;

    const completedMatch = content.match(/- Tasks completed:\s*(\d+)/);
    const openMatch = content.match(/- Tasks open:\s*(\d+)/);
    const scoreMatch = content.match(/- Shipping score:\s*(\d+)%/);

    if (completedMatch && scoreMatch) {
      weeks.push({
        tasksCompleted: parseInt(completedMatch[1]),
        tasksTotal: openMatch ? parseInt(openMatch[1]) + parseInt(completedMatch[1]) : 0,
        shippingScore: parseInt(scoreMatch[1]),
        overridden: log.overridden,
        weekNumber: log.weekNumber,
      });
    }
  }

  if (weeks.length < 8) return null;

  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  let baseProbability = 15;

  const factors: ShiftFactor[] = [];

  const consistency = computeConsistency(sorted);
  const consistencyImpact = consistency * 25;
  baseProbability += consistencyImpact;
  factors.push({
    factor: `${Math.round(consistency * 100)}% weekly consistency`,
    impact: Math.round(consistencyImpact),
    direction: "positive",
  });

  const avgScore = sorted.reduce((s, w) => s + w.shippingScore, 0) / sorted.length;
  const scoreImpact = (avgScore / 100) * 20;
  baseProbability += scoreImpact;
  factors.push({
    factor: `Avg shipping score ${Math.round(avgScore)}%`,
    impact: Math.round(scoreImpact),
    direction: "positive",
  });

  const avgTasks = sorted.reduce((s, w) => s + w.tasksCompleted, 0) / sorted.length;
  if (avgTasks >= 5) {
    baseProbability += 10;
    factors.push({ factor: "High task velocity (5+/week)", impact: 10, direction: "positive" });
  } else if (avgTasks >= 3) {
    baseProbability += 5;
    factors.push({ factor: "Moderate task velocity (3+/week)", impact: 5, direction: "positive" });
  } else {
    baseProbability -= 5;
    factors.push({ factor: "Low task velocity (<3/week)", impact: -5, direction: "negative" });
  }

  const trend = computeTrend(sorted);
  if (trend > 0) {
    baseProbability += 8;
    factors.push({ factor: "Upward trajectory", impact: 8, direction: "positive" });
  } else if (trend < 0) {
    baseProbability -= 10;
    factors.push({ factor: "Declining trajectory", impact: -10, direction: "negative" });
  }

  const overrideRate = sorted.filter((w) => w.overridden).length / sorted.length;
  if (overrideRate > 0.5) {
    baseProbability -= 5;
    factors.push({ factor: "High override rate (>50%)", impact: -5, direction: "negative" });
  }

  const hasShipLog = sorted.some((w) => {
    const content = readLoopLog(w.weekNumber);
    return content?.includes("- Shipped Friday: Yes");
  });
  if (hasShipLog) {
    baseProbability += 7;
    factors.push({ factor: "Consistent shipping habit", impact: 7, direction: "positive" });
  }

  baseProbability = Math.max(2, Math.min(85, baseProbability));

  const strengths: string[] = [];
  const risks: string[] = [];

  if (consistency >= 0.7) strengths.push("You show up every week — the #1 predictor of founder success.");
  if (avgScore >= 70) strengths.push("High completion rate — you finish what you start.");
  if (avgTasks >= 4) strengths.push("Strong output velocity — you're shipping at a professional pace.");
  if (trend > 0) strengths.push("Improving trajectory — you're getting better each week.");
  if (hasShipLog) strengths.push("Regular shipping — you're building public momentum.");

  if (consistency < 0.5) risks.push("Inconsistent weekly loops — building the habit is the hardest part.");
  if (avgScore < 40) risks.push("Low completion rate — consider reducing scope to 1-2 tasks per week.");
  if (trend < 0) risks.push("Declining momentum — check for burnout or scope creep.");
  if (avgTasks < 2) risks.push("Low output — try breaking tasks into 30-minute micro-tasks.");

  if (strengths.length === 0) strengths.push("You're building the foundation — consistency compounds over time.");
  if (risks.length === 0) risks.push("No major risks detected — keep your current rhythm.");

  const confidence: SuccessPrediction["confidence"] =
    sorted.length >= 12 ? "high" : sorted.length >= 10 ? "medium" : "low";

  return {
    probability: Math.round(baseProbability),
    confidence,
    strengths,
    risks,
    shiftFactors: factors,
    weeksAnalyzed: sorted.length,
  };
}

function computeConsistency(weeks: Array<{ weekNumber: number }>): number {
  if (weeks.length < 2) return 0;
  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const firstWeek = sorted[0].weekNumber;
  const lastWeek = sorted[sorted.length - 1].weekNumber;
  const totalWeeks = lastWeek - firstWeek + 1;
  return sorted.length / totalWeeks;
}

function computeTrend(weeks: Array<{ tasksCompleted: number; weekNumber: number }>): number {
  if (weeks.length < 4) return 0;
  const firstHalf = weeks.slice(0, Math.floor(weeks.length / 2));
  const secondHalf = weeks.slice(Math.floor(weeks.length / 2));
  const firstAvg = firstHalf.reduce((s, w) => s + w.tasksCompleted, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, w) => s + w.tasksCompleted, 0) / secondHalf.length;
  return secondAvg - firstAvg;
}

export function renderPrediction(prediction: SuccessPrediction): void {
  const emoji = prediction.probability >= 60 ? "🚀" : prediction.probability >= 40 ? "📈" : "🌱";

  console.log(header(`${emoji} Success Predictor`));

  const probColor = prediction.probability >= 60
    ? colors.success
    : prediction.probability >= 40
      ? colors.warning
      : colors.danger;

  console.log(`  Probability of revenue in 6 months: ${probColor.bold(`${prediction.probability}%`)}`);
  console.log(colors.dim(`  Confidence: ${prediction.confidence} (${prediction.weeksAnalyzed} weeks analyzed)`));
  console.log("");

  if (prediction.strengths.length > 0) {
    console.log(colors.white.bold("  Strengths"));
    for (const s of prediction.strengths) {
      console.log(`  ${pass(s)}`);
    }
    console.log("");
  }

  if (prediction.risks.length > 0) {
    console.log(colors.warning.bold("  Risks"));
    for (const r of prediction.risks) {
      console.log(`  ${warn(r)}`);
    }
    console.log("");
  }

  console.log(colors.dim("  How to shift your probability:"));
  for (const f of prediction.shiftFactors) {
    const sign = f.direction === "positive" ? "+" : "";
    console.log(colors.dim(`    ${f.factor}: ${sign}${f.impact}%`));
  }
  console.log("");
  console.log(colors.dim("  Note: This is a heuristic model, not a guarantee. Actual outcomes depend on market, timing, and execution."));
}
