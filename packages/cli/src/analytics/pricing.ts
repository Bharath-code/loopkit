/**
 * Pricing copilot data layer.
 *
 * Pure, rule-based. Gathers the facts the AI will interpret:
 * - The founder's brief (what they're building, for whom)
 * - Recent ships (momentum + category)
 * - Pulse feedback that hints at willingness-to-pay
 * - Existing revenue history (if any)
 *
 * No AI calls. The AI prompt is responsible for synthesizing the
 * recommendation; this layer is responsible for giving it clean inputs.
 */

import { readBriefJson, readRevenueHistory, readPulseResponses, readShipLog } from "../storage/local.js";

export interface PricingContext {
  projectName: string;
  productType: string;
  icp: string;
  problem: string;
  mvp: string;
  hasRevenue: boolean;
  currentMRR: number | null;
  recentShipped: boolean;
  pricingMentionsInPulse: number;
  payIntentMentionsInPulse: number;
  hasAnyFeedback: boolean;
  weeksOfData: number;
}

const PRICING_KEYWORDS = /\b(pricing|price|prices|cost|expensive|cheap|afford|pay|paid|charge|chargeback|subscription|tier|free trial|trial)\b/i;
const PAY_INTENT_KEYWORDS = /\b(would pay|happy to pay|worth paying|charge me|take my money|sign me up|preorder|pre-order|presale|pre-sale)\b/i;

export function gatherPricingContext(slug: string): PricingContext {
  const brief = readBriefJson(slug);
  const pulse = readPulseResponses();
  const shipLog = readShipLog();
  const revenue = readRevenueHistory();

  const pricingMentionsInPulse = pulse.filter((r) => PRICING_KEYWORDS.test(r)).length;
  const payIntentMentionsInPulse = pulse.filter((r) => PAY_INTENT_KEYWORDS.test(r)).length;

  return {
    projectName: brief?.answers?.name ?? slug,
    productType: brief?.brief?.mvpPlainEnglish ?? "unknown",
    icp: brief?.answers?.icp ?? "unknown",
    problem: brief?.answers?.problem ?? "unknown",
    mvp: brief?.answers?.mvp ?? "unknown",
    hasRevenue: revenue.length > 0 && revenue.some((r) => r.mrr > 0),
    currentMRR: revenue.length > 0 ? revenue[revenue.length - 1].mrr : null,
    recentShipped: !!shipLog,
    pricingMentionsInPulse,
    payIntentMentionsInPulse,
    hasAnyFeedback: pulse.length > 0,
    weeksOfData: revenue.length,
  };
}
