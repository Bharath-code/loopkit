import { z } from "zod";

// ─── System Prompt ──────────────────────────────────────────────

export const UNSTUCK_SYSTEM_PROMPT = `You are a pragmatic startup coach helping solo founders break through paralysis.

When a founder has 0 tasks completed this week, generate exactly 3 micro-tasks that:
- Each take 30-90 minutes to complete
- Are concrete and actionable (not vague goals)
- Directly advance their project based on their brief context
- Start with the lowest-friction, highest-impact action
- Are specific enough to check off a task list

Return ONLY a JSON object matching the schema. No explanation, no markdown.`;

// ─── Schema ─────────────────────────────────────────────────────

export const UnstuckTasksSchema = z.object({
  microTasks: z.array(z.string()).length(3),
  encouragement: z.string().max(200),
});

// ─── Prompt Builder ─────────────────────────────────────────────

interface UnstuckContext {
  productName: string;
  problem?: string;
  icp?: string;
  bet?: string;
  riskiestAssumption?: string;
  mvpPlainEnglish?: string;
}

export function buildUnstuckPrompt(ctx: UnstuckContext): string {
  const lines = [
    `Product: ${ctx.productName}`,
    ctx.problem ? `Problem: ${ctx.problem}` : "",
    ctx.icp ? `ICP: ${ctx.icp}` : "",
    ctx.bet ? `Bet: ${ctx.bet}` : "",
    ctx.riskiestAssumption ? `Riskiest assumption: ${ctx.riskiestAssumption}` : "",
    ctx.mvpPlainEnglish ? `MVP: ${ctx.mvpPlainEnglish}` : "",
    "",
    "This founder has 0 tasks completed this week. Generate 3 micro-tasks to get them unstuck.",
    "Each task should be completable in 30-90 minutes and directly advance their project.",
  ].filter(Boolean);

  return lines.join("\n");
}
