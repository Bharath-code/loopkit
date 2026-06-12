import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCommand } from "../update.js";
import {
  readConfig,
  readBriefJson,
  getLogsDir,
  getShipDir,
  readRevenueHistory,
  getConsecutiveWeeksStreak,
} from "../../storage/local.js";
import { generateStructured } from "../../ai/client.js";
import { clog, select, text, isCancel, ceremonyOutro } from "../../ui/theme.js";
import fs from "node:fs";

// Labs flag is required for `update` (and radar/keywords/timing) since v0.2.0
process.env.LOOPKIT_LABS = "1";

// Mock storage/local.js
vi.mock("../../storage/local.js", () => ({
  readConfig: vi.fn(),
  readBriefJson: vi.fn(),
  getLogsDir: vi.fn(() => "/mock/logs"),
  getShipDir: vi.fn(() => "/mock/ships"),
  readRevenueHistory: vi.fn(),
  getConsecutiveWeeksStreak: vi.fn(),
  ensureDir: vi.fn(),
  getRoot: vi.fn(() => "/mock/root"),
}));

// Mock node:fs
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

// Mock ai/client.js
vi.mock("../../ai/client.js", () => ({
  generateStructured: vi.fn(),
}));

// Mock ui/theme.js for prompts and clog
vi.mock("../../ui/theme.js", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ceremonyIntro: vi.fn(),
    ceremonyOutro: vi.fn(),
    select: vi.fn(),
    text: vi.fn(),
    isCancel: vi.fn((val) => val === "__CANCEL__"),
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
  };
});

describe("updateCommand", () => {
  let clogErrorSpy: any;
  let clogSuccessSpy: any;
  let clogWarnSpy: any;
  let clogInfoSpy: any;
  let clogStepSpy: any;
  let clogMessageSpy: any;
  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    clogErrorSpy = vi.spyOn(clog, "error").mockImplementation(() => {});
    clogSuccessSpy = vi.spyOn(clog, "success").mockImplementation(() => {});
    clogWarnSpy = vi.spyOn(clog, "warn").mockImplementation(() => {});
    clogInfoSpy = vi.spyOn(clog, "info").mockImplementation(() => {});
    clogStepSpy = vi.spyOn(clog, "step").mockImplementation(() => {});
    clogMessageSpy = vi.spyOn(clog, "message").mockImplementation(() => {});
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Default mocks
    vi.mocked(readConfig).mockReturnValue({
      version: 1,
      activeProject: "test-project",
    });

    vi.mocked(readBriefJson).mockReturnValue({
      answers: {
        name: "TestProduct",
        icp: "Founders",
      },
      brief: {
        bet: "Build a cool tool",
        riskiestAssumption: "Nobody wants CLI",
      },
    } as any);

    vi.mocked(readRevenueHistory).mockReturnValue([]);
    vi.mocked(getConsecutiveWeeksStreak).mockReturnValue(0);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
  });

  it("exits early if no active project context is configured", async () => {
    vi.mocked(readConfig).mockReturnValue({ version: 1 });

    await updateCommand("may", {});

    expect(clogErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("No active project context")
    );
  });

  it("exits early if invalid month is provided", async () => {
    await updateCommand("invalidmonthname", {});

    expect(clogErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid month")
    );
  });

  it("prompts for month and handles cancellation", async () => {
    vi.mocked(select).mockResolvedValue("__CANCEL__");

    await updateCommand(undefined, {});

    expect(select).toHaveBeenCalled();
  });

  it("prompts for manual month entry when selected and handles cancellation", async () => {
    vi.mocked(select).mockResolvedValue("manual");
    vi.mocked(text).mockResolvedValue("__CANCEL__");

    await updateCommand(undefined, {});

    expect(select).toHaveBeenCalled();
    expect(text).toHaveBeenCalled();
  });

  it("generates investor update report successfully using AI response", async () => {
    // Setup logs and ships
    vi.mocked(fs.readdirSync).mockImplementation(((dirPath: any) => {
      if (typeof dirPath !== "string") return [];
      if (dirPath.includes("logs")) {
        return ["week-1.md"];
      }
      if (dirPath.includes("ships")) {
        return ["2026-05-10.md"];
      }
      return [];
    }) as any);

    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath !== "string") return "";
      if (filePath.includes("week-1.md")) {
        return `# Week 1 — 2026-05-15 | project:test-project
- Tasks completed: 5
- Tasks open: 2
- Shipping score: 80%
- Feedback responses: 3
## What Moved Forward
Completed the initial prototype.
## The One Thing
Find beta testers.
**Tension:** Slow development speed.
`;
      }
      if (filePath.includes("2026-05-10.md")) {
        return `**Product:** TestProduct
**What shipped:** Launched basic dashboard page.
`;
      }
      return "";
    });

    vi.mocked(readRevenueHistory).mockReturnValue([
      {
        date: "2026-04-15",
        weekNumber: 1,
        mrr: 100,
        currency: "USD",
      },
      {
        date: "2026-05-20",
        weekNumber: 5,
        mrr: 150,
        currency: "USD",
      },
    ]);

    vi.mocked(getConsecutiveWeeksStreak).mockReturnValue(3);

    const mockAIResponse = {
      executiveSummary: "May progress was solid.",
      featuresShipped: ["Dashboard launch"],
      keyLearnings: ["Beta test feedback"],
      nextMonthFocus: "Growth",
      tensionsAndRisks: ["Pacing"],
    };

    vi.mocked(generateStructured).mockResolvedValue(mockAIResponse);

    await updateCommand("may", { year: "2026" });

    expect(generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "update",
        tier: "creative",
      })
    );

    // Verify written outputs
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // MD and HTML

    const mdWriteCall = vi.mocked(fs.writeFileSync).mock.calls.find((call) =>
      call[0].toString().endsWith(".md")
    );
    const htmlWriteCall = vi.mocked(fs.writeFileSync).mock.calls.find((call) =>
      call[0].toString().endsWith(".html")
    );

    expect(mdWriteCall).toBeDefined();
    expect(mdWriteCall![1]).toContain("May progress was solid.");
    expect(mdWriteCall![1]).toContain("Dashboard launch");
    expect(mdWriteCall![1]).toContain("Beta test feedback");

    expect(htmlWriteCall).toBeDefined();
    expect(htmlWriteCall![1]).toContain("TestProduct");
    expect(htmlWriteCall![1]).toContain("May progress was solid.");
    expect(htmlWriteCall![1]).toContain("Dashboard launch");
  });

  it("uses local fallback if AI generation fails", async () => {
    vi.mocked(fs.readdirSync).mockImplementation(((dirPath: any) => {
      if (typeof dirPath !== "string") return [];
      if (dirPath.includes("logs")) {
        return ["week-1.md"];
      }
      return [];
    }) as any);

    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (typeof filePath !== "string") return "";
      if (filePath.includes("week-1.md")) {
        return `# Week 1 — 2026-05-15 | project:test-project
- Tasks completed: 5
- Tasks open: 2
- Shipping score: 80%
- Feedback responses: 3
## What Moved Forward
Completed the initial prototype.
## The One Thing
Find beta testers.
`;
      }
      return "";
    });

    vi.mocked(generateStructured).mockRejectedValue(new Error("AI service error"));

    await updateCommand("may", { year: "2026" });

    // Verify fallback is used and files are written
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

    const mdWriteCall = vi.mocked(fs.writeFileSync).mock.calls.find((call) =>
      call[0].toString().endsWith(".md")
    );
    expect(mdWriteCall).toBeDefined();
    expect(mdWriteCall![1]).toContain("Routine maintenance and stability improvements.");
    expect(ceremonyOutro).toHaveBeenCalledWith(
      expect.stringContaining("Fallback data saved.")
    );
  });
});
