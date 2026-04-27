import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeShippingDNA } from "../dna.js";

vi.mock("../../storage/local.js", () => ({
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
}));

import { readLastNLoopLogs, readLoopLog } from "../../storage/local.js";

function makeLoopLog(opts: {
  week: number;
  completed: number;
  open: number;
  score: number;
  date?: string;
}) {
  const date = opts.date || "2026-04-20";
  return [
    `# Week ${opts.week}`,
    `Week ${opts.week} — ${date}`,
    "",
    `- Tasks completed: ${opts.completed}`,
    `- Tasks open: ${opts.open}`,
    `- Shipping score: ${opts.score}%`,
  ].join("\n");
}

function setupLogs(
  logs: Array<{
    week: number;
    completed: number;
    open: number;
    score: number;
    date?: string;
  }>,
) {
  vi.mocked(readLastNLoopLogs).mockReturnValue(
    logs.map((l) => ({ weekNumber: l.week, overridden: false })),
  );
  vi.mocked(readLoopLog).mockImplementation((weekNum: number) => {
    const found = logs.find((l) => l.week === weekNum);
    return found ? makeLoopLog(found) : null;
  });
}

describe("computeShippingDNA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null with fewer than 4 weeks", () => {
    setupLogs([
      { week: 3, completed: 3, open: 2, score: 70 },
      { week: 2, completed: 4, open: 1, score: 75 },
      { week: 1, completed: 2, open: 3, score: 60 },
    ]);
    expect(computeShippingDNA()).toBeNull();
  });

  it("returns null when loop logs are unreadable", () => {
    vi.mocked(readLastNLoopLogs).mockReturnValue([
      { weekNumber: 5, overridden: false },
      { weekNumber: 4, overridden: false },
      { weekNumber: 3, overridden: false },
      { weekNumber: 2, overridden: false },
    ]);
    vi.mocked(readLoopLog).mockReturnValue(null);
    expect(computeShippingDNA()).toBeNull();
  });

  it("detects All-Star pattern: high score + low variance + moderate tasks", () => {
    setupLogs([
      { week: 8, completed: 5, open: 1, score: 85 },
      { week: 7, completed: 6, open: 1, score: 82 },
      { week: 6, completed: 5, open: 2, score: 88 },
      { week: 5, completed: 6, open: 1, score: 84 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.pattern).toBe("All-Star");
    expect(dna.velocityTrend).toBe("steady");
    expect(dna.completionStyle).toBe("finisher");
    expect(dna.strengths.length).toBeGreaterThan(0);
  });

  it("detects Perfectionist: high score but low volume", () => {
    setupLogs([
      { week: 8, completed: 2, open: 1, score: 80 },
      { week: 7, completed: 3, open: 0, score: 78 },
      { week: 6, completed: 2, open: 1, score: 82 },
      { week: 5, completed: 3, open: 0, score: 79 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.pattern).toBe("Perfectionist");
    expect(dna.avgTasksCompleted).toBeLessThanOrEqual(3);
  });

  it("detects Sprinter: high start, declining finish", () => {
    setupLogs([
      { week: 8, completed: 2, open: 4, score: 50 },
      { week: 7, completed: 3, open: 3, score: 55 },
      { week: 6, completed: 7, open: 1, score: 80 },
      { week: 5, completed: 8, open: 0, score: 85 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.pattern).toBe("Sprinter");
    expect(dna.velocityTrend).toBe("declining");
  });

  it("detects Marathoner: consistent moderate scores", () => {
    setupLogs([
      { week: 8, completed: 4, open: 2, score: 65 },
      { week: 7, completed: 5, open: 1, score: 60 },
      { week: 6, completed: 4, open: 2, score: 62 },
      { week: 5, completed: 5, open: 1, score: 58 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.pattern).toBe("Marathoner");
    expect(dna.velocityTrend).toBe("steady");
  });

  it("defaults to Reactor when no pattern matches", () => {
    setupLogs([
      { week: 8, completed: 8, open: 0, score: 95 },
      { week: 7, completed: 1, open: 5, score: 30 },
      { week: 6, completed: 6, open: 2, score: 70 },
      { week: 5, completed: 2, open: 4, score: 40 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.pattern).toBe("Reactor");
    expect(dna.velocityTrend).toBe("volatile");
  });

  it("computes accelerating velocity trend", () => {
    setupLogs([
      { week: 8, completed: 8, open: 0, score: 80 },
      { week: 7, completed: 7, open: 1, score: 75 },
      { week: 6, completed: 4, open: 2, score: 60 },
      { week: 5, completed: 2, open: 4, score: 50 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.velocityTrend).toBe("accelerating");
  });

  it("computes completion style: finisher", () => {
    setupLogs([
      { week: 8, completed: 5, open: 0, score: 80 },
      { week: 7, completed: 4, open: 1, score: 75 },
      { week: 6, completed: 5, open: 0, score: 82 },
      { week: 5, completed: 4, open: 1, score: 78 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.completionStyle).toBe("finisher");
  });

  it("computes completion style: starter", () => {
    setupLogs([
      { week: 8, completed: 1, open: 5, score: 30 },
      { week: 7, completed: 2, open: 6, score: 35 },
      { week: 6, completed: 1, open: 5, score: 28 },
      { week: 5, completed: 2, open: 6, score: 32 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.completionStyle).toBe("starter");
  });

  it("computes completion style: balancer", () => {
    setupLogs([
      { week: 8, completed: 3, open: 3, score: 55 },
      { week: 7, completed: 3, open: 3, score: 50 },
      { week: 6, completed: 3, open: 3, score: 52 },
      { week: 5, completed: 3, open: 3, score: 48 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.completionStyle).toBe("balancer");
  });

  it("computes streak from consecutive weeks", () => {
    vi.mocked(readLastNLoopLogs).mockReturnValue([
      { weekNumber: 5, overridden: false },
      { weekNumber: 4, overridden: false },
      { weekNumber: 3, overridden: false },
      { weekNumber: 2, overridden: false },
    ]);
    vi.mocked(readLoopLog).mockImplementation((weekNum: number) =>
      makeLoopLog({ week: weekNum, completed: 3, open: 2, score: 60 }),
    );
    const dna = computeShippingDNA()!;
    expect(dna.streak).toBe(4);
  });

  it("stops streak at gap", () => {
    vi.mocked(readLastNLoopLogs).mockReturnValue([
      { weekNumber: 6, overridden: false },
      { weekNumber: 5, overridden: false },
      { weekNumber: 3, overridden: false },
      { weekNumber: 2, overridden: false },
    ]);
    vi.mocked(readLoopLog).mockImplementation((weekNum: number) =>
      makeLoopLog({ week: weekNum, completed: 3, open: 2, score: 60 }),
    );
    const dna = computeShippingDNA()!;
    expect(dna.streak).toBe(2);
  });

  it("generates risk warnings for low score", () => {
    setupLogs([
      { week: 8, completed: 2, open: 3, score: 25 },
      { week: 7, completed: 1, open: 4, score: 20 },
      { week: 6, completed: 2, open: 3, score: 28 },
      { week: 5, completed: 1, open: 4, score: 22 },
    ]);
    const dna = computeShippingDNA()!;
    expect(
      dna.riskWarnings.some((w) => w.includes("Very low shipping score")),
    ).toBe(true);
  });

  it("generates risk warnings for low task velocity", () => {
    setupLogs([
      { week: 8, completed: 1, open: 2, score: 60 },
      { week: 7, completed: 1, open: 2, score: 58 },
      { week: 6, completed: 1, open: 2, score: 62 },
      { week: 5, completed: 1, open: 2, score: 59 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.riskWarnings.some((w) => w.includes("less than 2 tasks"))).toBe(
      true,
    );
  });

  it("generates risk warnings for declining trend", () => {
    setupLogs([
      { week: 8, completed: 2, open: 3, score: 40 },
      { week: 7, completed: 3, open: 2, score: 50 },
      { week: 6, completed: 4, open: 1, score: 60 },
      { week: 5, completed: 5, open: 0, score: 70 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.riskWarnings.some((w) => w.includes("declining"))).toBe(true);
  });

  it("generates risk warnings for skipped weeks", () => {
    vi.mocked(readLastNLoopLogs).mockReturnValue([
      { weekNumber: 8, overridden: false },
      { weekNumber: 6, overridden: false },
      { weekNumber: 4, overridden: false },
      { weekNumber: 2, overridden: false },
    ]);
    vi.mocked(readLoopLog).mockImplementation((weekNum: number) =>
      makeLoopLog({ week: weekNum, completed: 3, open: 2, score: 60 }),
    );
    const dna = computeShippingDNA()!;
    expect(dna.riskWarnings.some((w) => w.includes("skipped"))).toBe(true);
  });

  it("generates archetype-specific strength for Marathoner/All-Star", () => {
    setupLogs([
      { week: 8, completed: 5, open: 1, score: 80 },
      { week: 7, completed: 5, open: 1, score: 82 },
      { week: 6, completed: 5, open: 1, score: 78 },
      { week: 5, completed: 5, open: 1, score: 81 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.strengths.some((s) => s.includes("consistency"))).toBe(true);
  });

  it("generates strength for high output", () => {
    setupLogs([
      { week: 8, completed: 6, open: 0, score: 70 },
      { week: 7, completed: 6, open: 0, score: 72 },
      { week: 6, completed: 6, open: 0, score: 68 },
      { week: 5, completed: 6, open: 0, score: 71 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.strengths.some((s) => s.includes("High output"))).toBe(true);
  });

  it("includes encouragement when no specific strengths match", () => {
    setupLogs([
      { week: 8, completed: 1, open: 5, score: 30 },
      { week: 7, completed: 1, open: 5, score: 25 },
      { week: 6, completed: 1, open: 5, score: 28 },
      { week: 5, completed: 1, open: 5, score: 22 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.strengths.some((s) => s.includes("showing up"))).toBe(true);
  });

  it("returns correct total weeks count", () => {
    setupLogs([
      { week: 8, completed: 3, open: 2, score: 60 },
      { week: 7, completed: 3, open: 2, score: 62 },
      { week: 6, completed: 3, open: 2, score: 58 },
      { week: 5, completed: 3, open: 2, score: 61 },
    ]);
    const dna = computeShippingDNA()!;
    expect(dna.totalWeeks).toBe(4);
  });
});
