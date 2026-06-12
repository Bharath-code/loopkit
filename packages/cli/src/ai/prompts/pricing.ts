/**
 * Pricing copilot prompt.
 *
 * Tone target: like a YC partner who has seen 200 launches price wrong.
 * Specific, not generic. Recommends a *testable* experiment, not a
 * "build a brand" strategy.
 *
 * Few-shot rules: every recommendation must reference the actual ICP
 * and problem from the brief. If pulse feedback mentions pricing, the
 * recommended model must address that signal directly.
 */

import type { PricingContext } from "../../analytics/pricing.js";

export const PRICING_SYSTEM_PROMPT = `You are a YC partner advising a solo technical founder on pricing.

You've seen 200 launches. The most common mistake is charging too little for too long. The second most common is building a 5-tier matrix when 2 tiers would do.

Your job: recommend a testable pricing model with 2-3 tiers, plus a 30-day experiment to validate it. Not a strategy deck. A specific thing to do next week.

Style rules:
- Reference the actual ICP and problem from the brief.
- If pulse feedback mentions pricing, your recommendation must address that signal.
- tiers[0] is always free or low-friction. tiers[1] is the main conversion target. tiers[2] (if present) is enterprise/power.
- priceTooLow / priceTooHigh: concrete failure modes ("you'll burn out doing $5/mo support") not platitudes.
- validationExperiment: a specific 30-day test, with sample size.

Do not include preamble. Do not include "Here's your pricing:". Start with the JSON.`;

export function buildPricingPrompt(ctx: PricingContext): string {
  const signals: string[] = [];
  if (ctx.pricingMentionsInPulse >= 3) {
    signals.push(`${ctx.pricingMentionsInPulse} pulse responses mention pricing/price/charge → strong willingness-to-pay signal`);
  }
  if (ctx.payIntentMentionsInPulse >= 1) {
    signals.push(`${ctx.payIntentMentionsInPulse} responses include explicit pay-intent phrases (e.g. "would pay", "charge me", "take my money")`);
  }
  if (ctx.hasRevenue) {
    signals.push(`Already at $${ctx.currentMRR}/mo MRR → validate scaling, not initial pricing`);
  } else {
    signals.push("Pre-revenue → initial pricing matters most");
  }
  if (!ctx.recentShipped) {
    signals.push("Hasn't shipped publicly yet → pricing recommendation is premature; ship first");
  }
  if (ctx.weeksOfData > 0) {
    signals.push(`${ctx.weeksOfData} weeks of loop data`);
  }

  return `Founder pricing brief:

Project: ${ctx.projectName}
What it is: ${ctx.productType}
ICP: ${ctx.icp}
Problem: ${ctx.problem}
MVP description: ${ctx.mvp}

Current state:
- Has revenue: ${ctx.hasRevenue}
- Current MRR: ${ctx.currentMRR !== null ? `$${ctx.currentMRR}/mo` : "none"}
- Shipped publicly: ${ctx.recentShipped ? "yes" : "no"}
- Pulse responses total: ${ctx.hasAnyFeedback ? "yes" : "no"}
- Pricing mentions in pulse: ${ctx.pricingMentionsInPulse}
- Pay-intent mentions in pulse: ${ctx.payIntentMentionsInPulse}
- Weeks of data: ${ctx.weeksOfData}

Signals:
${signals.map((s) => `  - ${s}`).join("\n") || "  - none"}

Generate 2-3 pricing tiers with a concrete 30-day validation experiment. The recommended model should match the ICP's buying behavior (B2B = subscription; indie = one-time; API/usage = usage-based; etc.).`;
}
