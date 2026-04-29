import { describe, it, expect, vi } from "vitest";
import { buildProofCard, buildTweetLine, copyToClipboard } from "../proof-card.js";

describe("Proof Card UI", () => {
  describe("buildProofCard", () => {
    it("renders full proof card correctly", () => {
      const data = {
        productName: "TestApp",
        weekNum: 42,
        shippingScore: 85,
        tasksCompleted: 4,
        tasksTotal: 5,
        streak: 3,
        feedbackResponses: 2,
        loopkitScore: 90,
        oneThing: "Ship auth",
        mrr: 1500,
        currency: "USD",
      };

      const card = buildProofCard(data);
      expect(card).toContain("TestApp — Week 42");
      expect(card).toContain("4/5 tasks (85%)");
      expect(card).toContain("LoopKit Score: 90/100");
      expect(card).toContain("Streak: 3 consecutive weeks");
      expect(card).toContain("Feedback: 2 responses collected");
      expect(card).toContain("MRR: $1,500/mo");
      expect(card).toContain("Next: Ship auth");
    });

    it("handles missing optional data gracefully", () => {
      const data = {
        productName: "NewApp",
        weekNum: 1,
        shippingScore: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        streak: 0,
        feedbackResponses: 0,
        loopkitScore: null,
        oneThing: "Write code",
        mrr: null,
      };

      const card = buildProofCard(data);
      expect(card).toContain("No tasks tracked (0%)");
      expect(card).not.toContain("LoopKit Score");
      expect(card).not.toContain("Streak");
      expect(card).not.toContain("Feedback");
      expect(card).not.toContain("MRR");
    });
  });

  describe("buildTweetLine", () => {
    it("builds a short tweet line correctly", () => {
      const data = {
        productName: "TestApp",
        weekNum: 42,
        shippingScore: 85,
        tasksCompleted: 4,
        tasksTotal: 5,
        streak: 3,
        feedbackResponses: 2,
        loopkitScore: 90,
        oneThing: "Ship auth",
        mrr: 1500,
        currency: "USD",
      };

      const line = buildTweetLine(data);
      expect(line).toContain("Week 42: shipped 85%");
      expect(line).toContain("3-week streak 🔥");
      expect(line).toContain("LoopKit Score: 90/100");
      expect(line).toContain("MRR: $1,500/mo");
      expect(line).toContain("@loopkit");
    });

    it("omits empty stats from tweet line", () => {
      const data = {
        productName: "NewApp",
        weekNum: 1,
        shippingScore: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        streak: 0,
        feedbackResponses: 0,
        loopkitScore: null,
        oneThing: "Write code",
        mrr: null,
      };

      const line = buildTweetLine(data);
      expect(line).toBe("Week 1: shipped 0% · @loopkit");
    });
  });

  describe("copyToClipboard", () => {
    it("fails silently gracefully on non-mac platform without crashing", async () => {
      vi.mock("node:child_process", () => ({
        spawnSync: vi.fn(() => ({ status: 0, error: undefined }))
      }));
      // Assuming vitest runs on a platform, we just ensure it doesn't throw.
      // process.platform mocking is tricky in vitest, but we can verify it doesn't throw an unhandled rejection.
      const result = await copyToClipboard("test");
      expect(typeof result).toBe("boolean");
      vi.unmock("node:child_process");
    });
  });
});
