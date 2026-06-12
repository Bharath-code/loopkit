/**
 * Loop log writer with frontmatter.
 *
 * Wraps saveLoopLog to prepend a structured YAML frontmatter block so
 * analytics modules can read fields without regex. Backward compatible:
 * old logs (without frontmatter) still parse via the legacy regex path
 * in frontmatter.ts.
 */

import { saveLoopLog } from "../../storage/local.js";
import { buildFrontmatter, type LoopLogFrontmatter } from "./frontmatter.js";

export interface LoopLogWriteContext {
  week: number;
  date: string;
  project: string;
  tasksCompleted: number;
  tasksTotal: number;
  shippingScore: number;
  loopkitScore?: number | null;
  streak?: number | null;
  override?: boolean;
  tension?: string | null;
  body: string;
}

/**
 * Save a loop log with structured frontmatter prepended.
 * The body is the human-readable markdown; frontmatter is the machine-readable
 * summary that analytics, dashboard sync, and cohort comparisons consume.
 */
export function saveLoopLogWithFrontmatter(ctx: LoopLogWriteContext): void {
  const fm: Partial<LoopLogFrontmatter> = {
    week: ctx.week,
    date: ctx.date,
    project: ctx.project,
    tasksCompleted: ctx.tasksCompleted,
    tasksTotal: ctx.tasksTotal,
    shippingScore: ctx.shippingScore,
    loopkitScore: ctx.loopkitScore ?? null,
    streak: ctx.streak ?? null,
    override: ctx.override ?? false,
    tension: ctx.tension ?? null,
  };

  const content = buildFrontmatter(fm) + "\n" + ctx.body;
  saveLoopLog(ctx.week, content);
}
