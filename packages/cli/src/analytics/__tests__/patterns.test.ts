import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@loopkit/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@loopkit/shared")>();
  return {
    ...actual,
    getWeekNumber: vi.fn(() => 100),
  };
});

vi.mock("../../storage/local.js", () => ({
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
  readTasksFile: vi.fn(),
  readPulseResponses: vi.fn(),
}));

import {
  readLoopLog,
  readTasksFile,
  readPulseResponses,
} from "../../storage/local.js";
import { detectPatterns } from "../patterns.js";

function makeLoopLog(opts: {
  week: number;
  completed: number;
  open: number;
  score: number;
  shipped?: boolean;
  overridden?: boolean;
  pulseFixNow?: boolean;
  extraContent?: string;
}) {
  const lines = [
    `# Week ${opts.week}`,
    `Week ${opts.week} — 2026-04-20`,
    "",
    `- Tasks completed: ${opts.completed}`,
    `- Tasks open: ${opts.open}`,
    `- Shipping score: ${opts.score}%`,
    `- Shipped Friday: ${opts.shipped ? "Yes" : "No"}`,
  ];
  if (opts.overridden) lines.push("", "_Override: test");
  if (opts.pulseFixNow)
    lines.push("", "Pulse cluster: Fix now — onboarding confusion");
  if (opts.extraContent) lines.push("", opts.extraContent);
  return lines.join("\n");
}

function setupWeeks(
  weeks: Array<{
    week: number;
    completed: number;
    open: number;
    score: number;
    shipped?: boolean;
    overridden?: boolean;
    pulseFixNow?: boolean;
    extraContent?: string;
  }>,
) {
  vi.mocked(readLoopLog).mockImplementation((weekNum: number) => {
    const found = weeks.find((w) => w.week === weekNum);
    return found ? makeLoopLog(found) : null;
  });
}

describe("detectPatterns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readTasksFile).mockReturnValue(null);
    vi.mocked(readPulseResponses).mockReturnValue([]);
  });

  it("returns null with fewer than 4 weeks of data", () => {
    setupWeeks([
      { week: 100, completed: 3, open: 2, score: 60, shipped: true },
      { week: 99, completed: 3, open: 2, score: 60, shipped: true },
      { week: 98, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    expect(detectPatterns("test")).toBeNull();
  });

  it("detects overplanner: 8+ tasks, <=30% completion, 3+ weeks", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 9, score: 40, shipped: false },
      { week: 99, completed: 1, open: 9, score: 40, shipped: false },
      { week: 98, completed: 1, open: 9, score: 40, shipped: false },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "overplanner");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("warning");
    expect(p!.weeksObserved).toBe(3);
  });

  it("escalates overplanner to critical at 4+ weeks", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 9, score: 35, shipped: false },
      { week: 99, completed: 1, open: 9, score: 35, shipped: false },
      { week: 98, completed: 1, open: 9, score: 35, shipped: false },
      { week: 97, completed: 1, open: 9, score: 35, shipped: false },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "overplanner")!;
    expect(p.severity).toBe("critical");
    expect(p.weeksObserved).toBe(4);
  });

  it("detects snooze loop from snoozed tasks + low completion", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 5, score: 30, shipped: false },
      { week: 99, completed: 1, open: 5, score: 30, shipped: false },
      { week: 98, completed: 1, open: 5, score: 30, shipped: false },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    vi.mocked(readTasksFile).mockReturnValue(
      `## This Week\n- [ ] Task A (snoozed)\n- [ ] Task B postponed`,
    );
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "snooze_loop");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("warning");
  });

  it("escalates snooze loop to critical at 4+ low-completion weeks", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 5, score: 25, shipped: false },
      { week: 99, completed: 1, open: 5, score: 25, shipped: false },
      { week: 98, completed: 1, open: 5, score: 25, shipped: false },
      { week: 97, completed: 1, open: 5, score: 25, shipped: false },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    vi.mocked(readTasksFile).mockReturnValue(`- [ ] Task A ⏸`);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "snooze_loop")!;
    expect(p.severity).toBe("critical");
  });

  it("does not detect snooze loop without snoozed tasks", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 5, score: 30, shipped: false },
      { week: 99, completed: 1, open: 5, score: 30, shipped: false },
      { week: 98, completed: 1, open: 5, score: 30, shipped: false },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    vi.mocked(readTasksFile).mockReturnValue(`- [ ] Task A\n- [ ] Task B`);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "snooze_loop");
    expect(p).toBeUndefined();
  });

  it("detects ship avoider: no ship + low score for 3+ weeks", () => {
    setupWeeks([
      { week: 100, completed: 2, open: 3, score: 35, shipped: false },
      { week: 99, completed: 2, open: 3, score: 35, shipped: false },
      { week: 98, completed: 2, open: 3, score: 35, shipped: false },
      { week: 97, completed: 3, open: 2, score: 70, shipped: true },
      { week: 96, completed: 3, open: 2, score: 70, shipped: true },
      { week: 95, completed: 3, open: 2, score: 70, shipped: true },
      { week: 94, completed: 3, open: 2, score: 70, shipped: true },
      { week: 93, completed: 3, open: 2, score: 70, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "ship_avoider");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("warning");
    expect(p!.weeksObserved).toBe(3);
  });

  it("escalates ship avoider to critical at 4+ weeks", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 4, score: 30, shipped: false },
      { week: 99, completed: 1, open: 4, score: 30, shipped: false },
      { week: 98, completed: 1, open: 4, score: 30, shipped: false },
      { week: 97, completed: 1, open: 4, score: 30, shipped: false },
      { week: 96, completed: 3, open: 2, score: 70, shipped: true },
      { week: 95, completed: 3, open: 2, score: 70, shipped: true },
      { week: 94, completed: 3, open: 2, score: 70, shipped: true },
      { week: 93, completed: 3, open: 2, score: 70, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "ship_avoider")!;
    expect(p.severity).toBe("critical");
  });

  it("does not flag ship avoider when score is high", () => {
    setupWeeks([
      { week: 100, completed: 2, open: 3, score: 70, shipped: false },
      { week: 99, completed: 2, open: 3, score: 70, shipped: false },
      { week: 98, completed: 2, open: 3, score: 70, shipped: false },
      { week: 97, completed: 3, open: 2, score: 70, shipped: true },
      { week: 96, completed: 3, open: 2, score: 70, shipped: true },
      { week: 95, completed: 3, open: 2, score: 70, shipped: true },
      { week: 94, completed: 3, open: 2, score: 70, shipped: true },
      { week: 93, completed: 3, open: 2, score: 70, shipped: true },
    ]);
    const result = detectPatterns("test");
    if (result) {
      const p = result.patterns.find((p) => p.type === "ship_avoider");
      expect(p).toBeUndefined();
    }
  });

  it("detects ICP drift from declining score + pulse fix-now", () => {
    setupWeeks([
      {
        week: 100,
        completed: 2,
        open: 3,
        score: 40,
        shipped: false,
        pulseFixNow: true,
      },
      {
        week: 99,
        completed: 3,
        open: 2,
        score: 55,
        shipped: false,
        pulseFixNow: true,
      },
      {
        week: 98,
        completed: 4,
        open: 1,
        score: 70,
        shipped: true,
        pulseFixNow: false,
      },
      { week: 97, completed: 3, open: 2, score: 70, shipped: true },
      { week: 96, completed: 3, open: 2, score: 70, shipped: true },
      { week: 95, completed: 3, open: 2, score: 70, shipped: true },
      { week: 94, completed: 3, open: 2, score: 70, shipped: true },
      { week: 93, completed: 3, open: 2, score: 70, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "icp_drift");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("warning");
  });

  it("escalates ICP drift to critical with 3+ fix-now weeks", () => {
    setupWeeks([
      {
        week: 100,
        completed: 2,
        open: 3,
        score: 30,
        shipped: false,
        pulseFixNow: true,
      },
      {
        week: 99,
        completed: 2,
        open: 3,
        score: 45,
        shipped: false,
        pulseFixNow: true,
      },
      {
        week: 98,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        pulseFixNow: true,
      },
      { week: 97, completed: 3, open: 2, score: 70, shipped: true },
      { week: 96, completed: 3, open: 2, score: 70, shipped: true },
      { week: 95, completed: 3, open: 2, score: 70, shipped: true },
      { week: 94, completed: 3, open: 2, score: 70, shipped: true },
      { week: 93, completed: 3, open: 2, score: 70, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "icp_drift");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("critical");
  });

  it("detects ICP drift from negative pulse responses", () => {
    setupWeeks([
      { week: 100, completed: 2, open: 3, score: 45, shipped: false },
      { week: 99, completed: 3, open: 2, score: 50, shipped: false },
      { week: 98, completed: 4, open: 1, score: 55, shipped: true },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    vi.mocked(readPulseResponses).mockReturnValue([
      "This is wrong",
      "I don't need this",
      "Not useful for me",
      "Confusing",
      "Don't understand",
    ]);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "icp_drift");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("critical");
  });

  it("does not detect ICP drift without decline or pulse signals", () => {
    setupWeeks([
      { week: 100, completed: 3, open: 2, score: 60, shipped: true },
      { week: 99, completed: 3, open: 2, score: 60, shipped: true },
      { week: 98, completed: 3, open: 2, score: 60, shipped: true },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    const result = detectPatterns("test");
    if (result) {
      const p = result.patterns.find((p) => p.type === "icp_drift");
      expect(p).toBeUndefined();
    }
  });

  it("detects scope creep from midweek task additions", () => {
    setupWeeks([
      { week: 100, completed: 3, open: 2, score: 60, shipped: true },
      { week: 99, completed: 3, open: 2, score: 60, shipped: true },
      { week: 98, completed: 3, open: 2, score: 60, shipped: true },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    const sunday = new Date();
    sunday.setDate(sunday.getDate() - sunday.getDay());
    const sundayStr = sunday.toISOString().split("T")[0];
    const monday = new Date(sunday);
    monday.setDate(monday.getDate() + 1);
    const mondayStr = monday.toISOString().split("T")[0];

    vi.mocked(readTasksFile).mockReturnValue(
      `- [ ] Task A created:${sundayStr}\n- [ ] Task B created:${mondayStr}\n- [ ] Task C created:${mondayStr}`,
    );
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "scope_creep");
    expect(p).toBeDefined();
    expect(p!.severity).toBe("warning");
  });

  it("detects scope creep from loop log mentions", () => {
    setupWeeks([
      {
        week: 100,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "Added a new task mid-week. Also feature creep is real.",
      },
      {
        week: 99,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "Added a new task mid-week.",
      },
      {
        week: 98,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "Added a new task mid-week.",
      },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    vi.mocked(readTasksFile).mockReturnValue(`- [ ] Task A`);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "scope_creep");
    expect(p).toBeDefined();
  });

  it("escalates scope creep to critical with 4+ mentions", () => {
    setupWeeks([
      {
        week: 100,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "added new task",
      },
      {
        week: 99,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "added new task",
      },
      {
        week: 98,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "added new task",
      },
      {
        week: 97,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "added new task",
      },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    vi.mocked(readTasksFile).mockReturnValue(`- [ ] Task A`);
    const result = detectPatterns("test")!;
    const p = result.patterns.find((p) => p.type === "scope_creep")!;
    expect(p.severity).toBe("critical");
  });

  it("filters out cross-project logs", () => {
    setupWeeks([
      {
        week: 100,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:other-project",
      },
      {
        week: 99,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:other-project",
      },
      {
        week: 98,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:other-project",
      },
      {
        week: 97,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:other-project",
      },
      {
        week: 96,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:other-project",
      },
      {
        week: 95,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:other-project",
      },
      {
        week: 94,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:other-project",
      },
      {
        week: 93,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:other-project",
      },
    ]);
    const result = detectPatterns("my-project");
    expect(result).toBeNull();
  });

  it("allows logs without project reference", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 9, score: 30, shipped: false },
      { week: 99, completed: 1, open: 9, score: 30, shipped: false },
      { week: 98, completed: 1, open: 9, score: 30, shipped: false },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    const result = detectPatterns("my-project")!;
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it("allows logs with matching project reference", () => {
    setupWeeks([
      {
        week: 100,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:my-project",
      },
      {
        week: 99,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:my-project",
      },
      {
        week: 98,
        completed: 1,
        open: 9,
        score: 30,
        shipped: false,
        extraContent: "project:my-project",
      },
      {
        week: 97,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:my-project",
      },
      {
        week: 96,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:my-project",
      },
      {
        week: 95,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:my-project",
      },
      {
        week: 94,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:my-project",
      },
      {
        week: 93,
        completed: 3,
        open: 2,
        score: 60,
        shipped: true,
        extraContent: "project:my-project",
      },
    ]);
    const result = detectPatterns("my-project")!;
    expect(result.patterns.length).toBeGreaterThan(0);
  });

  it("returns total weeks in result", () => {
    setupWeeks([
      { week: 100, completed: 1, open: 9, score: 30, shipped: false },
      { week: 99, completed: 1, open: 9, score: 30, shipped: false },
      { week: 98, completed: 1, open: 9, score: 30, shipped: false },
      { week: 97, completed: 3, open: 2, score: 60, shipped: true },
      { week: 96, completed: 3, open: 2, score: 60, shipped: true },
      { week: 95, completed: 3, open: 2, score: 60, shipped: true },
      { week: 94, completed: 3, open: 2, score: 60, shipped: true },
      { week: 93, completed: 3, open: 2, score: 60, shipped: true },
    ]);
    const result = detectPatterns("test")!;
    expect(result.totalWeeks).toBeGreaterThanOrEqual(4);
  });
});
