/**
 * Tests for `loopkit next` — the "what should I do right now?" command.
 *
 * Mocks storage/local to set up specific scenarios. Tests the
 * decideNextAction() function directly (without invoking the CLI entry).
 */
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const { TMP_ROOT } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeFs = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodePath = require("node:path") as typeof import("node:path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeOs = require("node:os") as typeof import("node:os");
  const root = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "loopkit-next-"));
  return { TMP_ROOT: root };
});

// Mutable test state read by the mock
let globalActiveSlug: string | null = null;
let globalTasksContent: string | null = null;
let globalLoopLogs: Array<{
  weekNumber: number;
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  shippingScore: number;
  overridden: boolean;
}> = [];

vi.mock("../../../storage/local.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../storage/local.js")>();
  return {
    ...actual,
    getRoot: () => TMP_ROOT,
    getProjectDir: (slug: string) => path.join(TMP_ROOT, "projects", slug),
    getLogsDir: () => path.join(TMP_ROOT, "logs"),
    getShipDir: () => path.join(TMP_ROOT, "ships"),
    readConfig: () => {
      // eslint-disable-next-line no-console
      console.log("MOCK readConfig, globalActiveSlug =", globalActiveSlug);
      return { activeProject: globalActiveSlug };
    },
    readBriefJson: () => ({ answers: {}, brief: null }),
    readTasksFile: () => globalTasksContent,
    listLoopLogs: () => globalLoopLogs,
  };
});

import { decideNextAction } from "../../next.js";

function resetFs() {
  if (fs.existsSync(TMP_ROOT)) {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  // Always create config.json so the first check passes
  fs.writeFileSync(path.join(TMP_ROOT, "config.json"), JSON.stringify({ version: 1 }));
}

beforeEach(() => {
  globalActiveSlug = null;
  globalTasksContent = null;
  globalLoopLogs = [];
  resetFs();
});

afterAll(() => {
  if (fs.existsSync(TMP_ROOT)) {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  }
});

describe("decideNextAction", () => {
  it("returns init when no active project is set", () => {
    // No active project in config
    globalActiveSlug = null;
    const action = decideNextAction();
    expect(action?.command).toBe("loopkit init");
  });

  it("returns add-first-task when project exists but tasks are empty", () => {
    globalActiveSlug = "myproj";
    // Project dir + brief must exist for the code to reach the task check
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    globalTasksContent = "## This Week\n\n## Backlog\n";
    globalLoopLogs = [];
    const action = decideNextAction();
    expect(action?.command).toMatch(/loopkit track -a/);
  });

  it("returns close-one-task when tasks are open and none done", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    globalTasksContent = "## This Week\n- [1] Ship landing page\n- [2] Add pricing\n";
    globalLoopLogs = [];
    const action = decideNextAction();
    // Day-of-week is dynamic; the code path is "tasks open, 0 done" → track
    expect(action?.command).toBe("loopkit track");
  });

  it("returns keep-the-streak when tasks are open and some done", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    globalTasksContent = "## This Week\n- [x] [1] Done\n- [2] Open\n";
    globalLoopLogs = [];
    const action = decideNextAction();
    expect(action?.command).toBe("loopkit track");
  });

  it("returns ship-when-no-ship-after-tasks-done", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    // All tasks done, no ship logs
    globalTasksContent = "- [x] [1] Done\n";
    globalLoopLogs = [];
    // Create a fresh loop log so we don't get pulled into overdue-loop
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    globalLoopLogs = [
      {
        weekNumber: 1,
        date: recent,
        tasksCompleted: 1,
        tasksTotal: 1,
        shippingScore: 90,
        overridden: false,
      },
    ];
    const action = decideNextAction();
    expect(action?.command).toBe("loopkit ship");
  });

  it("returns loop-async when streak is at risk", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    globalTasksContent = "- [x] [1] Done\n";
    // Loop log 14 days old
    const old = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    globalLoopLogs = [
      {
        weekNumber: 1,
        date: old,
        tasksCompleted: 1,
        tasksTotal: 1,
        shippingScore: 80,
        overridden: false,
      },
    ];
    // No recent ship, no open tasks → fall through to overdue loop
    const action = decideNextAction();
    expect(action?.command).toBe("loopkit loop --async");
  });
});
