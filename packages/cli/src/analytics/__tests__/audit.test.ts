import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-audit-"));

import { gatherAuditFacts, compareToCohort } from "../audit.js";
import { saveLoopLogWithFrontmatter } from "../../commands/loop/saveLoopLog.js";
import { readConfig, writeConfig } from "../../storage/local.js";
import { renderAuditMarkdown } from "../../ui/audit-render.js";
import type { AuditReport } from "@loopkit/shared";

function seedWeek(week: number, score: number, tasks: number, total: number, opts: { override?: boolean; tension?: string | null } = {}): void {
  const body = [
    `# Week ${week} — 2026-0${Math.min(9, week)}-${String((week % 28) + 1).padStart(2, "0")} | project:test`,
    "",
    "## Summary",
    `- Tasks completed: ${tasks}`,
    `- Tasks open: ${total - tasks}`,
    `- Shipping score: ${score}%`,
    "",
    "## What Moved Forward",
    "Some progress.",
  ].join("\n");
  saveLoopLogWithFrontmatter({
    week,
    date: `2026-0${Math.min(9, week)}-${String((week % 28) + 1).padStart(2, "0")}`,
    project: "test",
    tasksCompleted: tasks,
    tasksTotal: total,
    shippingScore: score,
    loopkitScore: score,
    streak: 1,
    override: opts.override ?? false,
    tension: opts.tension ?? null,
    body,
  });
}

describe("gatherAuditFacts", () => {
  beforeEach(() => {
    // Re-create tmp dir if a prior afterEach removed it
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    process.chdir(tmpDir);
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
    writeConfig({ version: 1, activeProject: "test" });
  });

  it("returns hasEnoughData=false with no logs", () => {
    const facts = gatherAuditFacts(8);
    expect(facts.hasEnoughData).toBe(false);
    expect(facts.periodWeeks).toBe(0);
  });

  it("gathers facts from seeded weeks", () => {
    seedWeek(20, 60, 3, 5);
    seedWeek(21, 70, 4, 5);
    seedWeek(22, 80, 5, 5);

    const facts = gatherAuditFacts(8);
    expect(facts.hasEnoughData).toBe(true);
    expect(facts.periodWeeks).toBe(3);
    expect(facts.totalTasksCompleted).toBe(12);
    expect(facts.currentShippingScore).toBeGreaterThan(0);
  });

  it("computes accelerating velocity when scores trend up", () => {
    seedWeek(15, 30, 1, 5);
    seedWeek(16, 40, 2, 5);
    seedWeek(17, 50, 3, 5);
    seedWeek(18, 60, 3, 5);
    seedWeek(19, 70, 4, 5);
    seedWeek(20, 80, 4, 5);

    const facts = gatherAuditFacts(8);
    expect(facts.velocityTrend).toBe("accelerating");
  });

  it("computes declining velocity when scores trend down", () => {
    seedWeek(15, 80, 4, 5);
    seedWeek(16, 70, 3, 5);
    seedWeek(17, 60, 3, 5);
    seedWeek(18, 50, 2, 5);
    seedWeek(19, 40, 2, 5);
    seedWeek(20, 30, 1, 5);

    const facts = gatherAuditFacts(8);
    expect(facts.velocityTrend).toBe("declining");
  });

  it("computes override rate", () => {
    seedWeek(20, 50, 2, 5);
    seedWeek(21, 60, 3, 5, { override: true });
    seedWeek(22, 70, 3, 5);
    seedWeek(23, 80, 4, 5, { override: true });

    const facts = gatherAuditFacts(8);
    expect(facts.overrideRate).toBe(0.5);
  });
});

describe("compareToCohort", () => {
  it("returns structured comparison with synthetic medians", () => {
    const facts = {
      periodWeeks: 8,
      weeks: [],
      totalTasksCompleted: 32,
      totalTasksShipped: 6,
      totalPulseResponses: 5,
      overrideRate: 0.1,
      feedbackActedOnRate: 0.5,
      velocityTrend: "steady" as const,
      currentStreak: 4,
      currentShippingScore: 70,
      dnaPattern: "Marathoner",
      activePatterns: [],
      churnLevel: "low" as const,
      hasEnoughData: true,
    };
    const c = compareToCohort(facts);
    expect(c.streak.you).toBe(4);
    expect(c.streak.cohortMedian).toBe(3);
    expect(c.tasksPerWeek.you).toBe(4);
    expect(c.tasksPerWeek.cohortMedian).toBe(4);
  });
});

describe("renderAuditMarkdown", () => {
  it("renders a complete markdown report", () => {
    const report: AuditReport = {
      periodWeeks: 4,
      totalTasksCompleted: 12,
      totalTasksShipped: 3,
      totalPulseResponses: 5,
      overrideRate: 0.25,
      feedbackActedOnRate: 0.5,
      velocityTrend: "accelerating",
      patternEvolution: [
        { week: 1, dominantTaskType: "product", note: "shipped the auth" },
        { week: 2, dominantTaskType: "product", note: "fixed the bug" },
      ],
      comparedToCohort: {
        shippingScore: { you: 75, cohortMedian: 55 },
        streak: { you: 4, cohortMedian: 3 },
        tasksPerWeek: { you: 3, cohortMedian: 4 },
      },
      topAvoidancePattern: "You skip distribution tasks in 3 of 4 weeks.",
      biggestInsight: "Your shipping score went up 15% after you started shipping weekly.",
      oneChangeForNextMonth: "Block 90 minutes every Tuesday for distribution tasks.",
      riskIfUnchanged: "Stuck in builder mode; revenue stays at $0.",
    };
    const facts = {
      periodWeeks: 4,
      weeks: [],
      totalTasksCompleted: 12,
      totalTasksShipped: 3,
      totalPulseResponses: 5,
      overrideRate: 0.25,
      feedbackActedOnRate: 0.5,
      velocityTrend: "accelerating" as const,
      currentStreak: 4,
      currentShippingScore: 75,
      dnaPattern: "Marathoner",
      activePatterns: [],
      churnLevel: "low" as const,
      hasEnoughData: true,
    };
    const md = renderAuditMarkdown(report, facts);
    expect(md).toContain("# Founder Audit");
    expect(md).toContain("## What you keep skipping");
    expect(md).toContain("## What the data shows");
    expect(md).toContain("## One change for next month");
    expect(md).toContain("Risk if unchanged");
    expect(md).toContain("distribution tasks in 3 of 4 weeks");
  });
});
