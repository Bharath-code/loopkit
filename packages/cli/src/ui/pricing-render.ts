/**
 * Pricing recommendation renderer.
 *
 * Renders a comparison-table-friendly display in the terminal, with the
 * recommended model, the tier matrix, the validation experiment, and
 * the two failure-mode warnings.
 */

import type { PricingRecommendation } from "@loopkit/shared";
import { colors, box, badge, divider } from "./theme.js";

function formatPrice(price: number, cadence: string): string {
  if (price === 0) return "Free";
  if (cadence === "one-time") return `$${price} one-time`;
  if (cadence === "annual") return `$${price}/yr`;
  if (cadence === "per-use") return `$${price}/use`;
  return `$${price}/mo`;
}

export function renderPricingTerminal(rec: PricingRecommendation): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(`  ${colors.bold("Recommended model:")} ${badge(rec.recommendedModel, "success")}`);
  lines.push(`  ${colors.dim(rec.modelRationale)}`);
  lines.push("");

  // Tier table
  lines.push(divider(colors.primary("Tier matrix")));
  lines.push("");

  const tierColWidth = 14;
  const priceColWidth = 12;

  // Header
  lines.push(
    `  ${colors.muted("Tier".padEnd(tierColWidth))}${colors.muted("Price".padEnd(priceColWidth))}${colors.muted("For")}`,
  );

  for (const tier of rec.tiers) {
    const priceStr = formatPrice(tier.price, tier.cadence);
    const isFree = tier.price === 0;
    const tierColor = isFree ? colors.muted : colors.white.bold;
    const features = tier.features.map((f) => `     ${colors.dim("•")} ${f}`).join("\n");

    lines.push(
      `  ${tierColor(tier.name.padEnd(tierColWidth))}${colors.secondary(priceStr.padEnd(priceColWidth))}${colors.white(tier.targetCustomer)}`,
    );
    if (features) {
      lines.push(features);
    }
    lines.push("");
  }

  // Experiment
  lines.push(divider(colors.primary("30-day experiment")));
  lines.push("");
  lines.push(`  ${rec.validationExperiment}`);
  lines.push("");

  // Risk warnings
  lines.push(divider(colors.warning("Failure modes")));
  lines.push("");
  lines.push(`  ${colors.danger("Price too low:")} ${rec.priceTooLow}`);
  lines.push(`  ${colors.danger("Price too high:")} ${rec.priceTooHigh}`);
  lines.push("");

  if (rec.risksToTest.length > 0) {
    lines.push(divider(colors.primary("Risks to test")));
    lines.push("");
    for (const risk of rec.risksToTest) {
      lines.push(`  ${colors.warning("•")} ${risk}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Render pricing as Markdown (for export or share).
 */
export function renderPricingMarkdown(rec: PricingRecommendation): string {
  const lines: string[] = [
    `# Pricing recommendation`,
    "",
    `**Recommended model:** ${rec.recommendedModel}`,
    "",
    rec.modelRationale,
    "",
    `## Tiers`,
    "",
  ];

  for (const tier of rec.tiers) {
    const price = formatPrice(tier.price, tier.cadence);
    lines.push(`### ${tier.name} — ${price}`);
    lines.push("");
    lines.push(`*For:* ${tier.targetCustomer}`);
    lines.push("");
    for (const f of tier.features) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  lines.push(`## 30-day experiment`);
  lines.push("");
  lines.push(rec.validationExperiment);
  lines.push("");

  lines.push(`## Failure modes`);
  lines.push("");
  lines.push(`- **Price too low:** ${rec.priceTooLow}`);
  lines.push(`- **Price too high:** ${rec.priceTooHigh}`);
  lines.push("");

  if (rec.risksToTest.length > 0) {
    lines.push(`## Risks to test`);
    lines.push("");
    for (const r of rec.risksToTest) {
      lines.push(`- ${r}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
