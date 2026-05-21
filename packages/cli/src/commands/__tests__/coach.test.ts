import { describe, it, expect, vi, beforeEach } from "vitest";
import { coachCommand } from "../coach.js";
import {
  readConfig,
  readLastNLoopLogs,
  readLoopLog,
  readBriefJson,
} from "../../storage/local.js";
import { computeShippingDNA } from "../../analytics/dna.js";
import { computeBenchmarks } from "../../analytics/benchmarks.js";
import { generateStructured } from "../../ai/client.js";
import { clog, ceremonyIntro, ceremonyOutro } from "../../ui/theme.js";

// Mock storage/local.js
vi.mock("../../storage/local.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
  readBriefJson: vi.fn(),
}));

// Mock analytics/dna.js
vi.mock("../../analytics/dna.js", () => ({
  computeShippingDNA: vi.fn(),
}));

// Mock analytics/benchmarks.js
vi.mock("../../analytics/benchmarks.js", () => ({
  computeBenchmarks: vi.fn(),
}));

// Mock ai/client.js
vi.mock("../../ai/client.js", () => ({
  generateStructured: vi.fn(),
}));

// Mock ui/theme.js for spying on stdout and prompts
vi.mock("../../ui/theme.js", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ceremonyIntro: vi.fn(),
    ceremonyOutro: vi.fn(),
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
  };
});

describe("coachCommand --dna", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default config mock
    vi.mocked(readConfig).mockReturnValue({
      version: 1,
      activeProject: "test-project",
    });
  });

  it("exits early with a friendly reminder if less than 4 weeks of data exist", async () => {
    vi.mocked(computeShippingDNA).mockReturnValue(null);

    const stepSpy = vi.spyOn(clog, "step").mockImplementation(() => {});
    const messageSpy = vi.spyOn(clog, "message").mockImplementation(() => {});
    const infoSpy = vi.spyOn(clog, "info").mockImplementation(() => {});

    await coachCommand({ dna: true });

    expect(ceremonyIntro).toHaveBeenCalledWith("Founder DNA Report");
    expect(stepSpy).toHaveBeenCalledWith("Not Enough Data Yet");
    expect(messageSpy).toHaveBeenCalledWith(
      expect.stringContaining("requires at least 4 weeks of loop data")
    );
    expect(ceremonyOutro).toHaveBeenCalledWith(
      expect.stringContaining("Keep shipping")
    );

    stepSpy.mockRestore();
    messageSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it("renders a beautiful Spotify Wrapped-style card when 4+ weeks of data exist", async () => {
    const mockDNA = {
      pattern: "All-Star" as const,
      patternDescription: "You maintain both high output and high consistency.",
      velocityTrend: "steady" as const,
      avgTasksCompleted: 5,
      avgScore: 88,
      peakDay: "Wednesday",
      completionStyle: "finisher" as const,
      totalWeeks: 6,
      streak: 4,
      riskWarnings: ["declining velocity"],
      strengths: ["highly consistent"],
    };

    vi.mocked(computeShippingDNA).mockReturnValue(mockDNA);

    // Mock loop logs for Best Week calculation
    vi.mocked(readLastNLoopLogs).mockReturnValue([
      { weekNumber: 2, overridden: false },
      { weekNumber: 1, overridden: false },
    ]);

    vi.mocked(readLoopLog).mockImplementation((weekNum) => {
      if (weekNum === 2) {
        return [
          "# Week 2",
          "- Tasks completed: 6",
          "- Tasks open: 0",
          "- Shipping score: 95%",
        ].join("\n");
      }
      if (weekNum === 1) {
        return [
          "# Week 1",
          "- Tasks completed: 4",
          "- Tasks open: 2",
          "- Shipping score: 80%",
        ].join("\n");
      }
      return null;
    });

    vi.mocked(computeBenchmarks).mockReturnValue({
      overallPercentile: 92,
      comparison: "Outperforming 92% of founders.",
      velocityPercentile: 85,
      scorePercentile: 90,
    });

    vi.mocked(readBriefJson).mockReturnValue({
      answers: {
        name: "TestApp",
        problem: "pain point",
        icp: "developers",
        whyUnsolved: "complex",
        mvp: "cli",
      },
      brief: {
        bet: "bet on developers",
        riskiestAssumption: "no one uses CLI",
        validateAction: "launch",
        mvpPlainEnglish: "cli app",
        icpScore: 8,
        icpNote: "",
        problemScore: 8,
        problemNote: "",
        mvpScore: 8,
        mvpNote: "",
        overallScore: 8,
      },
    });

    vi.mocked(generateStructured).mockResolvedValue({
      recommendation: "Keep doing what you're doing. Expand tests for reliability.",
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await coachCommand({ dna: true });

    expect(ceremonyIntro).toHaveBeenCalledWith("Founder DNA Report");
    expect(generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "loop",
        schema: expect.any(Object),
      })
    );
    expect(consoleSpy).toHaveBeenCalled();

    // Verify printed card contents
    const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
    expect(output).toContain("FOUNDER DNA WRAPPED");
    expect(output).toContain("TestApp");
    expect(output).toContain("ALL-STAR");
    expect(output).toContain("95%"); // Best Week score
    expect(output).toContain("Expand tests");
    expect(output).toContain("reliability.");

    expect(ceremonyOutro).toHaveBeenCalledWith("Keep shipping!");

    consoleSpy.mockRestore();
  });
});
