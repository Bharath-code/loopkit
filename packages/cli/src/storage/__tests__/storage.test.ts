import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  getRoot,
  getConfigPath,
  getProjectDir,
  getBriefPath,
  getBriefJsonPath,
  getTasksPath,
  getCutPath,
  getShipDir,
  getShipLogPath,
  getLogsDir,
  getLoopLogPath,
  getPulseDir,
  getPulseResponsesPath,
  ensureDir,
  ensureLoopkitDir,
  ensureProjectDir,
  readConfig,
  writeConfig,
  saveBrief,
  readBriefJson,
  briefExists,
  projectExists,
  readTasksFile,
  writeTasksFile,
  createTasksScaffold,
  appendToCut,
  readPulseResponses,
  appendPulseResponse,
  saveShipLog,
  readShipLog,
  shipLogExists,
  saveLoopLog,
  readLoopLog,
  loopLogExists,
  listProjects,
  readLastNLoopLogs,
  getConsecutiveWeeksStreak,
  saveDraft,
  readDraft,
  deleteDraft,
} from "../local";

const TEST_BASE = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-test-"));

function setCwdToTestDir(): void {
  process.chdir(TEST_BASE);
}

function cleanupTestDir(): void {
  if (fs.existsSync(TEST_BASE)) {
    fs.rmSync(TEST_BASE, { recursive: true, force: true });
  }
}

describe("Path Resolvers", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  function normalizePath(p: string): string {
    return path.resolve(p).replace(/^\/private/, "");
  }

  it("getRoot returns .loopkit in cwd", () => {
    expect(normalizePath(getRoot())).toBe(normalizePath(path.join(TEST_BASE, ".loopkit")));
  });

  it("getConfigPath returns correct path", () => {
    expect(normalizePath(getConfigPath())).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "config.json")));
  });

  it("getProjectDir returns projects/slug", () => {
    expect(normalizePath(getProjectDir("my-app"))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "projects", "my-app")));
  });

  it("getBriefPath returns brief.md", () => {
    expect(normalizePath(getBriefPath("my-app"))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "projects", "my-app", "brief.md")));
  });

  it("getBriefJsonPath returns brief.json", () => {
    expect(normalizePath(getBriefJsonPath("my-app"))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "projects", "my-app", "brief.json")));
  });

  it("getTasksPath returns tasks.md", () => {
    expect(normalizePath(getTasksPath("my-app"))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "projects", "my-app", "tasks.md")));
  });

  it("getCutPath returns cut.md", () => {
    expect(normalizePath(getCutPath("my-app"))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "projects", "my-app", "cut.md")));
  });

  it("getShipDir returns ships dir", () => {
    expect(normalizePath(getShipDir())).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "ships")));
  });

  it("getShipLogPath returns dated file", () => {
    expect(normalizePath(getShipLogPath("2026-04-25"))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "ships", "2026-04-25.md")));
  });

  it("getLoopLogPath returns week file", () => {
    expect(normalizePath(getLoopLogPath(3))).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "logs", "week-3.md")));
  });

  it("getPulseDir returns pulse dir", () => {
    expect(normalizePath(getPulseDir())).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "pulse")));
  });

  it("getPulseResponsesPath returns responses.json", () => {
    expect(normalizePath(getPulseResponsesPath())).toBe(normalizePath(path.join(TEST_BASE, ".loopkit", "pulse", "responses.json")));
  });
});

describe("ensureDir", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("creates directory if missing", () => {
    const dir = path.join(TEST_BASE, "new-dir");
    expect(fs.existsSync(dir)).toBe(false);
    ensureDir(dir);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("does not error if directory exists", () => {
    const dir = path.join(TEST_BASE, "existing-dir");
    fs.mkdirSync(dir);
    expect(() => ensureDir(dir)).not.toThrow();
  });
});

describe("ensureLoopkitDir", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("creates all required directories", () => {
    ensureLoopkitDir();
    expect(fs.existsSync(getRoot())).toBe(true);
    expect(fs.existsSync(path.join(getRoot(), "projects"))).toBe(true);
    expect(fs.existsSync(getShipDir())).toBe(true);
    expect(fs.existsSync(getLogsDir())).toBe(true);
    expect(fs.existsSync(getPulseDir())).toBe(true);
  });
});

describe("Config I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("writeConfig creates file", () => {
    writeConfig({ version: 1, activeProject: "test" });
    expect(fs.existsSync(getConfigPath())).toBe(true);
  });

  it("readConfig returns defaults when file missing", () => {
    const config = readConfig();
    expect(config.version).toBe(1);
    expect(config.activeProject).toBeUndefined();
  });

  it("readConfig reads written config", () => {
    writeConfig({ version: 1, activeProject: "my-app" });
    const config = readConfig();
    expect(config.activeProject).toBe("my-app");
  });

  it("readConfig handles corrupted JSON by resetting", () => {
    ensureLoopkitDir();
    fs.writeFileSync(getConfigPath(), "not valid json{{{");
    const config = readConfig();
    expect(config.version).toBe(1);
  });

  it("readConfig handles missing version field", () => {
    ensureLoopkitDir();
    fs.writeFileSync(getConfigPath(), JSON.stringify({ activeProject: "x" }));
    const config = readConfig();
    expect(config.activeProject).toBe("x");
  });
});

describe("Brief I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("saveBrief creates both files", () => {
    saveBrief("my-app", {
      name: "TestApp",
      problem: "test",
      icp: "test",
      whyUnsolved: "test",
      mvp: "test",
    });
    expect(briefExists("my-app")).toBe(true);
    expect(fs.existsSync(getBriefJsonPath("my-app"))).toBe(true);
  });

  it("readBriefJson returns saved data", () => {
    saveBrief("my-app", {
      name: "TestApp",
      problem: "test problem",
      icp: "test icp",
      whyUnsolved: "test why",
      mvp: "test mvp",
    });
    const data = readBriefJson("my-app");
    expect(data).not.toBeNull();
    expect(data?.answers.name).toBe("TestApp");
  });

  it("readBriefJson returns null for missing project", () => {
    expect(readBriefJson("nonexistent")).toBeNull();
  });

  it("briefExists returns false for missing project", () => {
    expect(briefExists("nonexistent")).toBe(false);
  });

  it("saveBrief with brief data includes scores", () => {
    saveBrief("my-app", {
      name: "TestApp",
      problem: "test",
      icp: "test",
      whyUnsolved: "test",
      mvp: "test",
    }, {
      bet: "test bet",
      icpScore: 8,
      icpNote: "good",
      problemScore: 7,
      problemNote: "ok",
      mvpScore: 6,
      mvpNote: "narrow",
      overallScore: 7,
      riskiestAssumption: "risk",
      validateAction: "action",
      mvpPlainEnglish: "simple",
    });
    const data = readBriefJson("my-app");
    expect(data?.brief?.icpScore).toBe(8);
  });
});

describe("Draft I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("saveDraft and readDraft round-trip", () => {
    saveDraft("my-app", { name: "TestApp" }, 2);
    const draft = readDraft("my-app");
    expect(draft).not.toBeNull();
    expect(draft?.partialAnswers.name).toBe("TestApp");
    expect(draft?.lastQuestion).toBe(2);
  });

  it("readDraft returns null for missing draft", () => {
    expect(readDraft("nonexistent")).toBeNull();
  });

  it("deleteDraft removes file", () => {
    saveDraft("my-app", { name: "X" }, 1);
    deleteDraft("my-app");
    expect(readDraft("my-app")).toBeNull();
  });

  it("deleteDraft does not error for missing file", () => {
    expect(() => deleteDraft("nonexistent")).not.toThrow();
  });
});

describe("Tasks I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("writeTasksFile and readTasksFile round-trip", () => {
    const content = "# Tasks\n\n## This Week\n- [ ] Task A";
    writeTasksFile("my-app", content);
    expect(readTasksFile("my-app")).toBe(content);
  });

  it("readTasksFile returns null for missing file", () => {
    expect(readTasksFile("nonexistent")).toBeNull();
  });

  it("createTasksScaffold creates structured file", () => {
    createTasksScaffold("my-app", "TestApp");
    const content = readTasksFile("my-app");
    expect(content).toContain("# TestApp — Tasks");
    expect(content).toContain("## This Week");
    expect(content).toContain("## Backlog");
  });
});

describe("Cut Archive", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("appendToCut creates file with header", () => {
    appendToCut("my-app", "Old task", "2026-04-20");
    const content = fs.readFileSync(getCutPath("my-app"), "utf-8");
    expect(content).toContain("## Cut on 2026-04-20");
    expect(content).toContain("- [~] Old task");
  });

  it("appendToCut appends to existing file", () => {
    appendToCut("my-app", "Task 1", "2026-04-20");
    appendToCut("my-app", "Task 2", "2026-04-21");
    const content = fs.readFileSync(getCutPath("my-app"), "utf-8");
    expect(content).toContain("Task 1");
    expect(content).toContain("Task 2");
  });
});

describe("Pulse I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("readPulseResponses returns empty array when missing", () => {
    expect(readPulseResponses()).toEqual([]);
  });

  it("appendPulseResponse creates file", () => {
    appendPulseResponse("Great product!");
    const responses = readPulseResponses();
    expect(responses).toContain("Great product!");
  });

  it("appendPulseResponse accumulates responses", () => {
    appendPulseResponse("First");
    appendPulseResponse("Second");
    appendPulseResponse("Third");
    const responses = readPulseResponses();
    expect(responses).toHaveLength(3);
    expect(responses[0]).toBe("First");
    expect(responses[2]).toBe("Third");
  });

  it("appendPulseResponse trims whitespace", () => {
    appendPulseResponse("  trimmed  ");
    const responses = readPulseResponses();
    expect(responses[0]).toBe("trimmed");
  });

  it("readPulseResponses handles corrupted JSON", () => {
    ensureDir(getPulseDir());
    fs.writeFileSync(getPulseResponsesPath(), "not json{{{");
    expect(readPulseResponses()).toEqual([]);
  });
});

describe("Ship Log I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("saveShipLog and readShipLog round-trip", () => {
    saveShipLog("# Ship Log\n\nShipped landing page", "2026-04-25");
    expect(readShipLog("2026-04-25")).toContain("Shipped landing page");
  });

  it("readShipLog returns null for missing date", () => {
    expect(readShipLog("2026-01-01")).toBeNull();
  });

  it("shipLogExists checks correctly", () => {
    expect(shipLogExists("2026-04-25")).toBe(false);
    saveShipLog("test", "2026-04-25");
    expect(shipLogExists("2026-04-25")).toBe(true);
  });
});

describe("Loop Log I/O", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("saveLoopLog and readLoopLog round-trip", () => {
    saveLoopLog(3, "# Week 3\n\nShipped: API");
    expect(readLoopLog(3)).toContain("Shipped: API");
  });

  it("readLoopLog returns null for missing week", () => {
    expect(readLoopLog(99)).toBeNull();
  });

  it("loopLogExists checks correctly", () => {
    expect(loopLogExists(5)).toBe(false);
    saveLoopLog(5, "test");
    expect(loopLogExists(5)).toBe(true);
  });
});

describe("listProjects", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("returns empty array when no projects", () => {
    expect(listProjects()).toEqual([]);
  });

  it("returns project slugs", () => {
    ensureProjectDir("app-one");
    ensureProjectDir("app-two");
    const projects = listProjects();
    expect(projects).toContain("app-one");
    expect(projects).toContain("app-two");
  });

  it("excludes files, only directories", () => {
    ensureProjectDir("real-project");
    ensureDir(getRoot());
    fs.writeFileSync(path.join(getRoot(), "projects", "not-a-dir"), "file");
    const projects = listProjects();
    expect(projects).toContain("real-project");
    expect(projects).not.toContain("not-a-dir");
  });
});

describe("readLastNLoopLogs", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("returns empty array when no logs", () => {
    expect(readLastNLoopLogs(3)).toEqual([]);
  });

  it("returns newest logs first", () => {
    saveLoopLog(1, "Week 1");
    saveLoopLog(3, "Week 3");
    saveLoopLog(2, "Week 2");
    const logs = readLastNLoopLogs(2);
    expect(logs).toHaveLength(2);
    expect(logs[0].weekNumber).toBe(3);
    expect(logs[1].weekNumber).toBe(2);
  });

  it("detects override marker", () => {
    saveLoopLog(5, "Week 5\n\n_Override: I disagreed");
    const logs = readLastNLoopLogs(1);
    expect(logs[0].overridden).toBe(true);
  });

  it("returns non-overridden as false", () => {
    saveLoopLog(5, "Week 5\n\nNormal log");
    const logs = readLastNLoopLogs(1);
    expect(logs[0].overridden).toBe(false);
  });
});

describe("getConsecutiveWeeksStreak", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("returns 0 when no logs", () => {
    expect(getConsecutiveWeeksStreak(5)).toBe(0);
  });

  it("counts consecutive weeks", () => {
    saveLoopLog(1, "Week 1");
    saveLoopLog(2, "Week 2");
    saveLoopLog(3, "Week 3");
    saveLoopLog(4, "Week 4");
    expect(loopLogExists(1)).toBe(true);
    expect(loopLogExists(4)).toBe(true);
    expect(getConsecutiveWeeksStreak(5)).toBe(4);
  });

  it("stops at gap", () => {
    saveLoopLog(1, "Week 1");
    saveLoopLog(2, "Week 2");
    saveLoopLog(4, "Week 4");
    expect(getConsecutiveWeeksStreak(5)).toBe(1);
  });

  it("counts from current week - 1", () => {
    saveLoopLog(3, "Week 3");
    saveLoopLog(4, "Week 4");
    expect(getConsecutiveWeeksStreak(5)).toBe(2);
  });
});

describe("projectExists", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("returns true for existing project", () => {
    ensureProjectDir("my-app");
    expect(projectExists("my-app")).toBe(true);
  });

  it("returns false for missing project", () => {
    expect(projectExists("nonexistent")).toBe(false);
  });
});
