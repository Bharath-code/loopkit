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
  slugify,
  getWeekNumber,
  formatDate,
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
      oneThing: "Ship the landing page",
      rationale: "Nothing shipped this week",
      tension: null,
      bipPost: "Week 3 of building. Shipped: nothing. Next: landing page.",
    };
    const result = LoopSynthesisSchema.parse(valid);
    expect(result.tension).toBeNull();
  });

  it("parses with tension string", () => {
    const valid = {
      oneThing: "Fix onboarding",
      rationale: "Pulse says users are confused",
      tension: "Pulse wants onboarding fix, tasks focus on new features",
      bipPost: "Week 4. Learned: users are lost. Next: fix onboarding.",
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

  it("parses with optional synthesis", () => {
    const valid = {
      weekNumber: 3,
      date: "2026-04-25",
      tasksCompleted: 5,
      tasksTotal: 8,
      shippingScore: 6,
      synthesis: {
        oneThing: "Ship landing page",
        rationale: "test",
        tension: null,
        bipPost: "test",
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
