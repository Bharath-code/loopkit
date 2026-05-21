export const DNA_SYSTEM_PROMPT = `You are a world-class strategic coach for solo technical founders.
Your job is to analyze the founder's shipping DNA data and project brief to provide a single, highly actionable, personalized recommendation for the next month to improve their consistency, velocity, or focus.

Be direct, insightful, and concise. Don't speak in generic platitudes. Reference their specific metrics, strengths, or risk warnings in your recommendation where relevant. Avoid filler words. Max 60 words.`;

export function buildDNAPrompt(context: {
  productName: string;
  bet?: string;
  icp?: string;
  riskiestAssumption?: string;
  pattern: string;
  patternDescription: string;
  avgTasksCompleted: number;
  avgScore: number;
  completionStyle: string;
  velocityTrend: string;
  streak: number;
  totalWeeks: number;
  strengths: string[];
  riskWarnings: string[];
  bestWeek: {
    weekNumber: number;
    score: number;
    tasksCompleted: number;
  };
  overallPercentile: number;
  comparison: string;
}): string {
  const parts: string[] = [];
  parts.push(`Product Name: ${context.productName}`);
  if (context.bet) parts.push(`Bet: ${context.bet}`);
  if (context.icp) parts.push(`ICP: ${context.icp}`);
  if (context.riskiestAssumption) parts.push(`Riskiest Assumption: ${context.riskiestAssumption}`);

  parts.push(`\n--- Shipping DNA Profile ---`);
  parts.push(`Dominant Pattern: ${context.pattern} (${context.patternDescription})`);
  parts.push(`Completion Style: ${context.completionStyle}`);
  parts.push(`Velocity Trend: ${context.velocityTrend}`);
  parts.push(`Weeks Tracked: ${context.totalWeeks} (Current Streak: ${context.streak} weeks)`);
  parts.push(`Average Tasks Completed per Week: ${context.avgTasksCompleted}`);
  parts.push(`Average Weekly Shipping Score: ${context.avgScore}%`);

  parts.push(`\nBest Week Ever: Week ${context.bestWeek.weekNumber} (Shipping Score: ${context.bestWeek.score}%, Tasks Completed: ${context.bestWeek.tasksCompleted})`);
  parts.push(`Benchmark Percentile: ${context.overallPercentile}th percentile (${context.comparison})`);

  if (context.strengths.length > 0) {
    parts.push(`\nStrengths:\n${context.strengths.map((s) => `- ${s}`).join("\n")}`);
  }
  if (context.riskWarnings.length > 0) {
    parts.push(`\nRisk Warnings/Weaknesses:\n${context.riskWarnings.map((w) => `- ${w}`).join("\n")}`);
  }

  parts.push(`\nGenerate one personalized, high-impact recommendation for the next 4 weeks.`);
  return parts.join("\n");
}
