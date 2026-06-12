import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-pricing-"));

import { gatherPricingContext } from "../pricing.js";
import {
  readBriefJson,
  writeConfig,
  appendPulseResponse,
  saveShipLog,
  appendRevenueEntry,
} from "../../storage/local.js";
import { renderPricingTerminal, renderPricingMarkdown } from "../../ui/pricing-render.js";
import { buildPricingPrompt } from "../../ai/prompts/pricing.js";
import type { PricingRecommendation } from "@loopkit/shared";

describe("gatherPricingContext", () => {
  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    process.chdir(tmpDir);
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
    writeConfig({ version: 1, activeProject: "test" });
  });

  it("returns safe defaults with no project", () => {
    const ctx = gatherPricingContext("test");
    expect(ctx.projectName).toBe("test");
    expect(ctx.icp).toBe("unknown");
    expect(ctx.hasRevenue).toBe(false);
    expect(ctx.pricingMentionsInPulse).toBe(0);
  });

  it("counts pricing mentions in pulse responses", () => {
    appendPulseResponse("Love this but the pricing seems steep");
    appendPulseResponse("I'd happily pay for this");
    appendPulseResponse("The onboarding flow is great");
    appendPulseResponse("What's the price?");
    const ctx = gatherPricingContext("test");
    expect(ctx.pricingMentionsInPulse).toBeGreaterThanOrEqual(3);
  });

  it("detects pay-intent phrases", () => {
    appendPulseResponse("I would pay for this in a heartbeat");
    appendPulseResponse("Take my money, please add this feature");
    const ctx = gatherPricingContext("test");
    expect(ctx.payIntentMentionsInPulse).toBe(2);
  });

  it("marks hasRevenue when MRR > 0", () => {
    appendRevenueEntry({
      date: "2026-06-01",
      weekNumber: 22,
      mrr: 240,
      currency: "USD",
      source: "stripe",
    });
    const ctx = gatherPricingContext("test");
    expect(ctx.hasRevenue).toBe(true);
    expect(ctx.currentMRR).toBe(240);
  });
});

describe("buildPricingPrompt", () => {
  it("includes ICP and problem in the prompt", () => {
    const prompt = buildPricingPrompt({
      projectName: "TestApp",
      productType: "AI tool for indie founders",
      icp: "Solo founders shipping weekly",
      problem: "Founders ship inconsistently",
      mvp: "A CLI that tracks weekly tasks",
      hasRevenue: false,
      currentMRR: null,
      recentShipped: false,
      pricingMentionsInPulse: 0,
      payIntentMentionsInPulse: 0,
      hasAnyFeedback: false,
      weeksOfData: 0,
    });
    expect(prompt).toContain("Solo founders shipping weekly");
    expect(prompt).toContain("Founders ship inconsistently");
    expect(prompt).toContain("TestApp");
  });

  it("includes pricing signals when present", () => {
    const prompt = buildPricingPrompt({
      projectName: "TestApp",
      productType: "tool",
      icp: "indie founders",
      problem: "shipping consistency",
      mvp: "CLI",
      hasRevenue: false,
      currentMRR: null,
      recentShipped: false,
      pricingMentionsInPulse: 5,
      payIntentMentionsInPulse: 2,
      hasAnyFeedback: true,
      weeksOfData: 0,
    });
    expect(prompt).toContain("5 pulse responses mention pricing");
    expect(prompt).toContain("2 responses include explicit pay-intent");
  });
});

describe("renderPricingTerminal", () => {
  it("renders all sections", () => {
    const rec: PricingRecommendation = {
      recommendedModel: "freemium",
      modelRationale: "Solo founders with low price sensitivity under $50/mo convert best with a free tier and one paid upgrade.",
      tiers: [
        { name: "Free", price: 0, cadence: "monthly", features: ["1 project"], targetCustomer: "Anyone." },
        { name: "Pro", price: 19, cadence: "monthly", features: ["Unlimited projects", "AI synthesis"], targetCustomer: "Solo founders." },
      ],
      validationExperiment: "Charge 10 ICP founders $19/mo for 30 days.",
      risksToTest: ["Will ICP pay monthly?"],
      priceTooLow: "You'll burn out on $5/mo support.",
      priceTooHigh: "Solo founders abandon at $50+.",
    };
    const out = renderPricingTerminal(rec);
    expect(out).toContain("freemium");
    expect(out).toContain("Free");
    expect(out).toContain("Pro");
    expect(out).toContain("$19/mo");
    expect(out).toContain("30-day experiment");
    expect(out).toContain("Price too low");
    expect(out).toContain("Price too high");
  });
});

describe("renderPricingMarkdown", () => {
  it("renders a complete markdown document", () => {
    const rec: PricingRecommendation = {
      recommendedModel: "subscription",
      modelRationale: "Recurring revenue funds the roadmap.",
      tiers: [
        { name: "Free", price: 0, cadence: "monthly", features: ["1 project"], targetCustomer: "Curious." },
        { name: "Solo", price: 19, cadence: "monthly", features: ["Unlimited", "AI"], targetCustomer: "Indie." },
      ],
      validationExperiment: "Test $19/mo for 30 days.",
      risksToTest: ["Churn risk?"],
      priceTooLow: "Won't fund roadmap.",
      priceTooHigh: "Abandon.",
    };
    const md = renderPricingMarkdown(rec);
    expect(md).toContain("# Pricing recommendation");
    expect(md).toContain("**Recommended model:** subscription");
    expect(md).toContain("### Free");
    expect(md).toContain("### Solo");
    expect(md).toContain("## 30-day experiment");
  });
});
