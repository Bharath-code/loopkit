import { describe, it, expect } from "vitest";
import { evaluateRules, filterDeduplicated, sortByPriority } from "../coach.js";
import type { RuleContext } from "../coach.js";
import type { CoachingMoment } from "@loopkit/shared";

function makeContext(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    slug: "test-project",
    totalWeeks: 4,
    dna: null,
    churnRisk: null,
    prediction: null,
    patterns: null,
    tasksContent: "- [ ] #1 Some task",
    lastShownId: undefined,
    ...overrides,
  };
}

function makePattern(
  type: "overplanner" | "snooze_loop" | "ship_avoider" | "icp_drift" | "scope_creep",
  severity: "warning" | "critical" = "warning",
  weeksObserved = 3
) {
  return {
    type,
    severity,
    message: `Test ${type} message`,
    suggestions: ["Suggestion 1", "Suggestion 2"],
    weeksObserved,
  };
}

describe("evaluateRules", () => {
  it("returns empty when no signals present", () => {
    const ctx = makeContext();
    const moments = evaluateRules(ctx);
    expect(moments).toHaveLength(0);
  });

  it("detects ship avoider as critical", () => {
    const ctx = makeContext({
      patterns: {
        patterns: [makePattern("ship_avoider", "critical", 4)],
        totalWeeks: 4,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments).toHaveLength(1);
    expect(moments[0].id).toBe("ship_avoider_critical");
    expect(moments[0].priority).toBe("critical");
    expect(moments[0].command).toBe("loopkit ship");
  });

  it("detects ICP drift as critical", () => {
    const ctx = makeContext({
      patterns: {
        patterns: [makePattern("icp_drift", "critical", 3)],
        totalWeeks: 4,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "icp_drift_critical")).toBe(true);
    expect(moments.find((m) => m.id === "icp_drift_critical")?.priority).toBe("critical");
  });

  it("detects low velocity as critical", () => {
    const ctx = makeContext({
      churnRisk: {
        level: "high" as const,
        signals: [
          { type: "low_velocity" as const, severity: "critical" as const, message: "Averaging less than 1 task" },
        ],
        suggestions: ["Break tasks down"],
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "low_velocity_critical")).toBe(true);
  });

  it("detects high churn risk as critical", () => {
    const ctx = makeContext({
      churnRisk: {
        level: "high" as const,
        signals: [
          { type: "declining_score" as const, severity: "critical" as const, message: "Score dropped" },
          { type: "skipped_loops" as const, severity: "warning" as const, message: "Missed weeks" },
        ],
        suggestions: ["Set reminder", "Shorten loop"],
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "churn_high_critical")).toBe(true);
    expect(moments.find((m) => m.id === "churn_high_critical")?.priority).toBe("critical");
  });

  it("detects overplanner as warning", () => {
    const ctx = makeContext({
      patterns: {
        patterns: [makePattern("overplanner", "warning", 3)],
        totalWeeks: 4,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "overplanner_warning")).toBe(true);
    expect(moments.find((m) => m.id === "overplanner_warning")?.priority).toBe("warning");
  });

  it("detects snooze loop as warning", () => {
    const ctx = makeContext({
      patterns: {
        patterns: [makePattern("snooze_loop", "warning", 3)],
        totalWeeks: 4,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "snooze_loop_warning")).toBe(true);
  });

  it("detects scope creep as warning", () => {
    const ctx = makeContext({
      patterns: {
        patterns: [makePattern("scope_creep", "warning", 3)],
        totalWeeks: 4,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "scope_creep_warning")).toBe(true);
  });

  it("detects medium churn as warning", () => {
    const ctx = makeContext({
      churnRisk: {
        level: "medium" as const,
        signals: [{ type: "declining_score" as const, severity: "warning" as const, message: "Score dropped 10 points" }],
        suggestions: ["Reduce scope"],
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "churn_medium_warning")).toBe(true);
    expect(moments.find((m) => m.id === "churn_medium_warning")?.priority).toBe("warning");
  });

  it("detects low probability as warning", () => {
    const ctx = makeContext({
      prediction: {
        probability: 25,
        confidence: "medium" as const,
        strengths: ["Consistent"],
        risks: ["Low velocity"],
        shiftFactors: [
          { factor: "Consistency", impact: 10, direction: "positive" as const },
          { factor: "Low velocity", impact: -5, direction: "negative" as const },
        ],
        weeksAnalyzed: 10,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "low_probability_warning")).toBe(true);
    expect(moments.find((m) => m.id === "low_probability_warning")?.priority).toBe("warning");
  });

  it("triggers week 3 milestone", () => {
    const ctx = makeContext({ totalWeeks: 3 });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "week_3_milestone")).toBe(true);
    expect(moments.find((m) => m.id === "week_3_milestone")?.priority).toBe("info");
  });

  it("triggers week 8 milestone with predictor", () => {
    const ctx = makeContext({
      totalWeeks: 8,
      prediction: {
        probability: 45,
        confidence: "medium" as const,
        strengths: ["Consistent"],
        risks: ["Low velocity"],
        shiftFactors: [],
        weeksAnalyzed: 10,
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "week_8_milestone")).toBe(true);
  });

  it("triggers week 16 milestone with DNA", () => {
    const ctx = makeContext({
      totalWeeks: 16,
      dna: {
        pattern: "Sprinter" as const,
        patternDescription: "Test",
        velocityTrend: "declining" as const,
        avgTasksCompleted: 4,
        avgScore: 60,
        peakDay: "Monday",
        completionStyle: "starter" as const,
        totalWeeks: 16,
        streak: 3,
        riskWarnings: [],
        strengths: [],
      },
    });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "week_16_milestone")).toBe(true);
  });

  it("triggers stuck state when no tasks", () => {
    const ctx = makeContext({ tasksContent: "## This Week\n\n## Backlog" });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "stuck_zero_tasks")).toBe(true);
    expect(moments.find((m) => m.id === "stuck_zero_tasks")?.priority).toBe("warning");
  });

  it("does not trigger stuck state when tasks exist", () => {
    const ctx = makeContext({ tasksContent: "- [ ] #1 Build landing page" });
    const moments = evaluateRules(ctx);
    expect(moments.some((m) => m.id === "stuck_zero_tasks")).toBe(false);
  });

  it("prioritizes critical over warning over info", () => {
    const ctx = makeContext({
      totalWeeks: 3,
      patterns: {
        patterns: [makePattern("ship_avoider", "critical", 4)],
        totalWeeks: 4,
      },
    });
    const moments = evaluateRules(ctx);
    const ids = moments.map((m) => m.id);
    expect(ids[0]).toBe("ship_avoider_critical");
    expect(ids).toContain("week_3_milestone");
  });
});

describe("filterDeduplicated", () => {
  it("filters out last shown moment", () => {
    const moments: CoachingMoment[] = [
      { id: "a", priority: "critical", title: "A", message: "msg", action: "act", condition: "test" },
      { id: "b", priority: "warning", title: "B", message: "msg", action: "act", condition: "test" },
    ];
    const filtered = filterDeduplicated(moments, "a");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("b");
  });

  it("keeps all when no last shown", () => {
    const moments: CoachingMoment[] = [
      { id: "a", priority: "critical", title: "A", message: "msg", action: "act", condition: "test" },
    ];
    const filtered = filterDeduplicated(moments, undefined);
    expect(filtered).toHaveLength(1);
  });
});

describe("sortByPriority", () => {
  it("sorts critical first, then warning, then info", () => {
    const moments: CoachingMoment[] = [
      { id: "info", priority: "info", title: "I", message: "msg", action: "act", condition: "test" },
      { id: "critical", priority: "critical", title: "C", message: "msg", action: "act", condition: "test" },
      { id: "warning", priority: "warning", title: "W", message: "msg", action: "act", condition: "test" },
    ];
    const sorted = sortByPriority(moments);
    expect(sorted.map((m) => m.id)).toEqual(["critical", "warning", "info"]);
  });
});
