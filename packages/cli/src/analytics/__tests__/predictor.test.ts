import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../storage/local.js", () => ({
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
  readBriefJson: vi.fn(),
}));

import { readLastNLoopLogs, readLoopLog } from "../../storage/local.js";
import { predictSuccess, renderPrediction } from "../predictor.js";

function makeLoopLog(opts: {
  week: number;
  completed: number;
  open: number;
  score: number;
  shipped?: boolean;
  overridden?: boolean;
}) {
  const lines = [
    `# Week ${opts.week}`,
    `Week ${opts.week} — 2026-04-20`,
    "",
    `- Tasks completed: ${opts.completed}`,
    `- Tasks open: ${opts.open}`,
    `- Shipping score: ${opts.score}%`,
  ];
  if (opts.shipped !== undefined)
    lines.push(`- Shipped Friday: ${opts.shipped ? "Yes" : "No"}`);
  if (opts.overridden) lines.push("", "_Override: test");
  return lines.join("\n");
}

function setupLogs(
  logs: Array<{
    week: number;
    completed: number;
    open: number;
    score: number;
    shipped?: boolean;
    overridden?: boolean;
  }>,
) {
  vi.mocked(readLastNLoopLogs).mockReturnValue(
    logs.map((l) => ({
      weekNumber: l.week,
      overridden: l.overridden ?? false,
    })),
  );
  vi.mocked(readLoopLog).mockImplementation((weekNum: number) => {
    const found = logs.find((l) => l.week === weekNum);
    return found ? makeLoopLog(found) : null;
  });
}

describe("predictSuccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null with fewer than 8 weeks", () => {
    setupLogs(
      Array.from({ length: 7 }, (_, i) => ({
        week: i + 1,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
      })),
    );
    expect(predictSuccess("test")).toBeNull();
  });

  it("returns null when logs are unreadable", () => {
    vi.mocked(readLastNLoopLogs).mockReturnValue(
      Array.from({ length: 10 }, (_, i) => ({
        weekNumber: i + 1,
        overridden: false,
      })),
    );
    vi.mocked(readLoopLog).mockReturnValue(null);
    expect(predictSuccess("test")).toBeNull();
  });

  it("computes base probability with consistency bonus", () => {
    setupLogs(
      Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        completed: 4,
        open: 1,
        score: 70,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.probability).toBeGreaterThan(15);
    expect(pred.confidence).toBe("low");
    expect(pred.weeksAnalyzed).toBe(8);
  });

  it("rewards high task velocity (5+/week)", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 6,
        open: 0,
        score: 80,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("High task velocity"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(10);
    expect(factor!.direction).toBe("positive");
  });

  it("rewards moderate task velocity (3-4/week)", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("Moderate task velocity"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(5);
  });

  it("penalizes low task velocity (<3/week)", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 1,
        open: 4,
        score: 40,
        shipped: false,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("Low task velocity"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(-5);
    expect(factor!.direction).toBe("negative");
  });

  it("rewards upward trajectory", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 2 + Math.floor(i / 2),
        open: Math.max(0, 4 - Math.floor(i / 2)),
        score: 40 + i * 3,
        shipped: i > 4,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("Upward trajectory"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(8);
  });

  it("penalizes declining trajectory", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 6 - Math.floor(i / 2),
        open: Math.floor(i / 2),
        score: 80 - i * 4,
        shipped: i < 4,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("Declining trajectory"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(-10);
  });

  it("penalizes high override rate (>50%)", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        overridden: i < 6,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("High override rate"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(-5);
  });

  it("rewards consistent shipping habit", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 4,
        open: 1,
        score: 70,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    const factor = pred.shiftFactors.find((f) =>
      f.factor.includes("Consistent shipping habit"),
    );
    expect(factor).toBeDefined();
    expect(factor!.impact).toBe(7);
  });

  it("caps probability at 85 minimum", () => {
    setupLogs(
      Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        completed: 8,
        open: 0,
        score: 95,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.probability).toBeLessThanOrEqual(85);
  });

  it("floors probability at 2 minimum", () => {
    setupLogs(
      Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        completed: 0,
        open: 5,
        score: 10,
        shipped: false,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.probability).toBeGreaterThanOrEqual(2);
  });

  it("sets confidence to low for <10 weeks", () => {
    setupLogs(
      Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        completed: 4,
        open: 1,
        score: 70,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.confidence).toBe("low");
  });

  it("sets confidence to medium for 10-11 weeks", () => {
    setupLogs(
      Array.from({ length: 11 }, (_, i) => ({
        week: i + 1,
        completed: 4,
        open: 1,
        score: 70,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.confidence).toBe("medium");
  });

  it("sets confidence to high for 12+ weeks", () => {
    setupLogs(
      Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        completed: 4,
        open: 1,
        score: 70,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.confidence).toBe("high");
  });

  it("generates strengths for consistency", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 5,
        open: 0,
        score: 75,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.strengths.some((s) => s.includes("show up every week"))).toBe(
      true,
    );
  });

  it("generates strengths for high completion rate", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 5,
        open: 0,
        score: 80,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(
      pred.strengths.some((s) => s.includes("finish what you start")),
    ).toBe(true);
  });

  it("generates risks for inconsistency", () => {
    // Create gaps: weeks 1, 3, 5, 7, 9 (5 weeks out of 9 span = 5/9 = 0.55 consistency)
    // But we need < 0.5, so use weeks 1, 5, 9 (3 weeks out of 9 span = 3/9 = 0.33)
    // Wait, we need 8+ weeks for predictSuccess to not return null
    // Use weeks 1, 2, 3, 4, 5, 6, 7, 15 (8 weeks out of 15 span = 8/15 = 0.53)
    // Still not < 0.5. Use weeks 1, 2, 3, 4, 5, 6, 7, 20 (8/20 = 0.4)
    setupLogs([
      { week: 1, completed: 5, open: 0, score: 50, shipped: true },
      { week: 2, completed: 0, open: 5, score: 50, shipped: false },
      { week: 3, completed: 5, open: 0, score: 50, shipped: true },
      { week: 4, completed: 0, open: 5, score: 50, shipped: false },
      { week: 5, completed: 5, open: 0, score: 50, shipped: true },
      { week: 6, completed: 0, open: 5, score: 50, shipped: false },
      { week: 7, completed: 5, open: 0, score: 50, shipped: true },
      { week: 20, completed: 0, open: 5, score: 50, shipped: false },
    ]);
    const pred = predictSuccess("test")!;
    // consistency = 8 / (20 - 1 + 1) = 8/20 = 0.4 < 0.5
    expect(pred.risks.some((r) => r.includes("Inconsistent"))).toBe(true);
  });

  it("generates risks for low completion rate", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 1,
        open: 4,
        score: 30,
        shipped: false,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.risks.some((r) => r.includes("Low completion rate"))).toBe(
      true,
    );
  });

  it("includes fallback strength when none match", () => {
    // Need: consistency 0.5-0.7, score 40-70, tasks 2-4, trend 0, no shipping
    setupLogs([
      { week: 1, completed: 3, open: 2, score: 50, shipped: false },
      { week: 2, completed: 3, open: 2, score: 50, shipped: false },
      { week: 3, completed: 3, open: 2, score: 50, shipped: false },
      { week: 4, completed: 3, open: 2, score: 50, shipped: false },
      { week: 5, completed: 3, open: 2, score: 50, shipped: false },
      { week: 6, completed: 3, open: 2, score: 50, shipped: false },
      { week: 12, completed: 3, open: 2, score: 50, shipped: false },
      { week: 13, completed: 3, open: 2, score: 50, shipped: false },
    ]);
    const pred = predictSuccess("test")!;
    // consistency = 8 / (13 - 1 + 1) = 8/13 = 0.615, which is >= 0.5 and < 0.7
    // So no "show up every week" strength, no "Inconsistent" risk
    // avgScore = 50, avgTasks = 3, trend = 0, no shipping
    // No strengths match, so fallback
    expect(pred.strengths.some((s) => s.includes("foundation"))).toBe(true);
  });

  it("includes fallback risk when none match", () => {
    setupLogs(
      Array.from({ length: 10 }, (_, i) => ({
        week: i + 1,
        completed: 5,
        open: 0,
        score: 80,
        shipped: true,
      })),
    );
    const pred = predictSuccess("test")!;
    expect(pred.risks.some((r) => r.includes("No major risks"))).toBe(true);
  });
});

describe("renderPrediction", () => {
  it("renders high probability with rocket emoji", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderPrediction({
      probability: 65,
      confidence: "medium",
      strengths: ["Consistent"],
      risks: [],
      shiftFactors: [
        { factor: "Consistency", impact: 10, direction: "positive" },
      ],
      weeksAnalyzed: 10,
    });
    expect(consoleSpy.mock.calls.some((c) => c[0].includes("🚀"))).toBe(true);
    expect(consoleSpy.mock.calls.some((c) => c[0].includes("65%"))).toBe(true);
    consoleSpy.mockRestore();
  });

  it("renders medium probability with chart emoji", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderPrediction({
      probability: 45,
      confidence: "medium",
      strengths: [],
      risks: ["Slow start"],
      shiftFactors: [],
      weeksAnalyzed: 10,
    });
    expect(consoleSpy.mock.calls.some((c) => c[0].includes("📈"))).toBe(true);
    consoleSpy.mockRestore();
  });

  it("renders low probability with seedling emoji", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderPrediction({
      probability: 20,
      confidence: "low",
      strengths: [],
      risks: ["Inconsistent"],
      shiftFactors: [],
      weeksAnalyzed: 8,
    });
    expect(consoleSpy.mock.calls.some((c) => c[0].includes("🌱"))).toBe(true);
    consoleSpy.mockRestore();
  });
});
