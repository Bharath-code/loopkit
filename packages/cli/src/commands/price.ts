/**
 * loopkit price — Pricing Copilot.
 *
 * Reads the founder's brief, recent ships, and pulse feedback. Generates
 * a 2-3 tier pricing model with a 30-day validation experiment.
 *
 * Usage:
 *   loopkit price                 # default: full AI recommendation
 *   loopkit price --local        # show local context only (no AI call)
 *   loopkit price --export md    # save to .loopkit/pricing/YYYY-MM-DD.md
 *   loopkit price --experiment 30 # add a 30-day reminder to track conversion
 */

import fs from "node:fs";
import path from "node:path";
import { PricingRecommendationSchema, type PricingRecommendation } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { PRICING_SYSTEM_PROMPT, buildPricingPrompt } from "../ai/prompts/pricing.js";
import { gatherPricingContext, type PricingContext } from "../analytics/pricing.js";
import { renderPricingTerminal, renderPricingMarkdown } from "../ui/pricing-render.js";
import {
  ceremonyIntro,
  ceremonyOutro,
  clog,
  colors,
  box,
  spinner,
  info,
  isCancel,
  confirm,
  scoreBar,
} from "../ui/theme.js";
import { getRoot, readConfig, writeConfig } from "../storage/local.js";
import { shouldShowSyncBanner } from "./sync.js";

interface PriceOptions {
  local?: boolean;
  export?: "md";
  experiment?: number;
}

export async function priceCommand(options: PriceOptions = {}): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  ceremonyIntro("Pricing Copilot", {
    tagline: "From the brief, recent ships, and pulse — a testable price.",
  });

  if (shouldShowSyncBanner()) {
    clog.warn("Your dashboard isn't syncing. Run `loopkit sync status`.");
  }

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    ceremonyOutro("Cancelled.");
    return;
  }

  // ── Gather context (no AI) ───────────────────────────────────────
  const s = spinner();
  s.start("Reading your brief, ships, and pulse…");

  const ctx = gatherPricingContext(slug);
  s.stop(`Read context for ${ctx.projectName}.`);

  // ── Local-only mode ──────────────────────────────────────────────
  if (options.local) {
    console.log(renderLocalContext(ctx));
    ceremonyOutro("Run `loopkit price` (without --local) for the AI recommendation.");
    return;
  }

  // ── Pre-flight check: need at least a brief ──────────────────────
  if (ctx.productType === "unknown" || ctx.icp === "unknown") {
    clog.error("Pricing needs a brief. Run `loopkit init` first.");
    ceremonyOutro("Cancelled.");
    return;
  }

  // ── AI synthesis ───────────────────────────────────────────────
  const ai = spinner();
  ai.start("Modeling tiers and a 30-day experiment…");

  let rec: PricingRecommendation;
  try {
    const generated = await generateStructured({
      command: "loop",
      system: PRICING_SYSTEM_PROMPT,
      prompt: buildPricingPrompt(ctx),
      schema: PricingRecommendationSchema,
      tier: "creative",
      temperature: 0.5,
    });
    rec = generated;
    ai.stop("Recommendation ready.");
  } catch (err) {
    ai.stop("AI unavailable.");
    clog.error(
      `Could not generate pricing: ${err instanceof Error ? err.message : String(err)}`,
    );
    console.log(renderLocalContext(ctx));
    ceremonyOutro("Try again when AI is available.");
    return;
  }

  // ── Render ─────────────────────────────────────────────────────
  console.log(renderPricingTerminal(rec));

  // ── Export ─────────────────────────────────────────────────────
  if (options.export === "md") {
    const out = exportMarkdown(rec);
    clog.success(`Exported to ${out}`);
  } else {
    const wantExport = await confirm({
      message: "Export as Markdown?",
    });
    if (!isCancel(wantExport) && wantExport) {
      const out = exportMarkdown(rec);
      clog.success(`Exported to ${out}`);
    }
  }

  // ── Experiment reminder ────────────────────────────────────────
  if (options.experiment && options.experiment > 0) {
    addExperimentReminder(options.experiment);
    clog.success(
      `Added a ${options.experiment}-day reminder. Run \`loopkit loop\` after to log conversion.`,
    );
  } else {
    const wantReminder = await confirm({
      message: "Add a 30-day reminder to log conversion results?",
    });
    if (!isCancel(wantReminder) && wantReminder) {
      addExperimentReminder(30);
      clog.success(
        "Added a 30-day reminder. Run `loopkit loop` after to log conversion.",
      );
    }
  }

  info("Tip: revisit `loopkit price` after 4 weeks of real data. Pricing is a hypothesis until you've tested it.");
  ceremonyOutro("Done. Don't ship a price you haven't tested.");
}

function renderLocalContext(ctx: PricingContext): string {
  const lines = [
    colors.brand.bold("Local context (no AI)"),
    "",
    `${colors.muted("Project:")} ${ctx.projectName}`,
    `${colors.muted("ICP:")} ${ctx.icp}`,
    `${colors.muted("Problem:")} ${ctx.problem}`,
    `${colors.muted("MVP:")} ${ctx.mvp}`,
    "",
    `${colors.muted("Has revenue:")} ${ctx.hasRevenue ? `yes ($${ctx.currentMRR}/mo)` : "no"}`,
    `${colors.muted("Recent ship:")} ${ctx.recentShipped ? "yes" : "no"}`,
    `${colors.muted("Pulse responses:")} ${ctx.hasAnyFeedback ? "yes" : "no"}`,
    `${colors.muted("Pricing mentions in pulse:")} ${ctx.pricingMentionsInPulse}`,
    `${colors.muted("Pay-intent mentions:")} ${ctx.payIntentMentionsInPulse}`,
    "",
    colors.dim("(Run `loopkit price` without --local to get the AI recommendation.)"),
  ];
  return box(lines.join("\n"), "Pricing context");
}

function exportMarkdown(rec: PricingRecommendation): string {
  const dir = path.join(getRoot(), "pricing");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().split("T")[0];
  const out = path.join(dir, `pricing-${stamp}.md`);
  fs.writeFileSync(out, renderPricingMarkdown(rec), "utf-8");
  return out;
}

interface ExperimentReminder {
  startDate: string;
  days: number;
  prompt: string;
}

function addExperimentReminder(days: number): void {
  const config = readConfig();
  const reminders = (config as { experiments?: ExperimentReminder[] }).experiments ?? [];
  reminders.push({
    startDate: new Date().toISOString(),
    days,
    prompt: "Time to log your pricing experiment results. How many conversions?",
  });
  (config as { experiments?: ExperimentReminder[] }).experiments = reminders;
  writeConfig(config);
}
