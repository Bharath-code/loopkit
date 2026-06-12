import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-annual-"));

import { gatherAnnualSummary } from "../annual.js";
import { saveLoopLogWithFrontmatter } from "../../commands/loop/saveLoopLog.js";
import { writeConfig } from "../../storage/local.js";
import { renderAnnualCardCli } from "../../commands/celebrate.js";

function seedWeek(week: number, year: number, score: number, tasks: number, total: number): void {
  const date = `${year}-${String((week % 12) + 1).padStart(2, "0")}-15`;
  const body = `# Week ${week} — ${date} | project:test\n\n## Summary\n- Tasks completed: ${tasks}\n- Tasks open: ${total - tasks}\n- Shipping score: ${score}%\n`;
  saveLoopLogWithFrontmatter({
    week,
    date,
    project: "test",
    tasksCompleted: tasks,
    tasksTotal: total,
    shippingScore: score,
    loopkitScore: score,
    streak: 1,
    override: false,
    tension: null,
    body,
  });
}

describe("gatherAnnualSummary", () => {
  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    process.chdir(tmpDir);
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
    writeConfig({ version: 1, activeProject: "test" });
  });

  it("returns empty summary with no data", () => {
    const s = gatherAnnualSummary(2026, "test");
    expect(s.totalWeeks).toBe(0);
    expect(s.averageScore).toBe(0);
    expect(s.bestWeek).toBeNull();
  });

  it("aggregates weeks with date filter", () => {
    seedWeek(20, 2026, 60, 3, 5);
    seedWeek(21, 2026, 80, 4, 5);
    seedWeek(22, 2026, 90, 5, 5);
    // Different year
    seedWeek(30, 2025, 100, 5, 5);

    const s = gatherAnnualSummary(2026, "test");
    expect(s.totalWeeks).toBe(3);
    expect(s.averageScore).toBe(Math.round((60 + 80 + 90) / 3));
    expect(s.bestWeek?.shippingScore).toBe(90);
  });

  it("identifies best and worst weeks", () => {
    seedWeek(10, 2026, 30, 1, 5);
    seedWeek(11, 2026, 50, 2, 5);
    seedWeek(12, 2026, 95, 5, 5);
    seedWeek(13, 2026, 75, 4, 5);

    const s = gatherAnnualSummary(2026, "test");
    expect(s.bestWeek?.shippingScore).toBe(95);
    expect(s.worstWeek?.shippingScore).toBe(30);
  });

  it("computes longest streak of non-zero weeks", () => {
    seedWeek(10, 2026, 0, 0, 5);
    seedWeek(11, 2026, 50, 2, 5);
    seedWeek(12, 2026, 60, 3, 5);
    seedWeek(13, 2026, 70, 4, 5);
    seedWeek(14, 2026, 80, 4, 5);
    seedWeek(15, 2026, 90, 5, 5);
    seedWeek(16, 2026, 0, 0, 5);

    const s = gatherAnnualSummary(2026, "test");
    expect(s.longestStreak).toBe(5);
  });

  it("sums total tasks completed", () => {
    seedWeek(20, 2026, 50, 3, 5);
    seedWeek(21, 2026, 60, 4, 5);
    seedWeek(22, 2026, 70, 2, 5);
    const s = gatherAnnualSummary(2026, "test");
    expect(s.totalTasksCompleted).toBe(9);
  });
});
