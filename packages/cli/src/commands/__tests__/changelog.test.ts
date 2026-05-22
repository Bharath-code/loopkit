import { describe, it, expect, vi, beforeEach } from "vitest";
import { shipCommand } from "../ship.js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import {
  readConfig,
  readBriefJson,
  readTasksFile,
  readShipLog,
} from "../../storage/local.js";
import { generateStructured } from "../../ai/client.js";
import { select, text, confirm } from "../../ui/theme.js";

// Mock local storage
vi.mock("../../storage/local.js", () => ({
  readConfig: vi.fn(),
  readBriefJson: vi.fn(),
  readTasksFile: vi.fn(),
  readShipLog: vi.fn(),
  getShipDir: vi.fn(() => "/mock/ship/dir"),
  shipLogExists: vi.fn(),
  saveShipLog: vi.fn(),
}));

// Mock AI client
vi.mock("../../ai/client.js", () => ({
  generateStructured: vi.fn(),
}));

// Mock child_process
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
  spawnSync: vi.fn(),
}));

// Mock fs
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));

// Mock prompts from ui/theme.js
vi.mock("../../ui/theme.js", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ceremonyIntro: vi.fn(),
    ceremonyOutro: vi.fn(),
    select: vi.fn(),
    text: vi.fn(),
    confirm: vi.fn(),
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
    clog: {
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      message: vi.fn(),
      step: vi.fn(),
    },
  };
});

describe("shipCommand --changelog", () => {
  let writeFileSyncSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    writeFileSyncSpy = vi.mocked(fs.writeFileSync);

    // Default setup
    vi.mocked(readConfig).mockReturnValue({
      version: 1,
      activeProject: "test-project",
    });

    vi.mocked(readBriefJson).mockReturnValue({
      answers: {
        name: "Test Product",
        problem: "test problem",
        icp: "test icp",
        whyUnsolved: "test why",
        mvp: "test mvp",
      },
      brief: {
        bet: "test bet",
        uncomfortableTruth: "test truth",
        icpScore: 8,
        icpNote: "good",
        problemScore: 8,
        problemNote: "good",
        mvpScore: 8,
        mvpNote: "good",
        overallScore: 8,
        riskiestAssumption: "test assumption",
        validateAction: "test action",
        mvpPlainEnglish: "test mvp plain",
      },
    });

    vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [x] #1 Completed task\n");
    vi.mocked(execSync).mockReturnValue("abc1234 feat: add some cool feature\n");
    vi.mocked(readShipLog).mockReturnValue("**Product:** Test Product\n**What shipped:** Added test feature\n");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("# Changelog\n\n");
  });

  it("gathers context, generates changelog, and prepends to CHANGELOG.md upon selection of use", async () => {
    vi.mocked(generateStructured).mockResolvedValue({
      title: "The Cool Release",
      version: "v0.2.0",
      features: ["Add some cool feature"],
      improvements: ["Optimize some things"],
      fixes: ["Fix some bugs"],
    });

    vi.mocked(select).mockResolvedValue("use");

    await shipCommand({ changelog: true });

    expect(generateStructured).toHaveBeenCalledWith(expect.objectContaining({
      command: "changelog",
    }));

    // Expecting to write to CHANGELOG.md
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.stringContaining("CHANGELOG.md"),
      expect.stringContaining("## v0.2.0 - "),
      "utf-8"
    );
  });
});
