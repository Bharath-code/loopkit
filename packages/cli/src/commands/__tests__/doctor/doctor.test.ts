/**
 * Tests for `loopkit doctor` — diagnostic findings.
 *
 * Mocks storage/local to set up specific scenarios. Tests
 * getDoctorFindings() directly (without invoking the CLI entry).
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
  const root = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "loopkit-doctor-"));
  return { TMP_ROOT: root };
});

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
    readConfig: () => ({ activeProject: globalActiveSlug }),
    readBriefJson: () => ({ answers: {}, brief: null }),
    readTasksFile: () => globalTasksContent,
    listLoopLogs: () => globalLoopLogs,
  };
});

import { getDoctorFindings } from "../../doctor.js";

function resetFs() {
  if (fs.existsSync(TMP_ROOT)) {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_ROOT, { recursive: true });
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

describe("getDoctorFindings", () => {
  it("emits fatal when no active project", () => {
    globalActiveSlug = null;
    const findings = getDoctorFindings();
    expect(findings.some((f) => f.severity === "fail")).toBe(true);
  });

  it("emits fatal when project dir doesn't exist", () => {
    globalActiveSlug = "missing";
    // Don't create the dir
    const findings = getDoctorFindings();
    expect(findings.some((f) => f.severity === "fail")).toBe(true);
  });

  it("emits info when no loop logs exist", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    const findings = getDoctorFindings();
    expect(findings.some((f) => f.title === "No loop logs yet")).toBe(true);
  });

  it("emits fail when streak is broken (>7 days)", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    const old = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    globalLoopLogs = [
      {
        weekNumber: 1,
        date: old,
        tasksCompleted: 5,
        tasksTotal: 5,
        shippingScore: 80,
        overridden: false,
      },
    ];
    const findings = getDoctorFindings();
    expect(
      findings.some((f) => f.severity === "fail" && f.title.includes("Streak at risk")),
    ).toBe(true);
  });

  it("emits ok when streak is alive", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    globalLoopLogs = [
      {
        weekNumber: 1,
        date: recent,
        tasksCompleted: 5,
        tasksTotal: 5,
        shippingScore: 80,
        overridden: false,
      },
    ];
    const findings = getDoctorFindings();
    expect(findings.some((f) => f.severity === "ok" && f.title.includes("Streak alive"))).toBe(true);
  });

  it("warns when backlog is bloated", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    // 35 open tasks
    const lines: string[] = [];
    for (let i = 1; i <= 35; i++) lines.push(`- [${i}] Task ${i}`);
    globalTasksContent = `## This Week\n${lines.join("\n")}\n## Backlog\n`;
    const findings = getDoctorFindings();
    expect(findings.some((f) => f.severity === "warn" && f.title.includes("bloated"))).toBe(true);
  });

  it("warns when many tasks are snoozed 3+ times", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    globalTasksContent = [
      "- [1] Old thing (snoozed 3 times)",
      "- [2] Older thing (snoozed 5 times)",
      "- [3] Yet another (snoozed 4 times)",
    ].join("\n");
    const findings = getDoctorFindings();
    expect(
      findings.some((f) => f.severity === "warn" && f.title.includes("snoozed 3+")),
    ).toBe(true);
  });

  it("warns when too many recent weeks had score overrides", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    // 4 recent weeks, 3 overridden
    const base = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    globalLoopLogs = [1, 2, 3, 4].map((w, i) => {
      const d = new Date(base.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      return {
        weekNumber: w,
        date: d,
        tasksCompleted: 3,
        tasksTotal: 5,
        shippingScore: 50 + i,
        overridden: i < 3, // first 3 are overridden
      };
    });
    const findings = getDoctorFindings();
    expect(
      findings.some((f) => f.severity === "warn" && f.title.includes("overrides")),
    ).toBe(true);
  });

  it("warns when last ship is 8-21 days old", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const shipDir = path.join(TMP_ROOT, "ships");
    fs.mkdirSync(shipDir, { recursive: true });
    fs.writeFileSync(path.join(shipDir, `${oldDate}.md`), "# old ship");
    const findings = getDoctorFindings();
    expect(
      findings.some((f) => f.severity === "warn" && f.title.includes("Last ship")),
    ).toBe(true);
  });

  it("fails when last ship is >21 days old", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const shipDir = path.join(TMP_ROOT, "ships");
    fs.mkdirSync(shipDir, { recursive: true });
    fs.writeFileSync(path.join(shipDir, `${oldDate}.md`), "# very old ship");
    const findings = getDoctorFindings();
    expect(
      findings.some((f) => f.severity === "fail" && f.title.includes("Last ship")),
    ).toBe(true);
  });

  it("emits ok when no issues found", () => {
    globalActiveSlug = "myproj";
    fs.mkdirSync(path.join(TMP_ROOT, "projects", "myproj"), { recursive: true });
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    globalLoopLogs = [
      {
        weekNumber: 1,
        date: recent,
        tasksCompleted: 5,
        tasksTotal: 5,
        shippingScore: 90,
        overridden: false,
      },
    ];
    globalTasksContent = "- [x] [1] Done";
    // Fresh ship
    const today = new Date().toISOString().split("T")[0];
    const shipDir = path.join(TMP_ROOT, "ships");
    fs.mkdirSync(shipDir, { recursive: true });
    fs.writeFileSync(path.join(shipDir, `${today}.md`), "# today");
    const findings = getDoctorFindings();
    // No failures, no warnings expected
    expect(findings.filter((f) => f.severity === "fail").length).toBe(0);
    expect(findings.filter((f) => f.severity === "warn").length).toBe(0);
  });
});
