import { readConfig, writeConfig } from "../storage/local.js";
import { getCoachingPlan, recordMomentShown } from "../analytics/coach.js";
import {
  colors,
  clog,
  coachingPlanCard,
  nextStep,
  shortcutsHint,
  ceremonyIntro,
  ceremonyOutro,
  spinner,
  confirm,
  isCancel,
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
    clog.message("Coaching disabled. Run `loopkit coach --on` to re-enable.");
    return;
  }

  if (options?.on) {
    config.coaching = { ...config.coaching, enabled: true };
    writeConfig(config);
    clog.success("Coaching enabled.");
  }

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    process.exit(1);
  }

  if (config.coaching?.enabled === false) {
    clog.message("Coaching is disabled. Run `loopkit coach --on` to enable.");
    return;
  }

  ceremonyIntro("AI Coach");
  console.log(shortcutsHint());

  // ─── Generate coaching plan ───────────────────────────────────
  const s = spinner();
  s.start("Analyzing your shipping data...");

  const plan = getCoachingPlan(slug);

  s.stop("Analysis complete.");

  if (!plan || plan.moments.length === 0) {
    clog.step("Not Enough Data Yet");
    clog.message("Coaching needs at least 2 weeks of loop data.");
    clog.message(
      "Run `loopkit loop` for a few weeks to unlock personalized coaching.",
    );
    clog.step("Next Step");
    clog.info(`Run ${colors.primary.bold("loopkit loop")} for a few weeks to unlock coaching.`);
    ceremonyOutro("Keep shipping. Coaching will get smarter every week.");
    return;
  }

  // ─── Show full plan ───────────────────────────────────────────
  console.log(coachingPlanCard(plan));

  // ─── Interactive: acknowledge each moment ─────────────────────
  for (const moment of plan.moments) {
    const ack = await confirm({
      message: `Acknowledge: ${moment.title}?`,
    });

    if (isCancel(ack)) {
      ceremonyOutro("Coaching cancelled.");
      return;
    }

    if (ack) {
      recordMomentShown(moment.id);
      clog.success("Marked as seen");
    }
  }

  clog.step("Next Step");
  clog.info(`Run ${colors.primary.bold("loopkit loop")} to check in.`);
  ceremonyOutro("Coaching complete. See you next week.");
}
