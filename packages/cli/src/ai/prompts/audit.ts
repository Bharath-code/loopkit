/**
 * Audit prompt + system instructions.
 *
 * Tone target: blunt, specific, not motivational. Like a coach who
 * has seen 200 founders and isn't afraid to name the pattern.
 *
 * Few-shot examples teach the model the right shape: 1 sentence per
 * field, no fluff, no "you're doing great", no hedging.
 */

import type { AuditFacts } from "../../analytics/audit.js";

export const AUDIT_SYSTEM_PROMPT = `You are a blunt founder coach reviewing 8 weeks of one founder's shipping data.

Your job: name the pattern they can't see. Not motivate. Not encourage. Identify.

Style rules:
- One sentence per field. Max 280 characters.
- Specific. "You skipped distribution tasks in 6 of 8 weeks" not "you could improve distribution".
- No motivational language. No "great work". No "you're on a journey".
- Reference the actual data (week numbers, task counts) when relevant.
- topAvoidancePattern: the one thing they consistently avoid.
- biggestInsight: the non-obvious thing the data shows.
- oneChangeForNextMonth: a single concrete action, not a strategy.
- riskIfUnchanged: what happens if they keep doing this for 3 more months.

Do not include preamble. Do not include "Here's your audit:". Start with the JSON.`;

export function buildAuditPrompt(facts: AuditFacts): string {
  const weekSummary = facts.weeks
    .map((w) => {
      const tasks = w.tasksTotal > 0 ? `${w.tasksCompleted}/${w.tasksTotal}` : "0/0";
      const type = w.dominantTaskType ?? "none";
      return `  Week ${w.week} (${w.date}): score=${w.shippingScore}%, tasks=${tasks}, dominant=${type}, shipped=${w.shipped ? "yes" : "no"}, override=${w.override ? "yes" : "no"}`;
    })
    .join("\n");

  const cohort = facts.periodWeeks > 0
    ? `Cohort medians: shippingScore=${facts.currentShippingScore >= 55 ? "above" : "below"} 55%, streak=${facts.currentStreak >= 3 ? "above" : "below"} 3 weeks, tasks/week=${Math.round(facts.totalTasksCompleted / facts.periodWeeks)} vs 4 median`
    : "Insufficient data for cohort comparison";

  return `Founder audit (${facts.periodWeeks} weeks of data):

${facts.periodWeeks > 0 ? weekSummary : "  No loop logs found in the last 8 weeks."}

Aggregate facts:
- Period weeks: ${facts.periodWeeks}
- Total tasks completed: ${facts.totalTasksCompleted}
- Weeks shipped: ${facts.totalTasksShipped}/${facts.periodWeeks}
- Pulse responses: ${facts.totalPulseResponses}
- Override rate: ${(facts.overrideRate * 100).toFixed(0)}% of weeks
- Feedback acted on rate: ${(facts.feedbackActedOnRate * 100).toFixed(0)}%
- Velocity trend: ${facts.velocityTrend}
- Current streak: ${facts.currentStreak} weeks
- DNA pattern: ${facts.dnaPattern ?? "insufficient data"}
- Active patterns: ${facts.activePatterns.length > 0 ? facts.activePatterns.join(", ") : "none detected"}
- Churn risk: ${facts.churnLevel ?? "low"}

${cohort}

Generate the audit JSON.`;
}
