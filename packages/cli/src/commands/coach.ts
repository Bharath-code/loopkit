import * as p from "@clack/prompts";
import { readConfig, writeConfig } from "../storage/local.js";
import { getCoachingPlan, recordMomentShown } from "../analytics/coach.js";
import {
  colors,
  header,
  coachingPlanCard,
  nextStep,
  shortcutsHint,
} from "../ui/theme.js";

export async function coachCommand(options?: {
  off?: boolean;
  on?: boolean;
}): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  // ─── Toggle coaching ──────────────────────────────────────────
  if (options?.off) {
    config.coaching = { ...config.coaching, enabled: false };
    writeConfig(config);
    console.log(
      colors.muted("Coaching disabled. Run `loopkit coach --on` to re-enable."),
    );
    return;
  }

  if (options?.on) {
    config.coaching = { ...config.coaching, enabled: true };
    writeConfig(config);
    console.log(colors.success("Coaching enabled."));
  }

  if (!slug) {
    console.log(colors.danger("No active project. Run `loopkit init` first."));
    process.exit(1);
  }

  if (config.coaching?.enabled === false) {
    console.log(
      colors.muted("Coaching is disabled. Run `loopkit coach --on` to enable."),
    );
    return;
  }

  p.intro(colors.primary.bold("LoopKit — AI Coach"));
  console.log(shortcutsHint());

  // ─── Generate coaching plan ───────────────────────────────────
  const s = p.spinner();
  s.start("Analyzing your shipping data...");

  const plan = getCoachingPlan(slug);

  s.stop("Analysis complete.");

  if (!plan || plan.moments.length === 0) {
    console.log(header("Not Enough Data Yet"));
    console.log(
      colors.muted("  Coaching needs at least 2 weeks of loop data."),
    );
    console.log(
      colors.muted(
        "  Run `loopkit loop` for a few weeks to unlock personalized coaching.",
      ),
    );
    console.log(nextStep("loop"));
    p.outro(
      colors.muted("Keep shipping. Coaching will get smarter every week."),
    );
    return;
  }

  // ─── Show full plan ───────────────────────────────────────────
  console.log(coachingPlanCard(plan));

  // ─── Interactive: acknowledge each moment ─────────────────────
  for (const moment of plan.moments) {
    const ack = await p.confirm({
      message: `Acknowledge: ${moment.title}?`,
    });

    if (p.isCancel(ack)) {
      p.outro(colors.muted("Coaching cancelled."));
      return;
    }

    if (ack) {
      recordMomentShown(moment.id);
      console.log(colors.success(`  ✓ Marked as seen`));
    }
  }

  console.log(nextStep("loop"));
  p.outro(colors.muted("Coaching complete. See you next week."));
}
