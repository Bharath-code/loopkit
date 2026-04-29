import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeLoopKitScore,
  renderLoopKitScore,
  formatLoopKitScoreShort,
  readLoopKitScoreFromLog,
  readLastNLoopKitScores,
} from "../score.js";

// Mock dependencies
vi.mock("../../storage/local.js", () => ({
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
  readPulseResponses: vi.fn(),
  getConsecutiveWeeksStreak: vi.fn(),
}));

vi.mock("@loopkit/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@loopkit/shared")>();
  return {
    ...actual,
    getWeekNumber: vi.fn(() => 42),
  };
});

import {
  readLastNLoopLogs,
  readLoopLog,
  readPulseResponses,
  getConsecutiveWeeksStreak,
} from "../../storage/local.js";
import { getWeekNumber } from "@loopkit/shared";

describe("LoopKit Score Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeLoopKitScore", () => {
    it("returns null if no loop logs exist", () => {
      vi.mocked(readLastNLoopLogs).mockReturnValue([]);
      expect(computeLoopKitScore()).toBeNull();
    });

    it("returns null if recent log has no shipping score", () => {
      vi.mocked(readLastNLoopLogs).mockReturnValue([
        { weekNumber: 41, overridden: false },
      ]);
      // Mock log without a shipping score text match
      vi.mocked(readLoopLog).mockReturnValue("Some random log content without score");
      expect(computeLoopKitScore()).toBeNull();
    });

    it("computes correctly with base score, streak, and feedback", () => {
      vi.mocked(readLastNLoopLogs).mockReturnValue([
        { weekNumber: 42, overridden: false },
      ]);
      vi.mocked(readLoopLog).mockReturnValue("**Shipping Score:** 80%");
      vi.mocked(getConsecutiveWeeksStreak).mockReturnValue(3); // 3 past weeks
      vi.mocked(readPulseResponses).mockReturnValue([
        "Response 1",
        "Response 2",
      ]);

      const breakdown = computeLoopKitScore();
      expect(breakdown).not.toBeNull();
      
      // Streak = 3 past + 1 current = 4. Multiplier = Math.min(1 + 4*0.05, 1.5) = 1.2
      // Bonus = 2 responses * 2 = 4
      // Raw = 80 * 1.2 + 4 = 100
      expect(breakdown?.shippingScore).toBe(80);
      expect(breakdown?.streakMultiplier).toBe(1.2);
      expect(breakdown?.feedbackBonus).toBe(4);
      expect(breakdown?.score).toBe(100);
      expect(breakdown?.streak).toBe(4);
    });

    it("clamps score to 100", () => {
      vi.mocked(readLastNLoopLogs).mockReturnValue([
        { weekNumber: 42, overridden: false },
      ]);
      vi.mocked(readLoopLog).mockReturnValue("Shipping score: 100%");
      vi.mocked(getConsecutiveWeeksStreak).mockReturnValue(10); // max multiplier 1.5
      // 10 responses = 20 bonus points
      vi.mocked(readPulseResponses).mockReturnValue(Array(10).fill("Test response"));

      const breakdown = computeLoopKitScore();
      // Raw = 100 * 1.5 + 20 = 170 -> Clamped to 100
      expect(breakdown?.score).toBe(100);
    });
  });

  describe("readLoopKitScoreFromLog", () => {
    it("parses score from log", () => {
      vi.mocked(readLoopLog).mockReturnValue("**LoopKit Score:** 85/100");
      expect(readLoopKitScoreFromLog(42)).toBe(85);
    });

    it("returns null if score is missing", () => {
      vi.mocked(readLoopLog).mockReturnValue("No score here");
      expect(readLoopKitScoreFromLog(42)).toBeNull();
    });
  });

  describe("readLastNLoopKitScores", () => {
    it("reads and sorts scores from logs, ignoring those without a score", () => {
      vi.mocked(readLastNLoopLogs).mockReturnValue([
        { weekNumber: 42, overridden: false },
        { weekNumber: 40, overridden: false },
        { weekNumber: 41, overridden: false },
      ]);
      // Mock readLoopLog to return different scores
      vi.mocked(readLoopLog).mockImplementation((weekNum) => {
        if (weekNum === 42) return "**LoopKit Score:** 85/100";
        if (weekNum === 41) return "**LoopKit Score:** 80/100";
        return "No score"; // week 40
      });

      const scores = readLastNLoopKitScores(3);
      expect(scores).toEqual([
        { week: 41, score: 80 },
        { week: 42, score: 85 },
      ]);
    });
  });

  describe("renderLoopKitScore", () => {
    it("renders green color and positive delta when score > previous", () => {
      const breakdown = { score: 85, shippingScore: 80, streakMultiplier: 1.0, feedbackBonus: 5, streak: 1, feedbackResponses: 0 };
      const out = renderLoopKitScore(breakdown, 70);
      expect(out).toContain("85/100");
      expect(out).toContain("+15");
    });

    it("renders red color and negative delta when score drops", () => {
      const breakdown = { score: 30, shippingScore: 30, streakMultiplier: 1.0, feedbackBonus: 0, streak: 1, feedbackResponses: 0 };
      const out = renderLoopKitScore(breakdown, 50);
      expect(out).toContain("30/100");
      expect(out).toContain("↓-20");
    });

    it("renders muted color and no delta when score is same", () => {
      const breakdown = { score: 50, shippingScore: 50, streakMultiplier: 1.0, feedbackBonus: 0, streak: 1, feedbackResponses: 0 };
      const out = renderLoopKitScore(breakdown, 50);
      expect(out).toContain("50/100");
      expect(out).toContain("→same");
    });
  });

  describe("formatLoopKitScoreShort", () => {
    it("formats score correctly", () => {
      expect(formatLoopKitScoreShort(42)).toBe("42/100");
    });
  });
});
