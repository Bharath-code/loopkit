import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-tasks-parser-"));

import {
  parseTasksFile,
  renderTasksFile,
  nextTaskId,
  nextWeekTaskId,
  type ParsedTask,
} from "../tasks-parser.js";
import {
  toSyncTask,
  pickWinner,
  mergeTasks,
  formatMergeReport,
  type SyncTask,
} from "../conflict.js";

describe("parseTasksFile", () => {
  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  it("returns empty array for empty content", () => {
    expect(parseTasksFile("")).toEqual([]);
  });

  it("parses a single open task", () => {
    const content = `# Test — Tasks

## This Week
- [ ] #1 Ship the auth flow — created:2026-06-01
`;
    const tasks = parseTasksFile(content);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe("open");
    expect(tasks[0].title).toBe("Ship the auth flow");
    expect(tasks[0].id).toBe(1);
    expect(tasks[0].section).toBe("week");
    expect(tasks[0].createdAt).toBe("2026-06-01");
  });

  it("parses done, snoozed, cut statuses", () => {
    const content = `# T
## This Week
- [x] #1 Done task — created:2026-06-01
- [-] #2 Snoozed — snoozed-until:2026-06-15
- [~] #3 Cut — cut:2026-05-10
`;
    const tasks = parseTasksFile(content);
    expect(tasks.map((t) => t.status)).toEqual(["done", "snoozed", "cut"]);
    expect(tasks[1].snoozedUntil).toBe("2026-06-15");
  });

  it("separates week and backlog sections", () => {
    const content = `# T
## This Week
- [ ] #1 Task A

## Backlog
- [ ] #1 Task B
`;
    const tasks = parseTasksFile(content);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].section).toBe("week");
    expect(tasks[1].section).toBe("backlog");
  });

  it("skips malformed lines", () => {
    const content = `# T
## This Week
- [ ] #1 Good
- garbage line
- not a checkbox
- [x] #2 Also good
`;
    const tasks = parseTasksFile(content);
    expect(tasks).toHaveLength(2);
  });
});

describe("renderTasksFile", () => {
  it("round-trips a simple set of tasks", () => {
    const original: ParsedTask[] = [
      { id: 1, title: "Ship A", status: "done", section: "week", createdAt: "2026-06-01", closedAt: "2026-06-05", closedVia: undefined, snoozedUntil: undefined, raw: "" },
      { id: 2, title: "Ship B", status: "open", section: "week", createdAt: "2026-06-01", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "" },
    ];
    const out = renderTasksFile(original, "MyProject");
    expect(out).toContain("# MyProject — Tasks");
    expect(out).toContain("## This Week");
    expect(out).toContain("- [x] #1 Ship A");
    expect(out).toContain("- [ ] #2 Ship B");
  });

  it("renders backlog section", () => {
    const tasks: ParsedTask[] = [
      { id: 1, title: "Backlog A", status: "open", section: "backlog", createdAt: "2026-06-01", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "" },
    ];
    const out = renderTasksFile(tasks, "P");
    expect(out).toContain("## Backlog");
    expect(out).toContain("- [ ] #1 Backlog A");
  });
});

describe("nextTaskId", () => {
  it("returns 1 for empty section", () => {
    expect(nextTaskId([], "week")).toBe(1);
  });

  it("returns max + 1 for the section", () => {
    const tasks: ParsedTask[] = [
      { id: 1, title: "A", status: "open", section: "week", createdAt: "", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "" },
      { id: 3, title: "B", status: "open", section: "week", createdAt: "", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "" },
    ];
    expect(nextTaskId(tasks, "week")).toBe(4);
  });

  it("scopes by section", () => {
    const tasks: ParsedTask[] = [
      { id: 5, title: "Week", status: "open", section: "week", createdAt: "", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "" },
    ];
    expect(nextTaskId(tasks, "backlog")).toBe(1);
  });
});

describe("nextWeekTaskId", () => {
  it("returns W1-1 for empty", () => {
    expect(nextWeekTaskId([], 1)).toBe("W1-1");
  });

  it("increments per week", () => {
    const tasks: ParsedTask[] = [
      { id: 1, title: "T", status: "open", section: "week", createdAt: "", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "- [ ] #W5-1 T" },
      { id: 2, title: "T", status: "open", section: "week", createdAt: "", closedAt: undefined, closedVia: undefined, snoozedUntil: undefined, raw: "- [ ] #W5-2 T" },
    ];
    expect(nextWeekTaskId(tasks, 5)).toBe("W5-3");
  });
});

describe("toSyncTask", () => {
  it("stamps lastModifiedBy and updatedAt", () => {
    const parsed: ParsedTask = {
      id: 1, title: "T", status: "open", section: "week",
      createdAt: "2026-06-01", closedAt: undefined, closedVia: undefined,
      snoozedUntil: undefined, raw: "",
    };
    const sync = toSyncTask(parsed, "cli", "2026-06-15T10:00:00Z");
    expect(sync.id).toBe(1);
    expect(sync.lastModifiedBy).toBe("cli");
    expect(sync.updatedAt).toBe("2026-06-15T10:00:00Z");
  });
});

describe("pickWinner", () => {
  const baseTask: SyncTask = {
    id: 1, title: "T", status: "open", section: "week",
    createdAt: "2026-06-01", closedAt: undefined, closedVia: undefined,
    snoozedUntil: undefined, updatedAt: "2026-06-15T10:00:00Z",
    lastModifiedBy: "cli",
  };

  it("returns null for identical tasks", () => {
    const a = { ...baseTask };
    const b = { ...baseTask };
    expect(pickWinner(a, b)).toBeNull();
  });

  it("picks local when local is newer (LWW)", () => {
    const local = { ...baseTask, updatedAt: "2026-06-15T11:00:00Z" };
    const remote = { ...baseTask, updatedAt: "2026-06-15T10:00:00Z" };
    expect(pickWinner(local, remote)).toBe(local);
  });

  it("picks remote when remote is newer (LWW)", () => {
    const local = { ...baseTask, updatedAt: "2026-06-15T10:00:00Z" };
    const remote = { ...baseTask, updatedAt: "2026-06-15T11:00:00Z" };
    expect(pickWinner(local, remote)).toBe(remote);
  });

  it("CLI wins ties (canonical seed)", () => {
    const local = { ...baseTask, lastModifiedBy: "cli" as const };
    const remote = { ...baseTask, lastModifiedBy: "web" as const };
    expect(pickWinner(local, remote)).toBe(local);
  });

  it("prefer-cli strategy ignores timestamps", () => {
    const local = { ...baseTask, updatedAt: "2026-06-15T10:00:00Z" };
    const remote = { ...baseTask, updatedAt: "2026-06-15T11:00:00Z" };
    expect(pickWinner(local, remote, "prefer-cli")).toBe(local);
  });

  it("prefer-web strategy ignores timestamps", () => {
    const local = { ...baseTask, updatedAt: "2026-06-15T11:00:00Z" };
    const remote = { ...baseTask, updatedAt: "2026-06-15T10:00:00Z" };
    expect(pickWinner(local, remote, "prefer-web")).toBe(remote);
  });
});

describe("mergeTasks", () => {
  const baseTask: SyncTask = {
    id: 1, title: "T", status: "open", section: "week",
    createdAt: "2026-06-01", closedAt: undefined, closedVia: undefined,
    snoozedUntil: undefined, updatedAt: "2026-06-15T10:00:00Z",
    lastModifiedBy: "cli",
  };

  it("adds local-only tasks", () => {
    const local: SyncTask[] = [{ ...baseTask, id: 1, title: "Local-only" }];
    const remote: SyncTask[] = [];
    const result = mergeTasks(local, remote);
    expect(result.stats.added).toBe(1);
    expect(result.resolved).toHaveLength(1);
  });

  it("adds remote-only tasks", () => {
    const local: SyncTask[] = [];
    const remote: SyncTask[] = [{ ...baseTask, id: 2, title: "Remote-only" }];
    const result = mergeTasks(local, remote);
    expect(result.stats.added).toBe(1);
  });

  it("marks identical tasks as unchanged", () => {
    const a = { ...baseTask };
    const b = { ...baseTask };
    const result = mergeTasks([a], [b]);
    expect(result.stats.unchanged).toBe(1);
    expect(result.stats.added).toBe(0);
    expect(result.stats.updated).toBe(0);
  });

  it("counts conflicts in stats when timestamps differ", () => {
    const local = { ...baseTask, updatedAt: "2026-06-15T11:00:00Z", lastModifiedBy: "cli" as const };
    const remote = { ...baseTask, updatedAt: "2026-06-15T12:00:00Z", lastModifiedBy: "web" as const };
    const result = mergeTasks([local], [remote]);
    expect(result.stats.conflicts).toBe(1);
    expect(result.stats.updated).toBe(1);
  });

  it("returns tasks sorted by id", () => {
    const local: SyncTask[] = [
      { ...baseTask, id: 3, title: "C" },
      { ...baseTask, id: 1, title: "A" },
    ];
    const remote: SyncTask[] = [{ ...baseTask, id: 2, title: "B" }];
    const result = mergeTasks(local, remote);
    expect(result.resolved.map((t) => t.id)).toEqual([1, 2, 3]);
  });
});

describe("formatMergeReport", () => {
  it("formats all-zero stats", () => {
    expect(
      formatMergeReport({
        resolved: [],
        removed: [],
        stats: { added: 0, updated: 0, unchanged: 0, conflicts: 0 },
      }),
    ).toBe("no changes");
  });

  it("includes added count", () => {
    expect(
      formatMergeReport({
        resolved: [],
        removed: [],
        stats: { added: 3, updated: 0, unchanged: 0, conflicts: 0 },
      }),
    ).toBe("+3 new");
  });

  it("includes updated and conflict counts", () => {
    expect(
      formatMergeReport({
        resolved: [],
        removed: [],
        stats: { added: 1, updated: 2, unchanged: 0, conflicts: 1 },
      }),
    ).toBe("+1 new, ~2 updated, !1 conflicts resolved");
  });
});
