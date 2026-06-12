/**
 * Post-loop actions: revenue prompt, milestones, referral, override check.
 * Extracted from commands/loop.ts to keep the orchestrator focused.
 */

import {
  readConfig,
  writeConfig,
  readPulseResponses,
  readRevenueHistory,
  appendRevenueEntry,
  getLatestMRR,
} from "../../storage/local.js";
import { triggerMilestone } from "../../storage/sync.js";
import {
  box,
  ceremonyOutro,
  clog,
  colors,
  confirm,
  isCancel,
  note,
  text,
} from "../../ui/theme.js";
import type { LoopProof } from "./helpers.js";
import { detectHighOverrideRate } from "./helpers.js";

// ─── Override Rate Warning ──────────────────────────────────────

export function checkOverrideRate(slug: string): void {
  const result = detectHighOverrideRate(slug);
  if (!result) return;

  clog.warn(
    `Override rate: ${result.overrideCount}/${result.window} weeks — you've changed the AI recommendation more than half the time.`
  );
  clog.message(
    "  This may mean the AI needs better context. Try updating your brief: `loopkit init --analyze`"
  );
}

// ─── GF-4: Revenue Prompt ───────────────────────────────────────

export async function maybePromptRevenue(_slug: string, weekNum: number): Promise<void> {
  const latestMRR = getLatestMRR();
  const history = readRevenueHistory();

  const message =
    latestMRR !== null
      ? `Update MRR? (current: $${latestMRR})`
      : "Any revenue to log? (MRR in USD — press Enter to skip)";

  const revenueAnswer = await text({
    message,
    placeholder: latestMRR !== null ? `${latestMRR}` : "0 — skip with Enter",
  });

  if (isCancel(revenueAnswer)) return;

  const raw = (revenueAnswer as string).trim();
  if (!raw || raw === "0" || raw === "") return;

  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed) || parsed < 0) return;

  const mrr = Math.round(parsed * 100) / 100;
  const prev = history.length > 0 ? history[history.length - 1] : null;
  const delta = prev ? mrr - prev.mrr : null;

  appendRevenueEntry({
    date: new Date().toISOString().split("T")[0],
    weekNumber: weekNum,
    mrr,
    currency: "USD",
    source: "manual",
  });

  if (history.length === 0) {
    clog.success(`🎉 First revenue! MRR: $${mrr} — you're in business.`);
  } else {
    const deltaStr =
      delta !== null && delta !== 0
        ? delta > 0
          ? colors.success(` ↑+$${delta}`)
          : colors.danger(` ↓$${Math.abs(delta)}`)
        : "";
    clog.success(`MRR updated: $${mrr}${deltaStr}`);
  }
}

// ─── Referral Code Generator ─────────────────────────────────────

export function generateReferralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function maybePromptReferral(currentStreak: number): Promise<void> {
  if (currentStreak < 4) return;

  const config = readConfig();
  if (config.referralShown) return;

  const wantReferral = await confirm({
    message: "Share LoopKit with a founder friend and get 1 month of Solo free?",
  });

  if (isCancel(wantReferral) || !wantReferral) return;

  const referralCode = generateReferralCode();
  note(
    `loopkit.dev/r/${referralCode}\n\nShare this link — when a friend signs up, you both get 1 month free.`,
    "Your Referral Link 🎁",
  );
  config.referralShown = true;
  config.referralCode = referralCode;
  writeConfig(config);
}

// ─── GF-3: Milestone Detection ──────────────────────────────────

export interface MilestoneDetectionContext {
  slug: string;
  weekNum: number;
  proof: LoopProof;
  convexProjectId: string | undefined;
  currentStreak: number;
  pulseResponses: number;
}

export async function detectAndTriggerMilestones(ctx: MilestoneDetectionContext): Promise<void> {
  const { weekNum, proof, convexProjectId, currentStreak } = ctx;

  // Milestone 1: Week 1 complete
  if (weekNum === 1 && proof.weeksActive === 1) {
    await triggerMilestone({
      milestoneType: "week_1_complete",
      projectId: convexProjectId,
      metadata: { weekNumber: weekNum },
    });
    clog.step("🎉 Milestone");
    console.log(box("You shipped your first week. 70% of founders quit by week 2. You're in the top 30%."));
  }

  // Milestone 2: Week 4 complete
  if (weekNum === 4 && proof.weeksActive === 4) {
    await triggerMilestone({
      milestoneType: "week_4_complete",
      projectId: convexProjectId,
      metadata: { weekNumber: weekNum },
    });
    clog.step("🎉 Milestone");
    console.log(box("One month straight. Here's your pattern analysis — check your shipping DNA above."));
  }

  // Milestone 3: First revenue signal
  const latestMRR = getLatestMRR();
  const revenueHistory = readRevenueHistory();
  if (latestMRR !== null && latestMRR > 0 && revenueHistory.length === 1) {
    await triggerMilestone({
      milestoneType: "first_revenue",
      projectId: convexProjectId,
      metadata: { mrr: latestMRR, weekNumber: weekNum },
    });
    clog.step("💰 Milestone");
    console.log(box("First revenue signal! You've crossed the chasm from builder to business."));
  }

  // Milestone 4: Streak break
  if (currentStreak === 1 && proof.weeksActive >= 2) {
    await triggerMilestone({
      milestoneType: "streak_break",
      projectId: convexProjectId,
      metadata: { weekNumber: weekNum, weeksActive: proof.weeksActive },
    });
    clog.step("📊 Milestone");
    console.log(box("You missed a week. 47 other founders ran loopkit loop yesterday. Get back in the game!"));
  }

  // Milestone 5: Pricing signal in pulse feedback
  const pulseData = readPulseResponses();
  const pricingMentions = pulseData.filter((r) =>
    r.toLowerCase().includes("pricing") ||
    r.toLowerCase().includes("price") ||
    r.toLowerCase().includes("pay") ||
    r.toLowerCase().includes("charge"),
  ).length;

  if (pricingMentions >= 3 && latestMRR === null) {
    await triggerMilestone({
      milestoneType: "pricing_signal",
      projectId: convexProjectId,
      metadata: { weekNumber: weekNum, pricingMentions },
    });
    clog.step("🎯 Milestone");
    console.log(box("Pulse feedback mentions 'pricing' 3 times — time to charge for what you've built."));
  }
}

// ─── Upgrade Intent Prompt ──────────────────────────────────────

import { recordEvent } from "../../analytics/telemetry.js";

export async function maybeShowUpgradeIntent(proof: LoopProof): Promise<void> {
  if (proof.weeksActive !== 4 && proof.weeksActive !== 8) return;

  const isWeek8 = proof.weeksActive === 8;
  const message = isWeek8
    ? `${proof.weeksActive} weeks of data — want the dashboard and AI proxy to go deeper?`
    : "You're 4 weeks in — this is when the dashboard starts compounding. Want to unlock it?";

  const wantsUpgrade = await confirm({ message });

  if (isCancel(wantsUpgrade) || !wantsUpgrade) return;

  recordEvent({ command: "upgrade:intent:solo" });
  clog.info("Upgrade path: /login?intent=upgrade&plan=solo&source=cli-loop");
}

export async function closeLoopOutro(weekNum: number): Promise<void> {
  await ceremonyOutro(`Week ${weekNum} closed. You made the next move visible.`);
}
