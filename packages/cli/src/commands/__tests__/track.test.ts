import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackCommand } from "../track.js";
import {
  readConfig,
  readTasksFile,
  writeTasksFile,
  projectExists,
  appendToCut,
  getLastShipDate,
  getProjectCreationDate,
  readLastNLoopLogs,
} from "../../storage/local.js";
import { getSnoozeWarning } from "../../analytics/oracle.js";
import { getPriorityMoment } from "../../analytics/coach.js";
import { computeLoopKitScore } from "../../analytics/score.js";
import { computeBenchmarks } from "../../analytics/benchmarks.js";
import { clog, select, text, confirm, isCancel } from "../../ui/theme.js";

// Mock local storage
vi.mock("../../storage/local.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  readTasksFile: vi.fn(),
  writeTasksFile: vi.fn(),
  createTasksScaffold: vi.fn(),
  getTasksPath: vi.fn(),
  ensureProjectDir: vi.fn(),
  appendToCut: vi.fn(),
  projectExists: vi.fn(),
  readLastNLoopLogs: vi.fn(),
  readLoopLog: vi.fn(),
  saveStandup: vi.fn(),
  readStandup: vi.fn(),
  getStandupStreak: vi.fn(),
  getLastShipDate: vi.fn(),
  getProjectCreationDate: vi.fn(),
}));

// Mock oracle
vi.mock("../../analytics/oracle.js", () => ({
  getSnoozeWarning: vi.fn(),
  computeSnoozeStats: vi.fn(),
}));

// Mock coach
vi.mock("../../analytics/coach.js", () => ({
  getPriorityMoment: vi.fn(),
  recordMomentShown: vi.fn(),
}));

// Mock score
vi.mock("../../analytics/score.js", () => ({
  computeLoopKitScore: vi.fn(),
  renderLoopKitScore: vi.fn(),
  readLoopKitScoreFromLog: vi.fn(),
}));

// Mock benchmarks
vi.mock("../../analytics/benchmarks.js", () => ({
  computeBenchmarks: vi.fn(),
  renderBenchmarks: vi.fn(),
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
  };
});

describe("trackCommand", () => {
  let exitSpy: any;
  let clogSuccessSpy: any;
  let clogErrorSpy: any;
  let clogWarnSpy: any;
  let clogInfoSpy: any;
  let clogMessageSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    clogSuccessSpy = vi.spyOn(clog, "success").mockImplementation(() => {});
    clogErrorSpy = vi.spyOn(clog, "error").mockImplementation(() => {});
    clogWarnSpy = vi.spyOn(clog, "warn").mockImplementation(() => {});
    clogInfoSpy = vi.spyOn(clog, "info").mockImplementation(() => {});
    clogMessageSpy = vi.spyOn(clog, "message").mockImplementation(() => {});

    // Default setup
    vi.mocked(readConfig).mockReturnValue({
      version: 1,
      activeProject: "test-project",
      coaching: { enabled: false },
    });
    vi.mocked(projectExists).mockReturnValue(true);
    vi.mocked(getLastShipDate).mockReturnValue(new Date());
    vi.mocked(getProjectCreationDate).mockReturnValue(new Date());
    vi.mocked(readLastNLoopLogs).mockReturnValue([]);
    vi.mocked(computeLoopKitScore).mockReturnValue(null);
    vi.mocked(computeBenchmarks).mockReturnValue(null);
    vi.mocked(getPriorityMoment).mockReturnValue(null);
  });

  describe("Validation", () => {
    it("fails if activeProject is not set", async () => {
      vi.mocked(readConfig).mockReturnValue({ version: 1 });
      await expect(trackCommand()).rejects.toThrow("process.exit: 1");
      expect(clogErrorSpy).toHaveBeenCalledWith(expect.stringContaining("No active project"));
    });

    it("validates numerical task ID", async () => {
      await expect(trackCommand("abc", { done: true })).rejects.toThrow("process.exit: 1");
      expect(clogErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid task ID"));
    });

    it("errors if task ID not found in task file", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Complete this task\n");
      await expect(trackCommand("2", { done: true })).rejects.toThrow("process.exit: 1");
      expect(clogErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Task #2 not found"));
    });
  });

  describe("Inline Actions", () => {
    it("completes a task using --done option", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Complete this task\n");
      await trackCommand("1", { done: true });

      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [x] #1 Complete this task — closed via cli on")
      );
      expect(clogSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('Completed #1: "Complete this task"'));
    });

    it("strips out existing snooze metadata on completion", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Complete this task — snoozed:2026-05-30\n");
      await trackCommand("1", { done: true });

      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.not.stringContaining("snoozed:2026-05-30")
      );
      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [x] #1 Complete this task — closed via cli on")
      );
    });

    it("snoozes a task using --snooze option", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Task to snooze\n");
      await trackCommand("1", { snooze: "5" });

      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [ ] #1 Task to snooze — snoozed:")
      );
      expect(clogInfoSpy).toHaveBeenCalledWith(expect.stringContaining("#1 snoozed until"));
    });

    it("snoozes with default of 3 days if no duration specified", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Task to snooze\n");
      await trackCommand("1", { snooze: true });

      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [ ] #1 Task to snooze — snoozed:")
      );
    });

    it("cuts a task using --cut option", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Task to cut\n- [ ] #2 Other task\n");
      await trackCommand("1", { cut: true });

      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        "## This Week\n- [ ] #2 Other task\n"
      );
      expect(appendToCut).toHaveBeenCalledWith("test-project", "- [ ] #1 Task to cut", expect.any(String));
      expect(clogWarnSpy).toHaveBeenCalledWith(expect.stringContaining("#1 cut → archived"));
    });
  });

  describe("Single Task Menu", () => {
    it("shows action select menu and completes task on 'done'", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Task in menu\n");
      vi.mocked(select).mockResolvedValue("done");

      await trackCommand("1", {});

      expect(select).toHaveBeenCalled();
      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [x] #1 Task in menu — closed via cli on")
      );
    });

    it("shows action select menu and snoozes task on 'snooze'", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Task in menu\n");
      vi.mocked(select).mockResolvedValue("snooze");
      vi.mocked(text).mockResolvedValue("4");

      await trackCommand("1", {});

      expect(text).toHaveBeenCalledWith(expect.objectContaining({ message: "Snooze for how many days?" }));
      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [ ] #1 Task in menu — snoozed:")
      );
    });

    it("shows action select menu and cuts task on 'cut'", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Task in menu\n");
      vi.mocked(select).mockResolvedValue("cut");

      await trackCommand("1", {});

      expect(writeTasksFile).toHaveBeenCalledWith("test-project", "## This Week\n");
      expect(appendToCut).toHaveBeenCalledWith("test-project", "- [ ] #1 Task in menu", expect.any(String));
    });
  });

  describe("Interactive Mode", () => {
    it("displays message if no open tasks in interactive manager", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [x] #1 Completed task\n");
      await trackCommand(undefined, { interactive: true });

      expect(clogInfoSpy).toHaveBeenCalledWith(expect.stringContaining("No open tasks!"));
    });

    it("allows choosing a task and completing it in recursive loop, then exits", async () => {
      vi.mocked(readTasksFile).mockReturnValue("## This Week\n- [ ] #1 Open task\n");
      
      // First select task 1, then choose action done
      // Next iteration has no open tasks or exit option, but let's mock select to return "exit" next
      vi.mocked(select)
        .mockResolvedValueOnce("1") // select task
        .mockResolvedValueOnce("done") // select action
        .mockResolvedValueOnce("exit"); // exit manager

      await trackCommand(undefined, { interactive: true });

      expect(writeTasksFile).toHaveBeenCalledWith(
        "test-project",
        expect.stringContaining("- [x] #1 Open task — closed via cli on")
      );
    });
  });
});
