import { z } from "zod";

export const INVESTOR_UPDATE_SYSTEM_PROMPT = `You are a world-class strategic advisor and investor relations expert.
Your job is to synthesize a month's worth of product shipping, traction data, revenue milestones, and weekly learnings into a concise, professional, and high-signal investor update.

Write in a crisp, confident, and narrative style. Avoid corporate buzzwords and marketing fluff. Highlight concrete achievements, key data metrics, honest learnings, and future focus. Keep it executive-ready.`;

export const InvestorUpdateSchema = z.object({
  executiveSummary: z.string().describe("A concise 2-3 sentence executive summary of the month's progress and trajectory."),
  featuresShipped: z.array(z.string()).describe("A list of key features/improvements shipped, written in a clear, benefit-oriented way for investors."),
  keyLearnings: z.array(z.string()).describe("Key strategic insights, customer feedback trends, or pivots in assumptions from this month."),
  nextMonthFocus: z.string().describe("The primary focus and 'one thing' for the upcoming month."),
  tensionsAndRisks: z.array(z.string()).describe("Key challenges, risks, or blockers identified, along with how you plan to mitigate them."),
});

export type InvestorUpdate = z.infer<typeof InvestorUpdateSchema>;

export function buildInvestorUpdatePrompt(context: {
  productName: string;
  bet?: string;
  icp?: string;
  riskiestAssumption?: string;
  monthName: string;
  year: number;
  aggregatedMetrics: {
    weeksTracked: number;
    tasksCompleted: number;
    feedbackResponses: number;
    mrrDelta: string;
    streak: number;
  };
  rawShipments: string[];
  rawLearnings: {
    weekNumber: number;
    date: string;
    win: string;
    focus: string;
    tension: string;
  }[];
}): string {
  const parts: string[] = [];
  parts.push(`Product Name: ${context.productName}`);
  if (context.bet) parts.push(`Bet: ${context.bet}`);
  if (context.icp) parts.push(`ICP: ${context.icp}`);
  if (context.riskiestAssumption) parts.push(`Riskiest Assumption: ${context.riskiestAssumption}`);

  parts.push(`\n--- Update Month ---`);
  parts.push(`${context.monthName} ${context.year}`);

  parts.push(`\n--- Traction Metrics for ${context.monthName} ---`);
  parts.push(`- Weeks Tracked: ${context.aggregatedMetrics.weeksTracked}`);
  parts.push(`- Tasks Completed: ${context.aggregatedMetrics.tasksCompleted}`);
  parts.push(`- Customer Feedback Collected: ${context.aggregatedMetrics.feedbackResponses} responses`);
  parts.push(`- MRR Growth: ${context.aggregatedMetrics.mrrDelta}`);
  parts.push(`- Active Streak at Month-End: ${context.aggregatedMetrics.streak} weeks`);

  parts.push(`\n--- Product Features Shipped ---`);
  if (context.rawShipments.length > 0) {
    parts.push(context.rawShipments.map((s) => `- ${s}`).join("\n"));
  } else {
    parts.push("_No shipments logged in this period._");
  }

  parts.push(`\n--- Weekly Wins & Focus ---`);
  if (context.rawLearnings.length > 0) {
    for (const w of context.rawLearnings) {
      parts.push(`Week ${w.weekNumber} (${w.date}):`);
      parts.push(`  - Weekly Win: ${w.win}`);
      parts.push(`  - Focus: ${w.focus}`);
      if (w.tension) parts.push(`  - Tension/Challenge: ${w.tension}`);
    }
  } else {
    parts.push("_No weekly learnings logged in this period._");
  }

  parts.push(`\nSynthesize the above data into a premium, professional investor update. Ensure that your output strictly matches the structured schema.`);

  return parts.join("\n");
}
