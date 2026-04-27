import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectChurnRisk, renderChurnWarning } from "../churn.js";

vi.mock("../../storage/local.js", () => ({
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
}));

import { readLastNLoopLogs, readLoopLog } from "../../storage/local.js";

function makeLoopLog(
  week: number,
  score: number,
  tasksCompleted: number,
  overrides: Partial<{ overridden: boolean; shipped: boolean }> = {},
) {
  const lines = [
    `# Week ${week}`,
    `Week ${week} — 2026-04-20`,
    "",
    `- Tasks completed: ${tasksCompleted}`,
    `- Tasks open: 2`,
    `- Shipping score: ${score}%`,
  ];
  if (overrides.shipped !== undefined)
    lines.push(`- Shipped Friday: ${overrides.shipped ? "Yes" : "No"}`);
  if (overrides.overridden) lines.push("", "_Override: test");
  return lines.join("\n");
}

function setupLogs(
  logs: Array<{
    week: number;
    score: number;
    tasks: number;
    overridden?: boolean;
    shipped?: boolean;
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
    return found
      ? makeLoopLog(found.week, found.score, found.tasks, {
          overridden: found.overridden,
          shipped: found.shipped,
        })
      : null;
  });
}

describe("detectChurnRisk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when fewer than 3 weeks of logs", () => {
    setupLogs([
      { week: 5, score: 80, tasks: 3 },
      { week: 4, score: 75, tasks: 2 },
    ]);
    expect(detectChurnRisk()).toBeNull();
  });

  it("returns null when no risk signals present", () => {
    setupLogs([
      { week: 5, score: 80, tasks: 4 },
      { week: 4, score: 82, tasks: 5 },
      { week: 3, score: 78, tasks: 3 },
    ]);
    expect(detectChurnRisk()).toBeNull();
  });

  it("detects declining score as warning for 10-point drop", () => {
    setupLogs([
      { week: 5, score: 60, tasks: 2 },
      { week: 4, score: 70, tasks: 3 },
      { week: 3, score: 80, tasks: 4 },
    ]);
    const risk = detectChurnRisk();
    expect(risk).not.toBeNull();
    expect(risk!.level).toBe("low");
    const signal = risk!.signals.find((s) => s.type === "declining_score");
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe("warning");
    expect(signal!.message).toContain("20 points");
  });

  it("detects declining score as critical for 30+ point drop", () => {
    setupLogs([
      { week: 5, score: 30, tasks: 1 },
      { week: 4, score: 50, tasks: 2 },
      { week: 3, score: 80, tasks: 4 },
    ]);
    const risk = detectChurnRisk();
    expect(risk!.level).toBe("high");
    const signal = risk!.signals.find((s) => s.type === "declining_score");
    expect(signal!.severity).toBe("critical");
    expect(signal!.message).toContain("50 points");
  });

  it("detects 1 skipped loop as warning", () => {
    setupLogs([
      { week: 10, score: 70, tasks: 3 },
      { week: 9, score: 75, tasks: 4 },
      { week: 7, score: 80, tasks: 5 },
      { week: 6, score: 78, tasks: 4 },
    ]);
    const risk = detectChurnRisk();
    const signal = risk!.signals.find((s) => s.type === "skipped_loops");
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe("warning");
    expect(signal!.message).toContain("Missed 1 weekly loop");
  });

  it("detects 2+ skipped loops as critical", () => {
    setupLogs([
      { week: 10, score: 70, tasks: 3 },
      { week: 7, score: 80, tasks: 5 },
      { week: 5, score: 75, tasks: 4 },
      { week: 4, score: 78, tasks: 4 },
    ]);
    const risk = detectChurnRisk();
    const signal = risk!.signals.find((s) => s.type === "skipped_loops");
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe("critical");
    expect(signal!.message).toContain("Missed 2 weekly loops");
  });

  it("detects rising overrides at 3 out of 4 weeks", () => {
    setupLogs([
      { week: 5, score: 70, tasks: 3, overridden: true },
      { week: 4, score: 75, tasks: 4, overridden: true },
      { week: 3, score: 80, tasks: 5, overridden: true },
      { week: 2, score: 78, tasks: 4, overridden: false },
    ]);
    const risk = detectChurnRisk();
    const signal = risk!.signals.find((s) => s.type === "rising_overrides");
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe("warning");
    expect(signal!.message).toContain("3/4");
  });

  it("does not flag rising overrides below threshold", () => {
    setupLogs([
      { week: 5, score: 70, tasks: 3, overridden: true },
      { week: 4, score: 75, tasks: 4, overridden: true },
      { week: 3, score: 80, tasks: 5, overridden: false },
      { week: 2, score: 78, tasks: 4, overridden: false },
    ]);
    const risk = detectChurnRisk();
    const signal = risk!.signals.find((s) => s.type === "rising_overrides");
    expect(signal).toBeUndefined();
  });

  it("detects low velocity critical when avg < 1 task", () => {
    setupLogs([
      { week: 5, score: 50, tasks: 0 },
      { week: 4, score: 45, tasks: 0 },
      { week: 3, score: 55, tasks: 1 },
    ]);
    const risk = detectChurnRisk();
    const signal = risk!.signals.find((s) => s.type === "low_velocity");
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe("critical");
    expect(signal!.message).toContain("less than 1 task");
  });

  it("detects low velocity warning when avg 1-2 tasks", () => {
    setupLogs([
      { week: 5, score: 60, tasks: 2 },
      { week: 4, score: 55, tasks: 1 },
      { week: 3, score: 58, tasks: 1 },
    ]);
    const risk = detectChurnRisk();
    const signal = risk!.signals.find((s) => s.type === "low_velocity");
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe("warning");
    expect(signal!.message).toContain("1.3");
  });

  it("escalates to medium risk with 2+ warning signals", () => {
    setupLogs([
      { week: 5, score: 55, tasks: 1 },
      { week: 4, score: 65, tasks: 1 },
      { week: 3, score: 75, tasks: 1 },
    ]);
    const risk = detectChurnRisk();
    expect(risk!.level).toBe("medium");
    expect(risk!.signals.length).toBeGreaterThanOrEqual(2);
  });

  it("escalates to high risk when any signal is critical", () => {
    setupLogs([
      { week: 5, score: 20, tasks: 0 },
      { week: 4, score: 50, tasks: 0 },
      { week: 3, score: 80, tasks: 0 },
    ]);
    const risk = detectChurnRisk();
    expect(risk!.level).toBe("high");
  });

  it("includes actionable suggestions with every signal", () => {
    setupLogs([
      { week: 5, score: 60, tasks: 1 },
      { week: 4, score: 70, tasks: 2 },
      { week: 3, score: 80, tasks: 3 },
    ]);
    const risk = detectChurnRisk()!;
    expect(risk.suggestions.length).toBeGreaterThan(0);
    for (const s of risk.signals) {
      expect(risk.suggestions.some((sg) => sg.length > 10)).toBe(true);
    }
  });

  it("ignores logs with unreadable content", () => {
    vi.mocked(readLastNLoopLogs).mockReturnValue([
      { weekNumber: 5, overridden: false },
      { weekNumber: 4, overridden: false },
      { weekNumber: 3, overridden: false },
    ]);
    vi.mocked(readLoopLog).mockReturnValue(null);
    expect(detectChurnRisk()).toBeNull();
  });
});

describe("renderChurnWarning", () => {
  it("renders high risk with correct emoji", () => {
    const out = renderChurnWarning({
      level: "high",
      signals: [
        {
          type: "declining_score",
          severity: "critical",
          message: "Score dropped",
        },
      ],
      suggestions: ["Fix it"],
    });
    expect(out).toContain("🚨");
    expect(out).toContain("HIGH RISK");
    expect(out).toContain("🔴");
    expect(out).toContain("Fix it");
  });

  it("renders medium risk with correct emoji", () => {
    const out = renderChurnWarning({
      level: "medium",
      signals: [{ type: "low_velocity", severity: "warning", message: "Slow" }],
      suggestions: ["Speed up"],
    });
    expect(out).toContain("⚠️");
    expect(out).toContain("MEDIUM RISK");
    expect(out).toContain("🟡");
  });

  it("renders low risk with correct emoji", () => {
    const out = renderChurnWarning({
      level: "low",
      signals: [
        { type: "skipped_loops", severity: "warning", message: "Missed 1" },
      ],
      suggestions: ["Show up"],
    });
    expect(out).toContain("📉");
    expect(out).toContain("LOW RISK");
  });
});
