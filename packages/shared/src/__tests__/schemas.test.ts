import { describe, it, expect } from "vitest";
import {
  InitAnswersSchema,
  BriefSchema,
  TaskSchema,
  TaskStatus,
  ShipDraftsSchema,
  ShipLogSchema,
  PulseResponseSchema,
  PulseClusterSchema,
  LoopSynthesisSchema,
  LoopLogSchema,
  ConfigSchema,
  ShippingDNASchema,
  ChurnRiskSchema,
  SuccessPredictionSchema,
  CompetitorLaunchSchema,
  KeywordOpportunitySchema,
  MarketSignalSchema,
  PatternInterruptResponseSchema,
  CoachingPlanSchema,
  PeerInspirationResponseSchema,
  slugify,
  getWeekNumber,
  formatDate,
  detectProjectCategory,
} from "../index";

describe("InitAnswersSchema", () => {
  it("parses valid answers", () => {
    const valid = {
      name: "TestApp",
      problem: "Developers waste time on config",
      icp: "Senior React devs at startups",
      whyUnsolved: "Existing tools are too generic",
      mvp: "A CLI that generates project configs",
    };
    const result = InitAnswersSchema.parse(valid);
    expect(result.name).toBe("TestApp");
  });

  it("rejects empty name", () => {
    const invalid = {
      name: "",
      problem: "test",
      icp: "test",
      whyUnsolved: "test",
      mvp: "test",
    };
    expect(() => InitAnswersSchema.parse(invalid)).toThrow();
  });

  it("rejects missing fields", () => {
    const partial = { name: "TestApp" };
    expect(() => InitAnswersSchema.parse(partial)).toThrow();
  });
});

describe("BriefSchema", () => {
  it("parses valid brief", () => {
    const valid = {
      bet: "Freelancers lose deals due to amateur proposals",
      uncomfortableTruth: "You have not proven clients care about proposal polish.",
      icpScore: 8,
      icpNote: "Specific and findable",
      problemScore: 7,
      problemNote: "Real pain with evidence",
      mvpScore: 6,
      mvpNote: "Needs more scoping",
      overallScore: 7,
      riskiestAssumption: "Clients care about proposal quality",
      validateAction: "Send 5 AI proposals to freelancers",
      mvpPlainEnglish: "A form that generates a SOW PDF",
    };
    const result = BriefSchema.parse(valid);
    expect(result.overallScore).toBe(7);
  });

  it("rejects score below 1", () => {
    const invalid = {
      bet: "test",
      uncomfortableTruth: "test",
      icpScore: 0,
      icpNote: "",
      problemScore: 5,
      problemNote: "",
      mvpScore: 5,
      mvpNote: "",
      overallScore: 5,
      riskiestAssumption: "test",
      validateAction: "test",
      mvpPlainEnglish: "test",
    };
    expect(() => BriefSchema.parse(invalid)).toThrow();
  });

  it("rejects score above 10", () => {
    const invalid = {
      bet: "test",
      uncomfortableTruth: "test",
      icpScore: 11,
      icpNote: "",
      problemScore: 5,
      problemNote: "",
      mvpScore: 5,
      mvpNote: "",
      overallScore: 5,
      riskiestAssumption: "test",
      validateAction: "test",
      mvpPlainEnglish: "test",
    };
    expect(() => BriefSchema.parse(invalid)).toThrow();
  });
});

describe("TaskSchema", () => {
  it("parses valid task", () => {
    const valid = {
      id: 1,
      title: "Build landing page",
      status: "open",
      createdAt: "2026-04-20",
      section: "week",
    };
    const result = TaskSchema.parse(valid);
    expect(result.status).toBe("open");
  });

  it("parses done task with closedAt", () => {
    const valid = {
      id: 2,
      title: "Setup auth",
      status: "done",
      createdAt: "2026-04-18",
      closedAt: "2026-04-19",
      closedVia: "abc123",
      section: "week",
    };
    const result = TaskSchema.parse(valid);
    expect(result.closedVia).toBe("abc123");
  });

  it("parses snoozed task", () => {
    const valid = {
      id: 3,
      title: "Write blog post",
      status: "snoozed",
      createdAt: "2026-04-15",
      snoozedUntil: "2026-04-22",
      section: "backlog",
    };
    const result = TaskSchema.parse(valid);
    expect(result.snoozedUntil).toBe("2026-04-22");
  });

  it("rejects invalid status", () => {
    const invalid = {
      id: 1,
      title: "test",
      status: "in-progress",
      createdAt: "2026-04-20",
      section: "week",
    };
    expect(() => TaskSchema.parse(invalid)).toThrow();
  });

  it("rejects invalid section", () => {
    const invalid = {
      id: 1,
      title: "test",
      status: "open",
      createdAt: "2026-04-20",
      section: "archive",
    };
    expect(() => TaskSchema.parse(invalid)).toThrow();
  });
});

describe("TaskStatus enum", () => {
  it("accepts valid statuses", () => {
    expect(TaskStatus.parse("open")).toBe("open");
    expect(TaskStatus.parse("done")).toBe("done");
    expect(TaskStatus.parse("snoozed")).toBe("snoozed");
    expect(TaskStatus.parse("cut")).toBe("cut");
  });

  it("rejects invalid status", () => {
    expect(() => TaskStatus.parse("in-progress")).toThrow();
  });
});

describe("ShipDraftsSchema", () => {
  it("parses valid drafts", () => {
    const valid = {
      hn: { title: "Show HN: TestApp", body: "We built..." },
      twitter: { tweets: ["Tweet 1", "Tweet 2", "Tweet 3"] },
      ih: { body: "This week I shipped..." },
    };
    const result = ShipDraftsSchema.parse(valid);
    expect(result.twitter.tweets).toHaveLength(3);
  });

  it("rejects missing hn body", () => {
    const invalid = {
      hn: { title: "Show HN: TestApp" },
      twitter: { tweets: ["Tweet 1"] },
      ih: { body: "test" },
    };
    expect(() => ShipDraftsSchema.parse(invalid)).toThrow();
  });
});

describe("ShipLogSchema", () => {
  it("parses valid ship log", () => {
    const valid = {
      date: "2026-04-25",
      whatShipped: "Landing page v1",
      checklist: { hn: true, twitter: true, ih: false },
    };
    const result = ShipLogSchema.parse(valid);
    expect(result.checklist.hn).toBe(true);
  });

  it("parses with optional drafts", () => {
    const valid = {
      date: "2026-04-25",
      whatShipped: "Landing page",
      checklist: { hn: true },
      drafts: {
        hn: { title: "Show HN", body: "..." },
        twitter: { tweets: ["..."] },
        ih: { body: "..." },
      },
    };
    const result = ShipLogSchema.parse(valid);
    expect(result.drafts).toBeDefined();
  });

  it("rejects missing checklist", () => {
    const invalid = {
      date: "2026-04-25",
      whatShipped: "test",
    };
    expect(() => ShipLogSchema.parse(invalid)).toThrow();
  });
});

describe("PulseResponseSchema", () => {
  it("parses valid response", () => {
    const valid = {
      id: "resp_1",
      projectId: "proj_abc",
      text: "The onboarding is confusing",
      createdAt: "2026-04-25T10:00:00Z",
    };
    const result = PulseResponseSchema.parse(valid);
    expect(result.text).toBe("The onboarding is confusing");
  });

  it("rejects text over 500 chars", () => {
    const invalid = {
      id: "resp_1",
      projectId: "proj_abc",
      text: "a".repeat(501),
      createdAt: "2026-04-25T10:00:00Z",
    };
    expect(() => PulseResponseSchema.parse(invalid)).toThrow();
  });

  it("accepts exactly 500 chars", () => {
    const valid = {
      id: "resp_1",
      projectId: "proj_abc",
      text: "a".repeat(500),
      createdAt: "2026-04-25T10:00:00Z",
    };
    expect(() => PulseResponseSchema.parse(valid)).not.toThrow();
  });
});

describe("PulseClusterSchema", () => {
  it("parses valid clusters", () => {
    const valid = {
      clusters: [
        {
          label: "Fix now",
          count: 3,
          pattern: "Onboarding confusion",
          quotes: ["Where do I start?", "Too many steps"],
        },
        {
          label: "Validate later",
          count: 2,
          pattern: "Feature request",
          quotes: ["Would love dark mode"],
        },
      ],
      outliers: ["Random comment"],
      confidence: 0.85,
      note: "Clear pattern on onboarding",
    };
    const result = PulseClusterSchema.parse(valid);
    expect(result.clusters).toHaveLength(2);
    expect(result.confidence).toBe(0.85);
  });

  it("rejects invalid label", () => {
    const invalid = {
      clusters: [
        {
          label: "Urgent",
          count: 1,
          pattern: "test",
          quotes: [],
        },
      ],
      outliers: [],
      confidence: 0.5,
      note: "",
    };
    expect(() => PulseClusterSchema.parse(invalid)).toThrow();
  });
});

describe("LoopSynthesisSchema", () => {
  it("parses valid synthesis", () => {
    const valid = {
      weekWin: "You shipped the landing page instead of rewriting the plan.",
      oneThing: "Ship the landing page",
      rationale: "Nothing shipped this week",
      tension: null,
      bipPost: "Week 3 of building. Shipped: nothing. Next: landing page.",
      founderNote: "The next move is visible now.",
    };
    const result = LoopSynthesisSchema.parse(valid);
    expect(result.tension).toBeNull();
  });

  it("parses with tension string", () => {
    const valid = {
      weekWin: "You listened to feedback before adding another feature.",
      oneThing: "Fix onboarding",
      rationale: "Pulse says users are confused",
      tension: "Pulse wants onboarding fix, tasks focus on new features",
      bipPost: "Week 4. Learned: users are lost. Next: fix onboarding.",
      founderNote: "Cut the noise and fix the bottleneck.",
    };
    const result = LoopSynthesisSchema.parse(valid);
    expect(result.tension).toContain("Pulse");
  });
});

describe("LoopLogSchema", () => {
  it("parses valid loop log", () => {
    const valid = {
      weekNumber: 3,
      date: "2026-04-25",
      tasksCompleted: 5,
      tasksTotal: 8,
      shippingScore: 6,
    };
    const result = LoopLogSchema.parse(valid);
    expect(result.overridden).toBe(false);
  });

  it("parses proof metrics when present", () => {
    const valid = {
      weekNumber: 4,
      date: "2026-04-25",
      tasksCompleted: 4,
      tasksTotal: 5,
      shippingScore: 80,
      proof: {
        previousScore: 60,
        currentScore: 80,
        scoreDelta: 20,
        weeksActive: 4,
        decisionsMade: 4,
        feedbackResponses: 6,
        feedbackActedOn: true,
      },
    };
    const result = LoopLogSchema.parse(valid);
    expect(result.proof?.scoreDelta).toBe(20);
  });

  it("parses with optional synthesis", () => {
    const valid = {
      weekNumber: 3,
      date: "2026-04-25",
      tasksCompleted: 5,
      tasksTotal: 8,
      shippingScore: 6,
      synthesis: {
        weekWin: "You shipped one visible thing.",
        oneThing: "Ship landing page",
        rationale: "test",
        tension: null,
        bipPost: "test",
        founderNote: "Keep the next move small.",
      },
    };
    const result = LoopLogSchema.parse(valid);
    expect(result.synthesis).toBeDefined();
  });

  it("parses with override", () => {
    const valid = {
      weekNumber: 3,
      date: "2026-04-25",
      tasksCompleted: 5,
      tasksTotal: 8,
      shippingScore: 6,
      overridden: true,
      overrideReason: "Founder disagreed with recommendation",
    };
    const result = LoopLogSchema.parse(valid);
    expect(result.overridden).toBe(true);
    expect(result.overrideReason).toBeDefined();
  });
});

describe("ConfigSchema", () => {
  it("parses minimal config", () => {
    const minimal = {};
    const result = ConfigSchema.parse(minimal);
    expect(result.version).toBe(1);
  });

  it("parses full config", () => {
    const full = {
      version: 1,
      activeProject: "my-app",
      distinctId: "user_123",
      auth: { apiKey: "sk-ant-abc123" },
      preferences: { defaultEditor: "vim", autoOpenDashboard: false },
    };
    const result = ConfigSchema.parse(full);
    expect(result.activeProject).toBe("my-app");
    expect(result.preferences?.autoOpenDashboard).toBe(false);
  });

  it("handles corrupted config gracefully with safeParse", () => {
    const corrupted = { version: "not-a-number", auth: "broken" };
    const result = ConfigSchema.safeParse(corrupted);
    expect(result.success).toBe(false);
  });

  it("handles empty object", () => {
    const result = ConfigSchema.parse({});
    expect(result.version).toBe(1);
    expect(result.activeProject).toBeUndefined();
  });

  it("handles partial preferences", () => {
    const partial = {
      version: 1,
      preferences: { autoOpenDashboard: true },
    };
    const result = ConfigSchema.parse(partial);
    expect(result.preferences?.defaultEditor).toBeUndefined();
  });
});

describe("slugify", () => {
  it("converts to lowercase with dashes", () => {
    expect(slugify("My App Name")).toBe("my-app-name");
  });

  it("removes special characters", () => {
    expect(slugify("Hello World! @#$")).toBe("hello-world");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("--test--")).toBe("test");
  });

  it("handles already-slugified input", () => {
    expect(slugify("my-app")).toBe("my-app");
  });
});

describe("getWeekNumber", () => {
  it("returns a number between 1 and 53", () => {
    const week = getWeekNumber();
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(53);
  });

  it("returns consistent week for same date", () => {
    const date = new Date("2026-04-25");
    expect(getWeekNumber(date)).toBe(getWeekNumber(date));
  });
});

describe("formatDate", () => {
  it("returns ISO date string", () => {
    const date = new Date("2026-04-25T10:00:00Z");
    expect(formatDate(date)).toBe("2026-04-25");
  });

  it("returns today's date when no argument", () => {
    const result = formatDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("ShippingDNASchema", () => {
  it("parses valid shipping DNA", () => {
    const valid = {
      pattern: "Marathoner",
      patternDescription: "Steady progress over time",
      velocityTrend: "accelerating",
      avgTasksCompleted: 4.5,
      avgScore: 7.2,
      peakDay: "Tuesday",
      completionStyle: "finisher",
      totalWeeks: 8,
      streak: 3,
      riskWarnings: ["Scope creep detected"],
      strengths: ["Consistent shipping"],
    };
    const result = ShippingDNASchema.parse(valid);
    expect(result.pattern).toBe("Marathoner");
    expect(result.totalWeeks).toBe(8);
  });

  it("rejects invalid pattern", () => {
    const invalid = {
      pattern: "Unknown",
      patternDescription: "test",
      velocityTrend: "steady",
      avgTasksCompleted: 1,
      avgScore: 1,
      peakDay: "Mon",
      completionStyle: "balancer",
      totalWeeks: 1,
      streak: 0,
      riskWarnings: [],
      strengths: [],
    };
    expect(() => ShippingDNASchema.parse(invalid)).toThrow();
  });
});

describe("ChurnRiskSchema", () => {
  it("parses valid churn risk", () => {
    const valid = {
      level: "medium",
      signals: [
        {
          type: "declining_score",
          severity: "warning",
          message: "Score dropped 2 weeks in a row",
        },
      ],
      suggestions: ["Run loopkit loop to realign"],
    };
    const result = ChurnRiskSchema.parse(valid);
    expect(result.level).toBe("medium");
    expect(result.signals).toHaveLength(1);
  });

  it("rejects invalid signal type", () => {
    const invalid = {
      level: "high",
      signals: [
        {
          type: "missing_tasks",
          severity: "warning",
          message: "test",
        },
      ],
      suggestions: [],
    };
    expect(() => ChurnRiskSchema.parse(invalid)).toThrow();
  });
});

describe("SuccessPredictionSchema", () => {
  it("parses valid success prediction", () => {
    const valid = {
      probability: 0.65,
      confidence: "medium",
      strengths: ["Consistent shipping", "Clear ICP"],
      risks: ["Low velocity", "No revenue yet"],
      shiftFactors: [
        {
          factor: "Increase ship cadence",
          impact: 0.15,
          direction: "positive",
        },
      ],
      weeksAnalyzed: 12,
    };
    const result = SuccessPredictionSchema.parse(valid);
    expect(result.probability).toBe(0.65);
    expect(result.confidence).toBe("medium");
  });

  it("rejects probability above 1", () => {
    const invalid = {
      probability: 1.5,
      confidence: "high",
      strengths: [],
      risks: [],
      shiftFactors: [],
      weeksAnalyzed: 4,
    };
    expect(() => SuccessPredictionSchema.parse(invalid)).toThrow();
  });
});

describe("CompetitorLaunchSchema", () => {
  it("parses valid competitor launch", () => {
    const valid = {
      name: "CompetitorX",
      url: "https://competitorx.com",
      date: "2026-04-20",
      platform: "producthunt",
      relevance: 85,
      description: "A new tool for founders",
      tagline: "Ship faster",
    };
    const result = CompetitorLaunchSchema.parse(valid);
    expect(result.platform).toBe("producthunt");
    expect(result.relevance).toBe(85);
  });

  it("rejects invalid platform", () => {
    const invalid = {
      name: "Test",
      date: "2026-04-20",
      platform: "linkedin",
      relevance: 50,
    };
    expect(() => CompetitorLaunchSchema.parse(invalid)).toThrow();
  });

  it("rejects relevance above 100", () => {
    const invalid = {
      name: "Test",
      date: "2026-04-20",
      platform: "hackernews",
      relevance: 101,
    };
    expect(() => CompetitorLaunchSchema.parse(invalid)).toThrow();
  });
});

describe("KeywordOpportunitySchema", () => {
  it("parses valid keyword opportunity", () => {
    const valid = {
      keyword: "saas founder tools",
      score: 78,
      volume: "medium",
      competition: "low",
      sources: ["google-autocomplete"],
      suggestions: ["saas founder toolkit", "best saas founder tools"],
    };
    const result = KeywordOpportunitySchema.parse(valid);
    expect(result.keyword).toBe("saas founder tools");
    expect(result.score).toBe(78);
  });

  it("rejects invalid volume enum", () => {
    const invalid = {
      keyword: "test",
      score: 50,
      volume: "huge",
      competition: "low",
      sources: [],
    };
    expect(() => KeywordOpportunitySchema.parse(invalid)).toThrow();
  });

  it("rejects negative score", () => {
    const invalid = {
      keyword: "test",
      score: -1,
      volume: "low",
      competition: "high",
      sources: [],
    };
    expect(() => KeywordOpportunitySchema.parse(invalid)).toThrow();
  });
});

describe("MarketSignalSchema", () => {
  it("parses valid market signal", () => {
    const valid = {
      category: "saas founders",
      fundingTrend: "up",
      fundingCount: 12,
      devTrend: "stable",
      devGrowth: 45,
      hiringTrend: "up",
      hiringCount: 89,
      compositeScore: 72,
      signal: "heating",
      lastUpdated: "2026-04-27",
    };
    const result = MarketSignalSchema.parse(valid);
    expect(result.compositeScore).toBe(72);
    expect(result.signal).toBe("heating");
  });

  it("rejects composite score above 100", () => {
    const invalid = {
      category: "test",
      fundingTrend: "up",
      fundingCount: 0,
      devTrend: "down",
      devGrowth: 0,
      hiringTrend: "stable",
      hiringCount: 0,
      compositeScore: 101,
      signal: "stable",
      lastUpdated: "2026-04-27",
    };
    expect(() => MarketSignalSchema.parse(invalid)).toThrow();
  });

  it("rejects invalid signal", () => {
    const invalid = {
      category: "test",
      fundingTrend: "up",
      fundingCount: 0,
      devTrend: "down",
      devGrowth: 0,
      hiringTrend: "stable",
      hiringCount: 0,
      compositeScore: 50,
      signal: "booming",
      lastUpdated: "2026-04-27",
    };
    expect(() => MarketSignalSchema.parse(invalid)).toThrow();
  });
});

describe("PatternInterruptResponseSchema", () => {
  it("parses valid pattern interrupt response", () => {
    const valid = {
      patterns: [
        {
          type: "overplanner",
          severity: "warning",
          message: "You keep adding tasks without shipping",
          suggestions: ["Limit to 3 tasks per week", "Ship before planning"],
          weeksObserved: 3,
        },
      ],
      totalWeeks: 6,
      scannedAt: "2026-04-27",
    };
    const result = PatternInterruptResponseSchema.parse(valid);
    expect(result.patterns).toHaveLength(1);
    expect(result.totalWeeks).toBe(6);
  });

  it("rejects invalid pattern type", () => {
    const invalid = {
      patterns: [
        {
          type: "procrastinator",
          severity: "critical",
          message: "test",
          suggestions: ["fix it"],
          weeksObserved: 1,
        },
      ],
      totalWeeks: 2,
      scannedAt: "2026-04-27",
    };
    expect(() => PatternInterruptResponseSchema.parse(invalid)).toThrow();
  });

  it("rejects too many suggestions", () => {
    const invalid = {
      patterns: [
        {
          type: "snooze_loop",
          severity: "warning",
          message: "test",
          suggestions: ["a", "b", "c"],
          weeksObserved: 1,
        },
      ],
      totalWeeks: 2,
      scannedAt: "2026-04-27",
    };
    expect(() => PatternInterruptResponseSchema.parse(invalid)).toThrow();
  });
});

describe("CoachingPlanSchema", () => {
  it("parses valid coaching plan", () => {
    const valid = {
      moments: [
        {
          id: "m1",
          week: 4,
          priority: "warning",
          title: "Shipping cadence dropped",
          message: "You shipped 1 task this week vs 5 last week",
          action: "Run loopkit loop to identify blockers",
          command: "loopkit loop",
          condition: "tasksCompleted < 2",
        },
      ],
      totalWeeks: 6,
      generatedAt: "2026-04-27",
    };
    const result = CoachingPlanSchema.parse(valid);
    expect(result.moments).toHaveLength(1);
    expect(result.totalWeeks).toBe(6);
  });

  it("rejects invalid priority", () => {
    const invalid = {
      moments: [
        {
          id: "m1",
          priority: "urgent",
          title: "test",
          message: "test",
          action: "test",
          condition: "true",
        },
      ],
      totalWeeks: 2,
      generatedAt: "2026-04-27",
    };
    expect(() => CoachingPlanSchema.parse(invalid)).toThrow();
  });
});

describe("PeerInspirationResponseSchema", () => {
  it("parses valid peer inspiration response", () => {
    const valid = {
      category: "saas founders",
      peers: [
        {
          id: "p1",
          category: "saas founders",
          whatShipped: "Launched a new onboarding flow",
          weekNumber: 16,
          createdAt: "2026-04-20",
        },
      ],
      totalPeers: 1,
      fetchedAt: "2026-04-27",
    };
    const result = PeerInspirationResponseSchema.parse(valid);
    expect(result.category).toBe("saas founders");
    expect(result.peers).toHaveLength(1);
  });

  it("rejects peer with missing required field", () => {
    const invalid = {
      category: "test",
      peers: [
        {
          id: "p1",
          category: "test",
          weekNumber: 1,
          createdAt: "2026-04-20",
        },
      ],
      totalPeers: 1,
      fetchedAt: "2026-04-27",
    };
    expect(() => PeerInspirationResponseSchema.parse(invalid)).toThrow();
  });
});

describe("detectProjectCategory", () => {
  it("detects saas from keywords", () => {
    expect(detectProjectCategory("A SaaS platform for teams")).toBe("saas");
    expect(detectProjectCategory("B2B subscription dashboard")).toBe("saas");
    expect(detectProjectCategory("CRM platform")).toBe("saas");
  });

  it("detects mobile from keywords", () => {
    expect(detectProjectCategory("iOS app for fitness")).toBe("mobile");
    expect(detectProjectCategory("React Native social app")).toBe("mobile");
    expect(detectProjectCategory("Android flutter game")).toBe("mobile");
  });

  it("detects cli from keywords", () => {
    expect(detectProjectCategory("A CLI tool for developers")).toBe("cli");
    expect(detectProjectCategory("npm package script runner")).toBe("cli");
    expect(detectProjectCategory("terminal command utility")).toBe("cli");
  });

  it("detects api from keywords", () => {
    expect(detectProjectCategory("REST API backend")).toBe("api");
    expect(detectProjectCategory("microservice endpoint")).toBe("api");
  });

  it("detects newsletter from keywords", () => {
    expect(detectProjectCategory("Weekly newsletter about tech")).toBe(
      "newsletter",
    );
    expect(detectProjectCategory("Content writing blog")).toBe("newsletter");
  });

  it("detects marketplace from keywords", () => {
    expect(detectProjectCategory("Two-sided marketplace for freelancers")).toBe(
      "marketplace",
    );
    expect(detectProjectCategory("Booking service for rentals")).toBe(
      "marketplace",
    );
  });

  it("detects ai from keywords", () => {
    expect(detectProjectCategory("LLM powered assistant")).toBe("ai");
    expect(detectProjectCategory("GPT chatbot service")).toBe("ai");
    expect(detectProjectCategory("model training pipeline")).toBe("ai");
  });

  it("detects ecommerce from keywords", () => {
    expect(detectProjectCategory("Shopify store checkout")).toBe("ecommerce");
    expect(detectProjectCategory("Ecommerce cart solution")).toBe("ecommerce");
  });

  it("falls back to general when no keywords match", () => {
    expect(detectProjectCategory("Something completely random")).toBe(
      "general",
    );
    expect(detectProjectCategory("")).toBe("general");
    expect(detectProjectCategory("Hello world")).toBe("general");
  });

  it("is case insensitive", () => {
    expect(detectProjectCategory("SaaS PLATFORM")).toBe("saas");
    expect(detectProjectCategory("IOS APP")).toBe("mobile");
    expect(detectProjectCategory("CLI TOOL")).toBe("cli");
  });

  it("handles multiple keywords by returning first match", () => {
    // "saas" appears before "mobile" in the keyword map iteration order
    expect(detectProjectCategory("saas mobile app")).toBe("saas");
  });

  it("handles mixed case with punctuation", () => {
    expect(detectProjectCategory("My SaaS! (B2B)")).toBe("saas");
    expect(detectProjectCategory("iOS & Android — Mobile")).toBe("mobile");
  });
});
