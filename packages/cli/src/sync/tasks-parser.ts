/**
 * Task parser & serializer for `tasks.md`.
 *
 * Format produced by `loopkit track --add` and other commands:
 *   # <project> — Tasks
 *
 *   ## This Week
 *   - [ ] #W23-1 Ship the auth flow — created:2026-06-01
 *   - [x] #W22-3 Fix the parser bug — closed:2026-05-30
 *   - [~] #W20-2 Old idea — cut:2026-05-10
 *   - [-] #W21-1 Postponed thing — snoozed-until:2026-06-15
 *
 *   ## Backlog
 *   - [ ] #B-1 Build the dashboard
 *   - [ ] #B-2 Write the launch post
 *
 * This module is pure: parse() returns structured tasks; render() turns
 * them back into the same markdown. Conflict resolution lives in
 * conflict.ts; this file is just I/O shape.
 */

import { formatDate } from "@loopkit/shared";

export type TaskStatus = "open" | "done" | "snoozed" | "cut";
export type TaskSection = "week" | "backlog";

export interface ParsedTask {
  id: number;
  title: string;
  status: TaskStatus;
  section: TaskSection;
  createdAt: string;
  closedAt: string | undefined;
  closedVia: string | undefined;
  snoozedUntil: string | undefined;
  /** Raw markdown line, used for round-trip preservation */
  raw: string;
}

const STATUS_MAP: Record<string, TaskStatus> = {
  " ": "open",
  x: "done",
  X: "done",
  "~": "cut",
  "-": "snoozed",
};

const REVERSE_STATUS_MAP: Record<TaskStatus, string> = {
  open: " ",
  done: "x",
  snoozed: "-",
  cut: "~",
};

/**
 * Parse tasks.md content into structured tasks.
 * Tolerant of malformed lines (returns only well-formed tasks).
 */
export function parseTasksFile(content: string): ParsedTask[] {
  const lines = content.split("\n");
  const tasks: ParsedTask[] = [];
  let currentSection: TaskSection = "week";
  let nextBacklogId = 1;

  for (const line of lines) {
    if (/^##\s+This Week/i.test(line)) {
      currentSection = "week";
      continue;
    }
    if (/^##\s+Backlog/i.test(line)) {
      currentSection = "backlog";
      continue;
    }

    // Match: - [x] #ID text — meta
    const m = line.match(/^\s*-\s*\[(.)\]\s+(.+?)\s*$/);
    if (!m) continue;

    const [, box, rest] = m;
    const status = STATUS_MAP[box];
    if (!status) continue;

    // Extract id and title
    const idMatch = rest.match(/^#(\S+)\s+(.+?)(?:\s+—\s+(.+))?$/);
    if (!idMatch) continue;
    const [, idStr, title, meta] = idMatch;
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) continue;

    const task: ParsedTask = {
      id,
      title: title.trim(),
      status,
      section: currentSection,
      createdAt: "",
      closedAt: undefined,
      closedVia: undefined,
      snoozedUntil: undefined,
      raw: line,
    };

    if (meta) {
      const metaParts = meta.split(/\s+—\s+/);
      for (const part of metaParts) {
        const kv = part.match(/^([\w-]+):\s*(.+)$/);
        if (!kv) continue;
        const [, key, value] = kv;
        if (key === "created") task.createdAt = value.trim();
        else if (key === "closed") task.closedAt = value.trim();
        else if (key === "closed-via") task.closedVia = value.trim();
        else if (key === "snoozed-until") task.snoozedUntil = value.trim();
        else if (key === "cut") task.closedAt = value.trim();
      }
    }

    tasks.push(task);
  }

  return tasks;
}

/**
 * Render tasks back to markdown. Preserves the original format.
 */
export function renderTasksFile(
  tasks: ParsedTask[],
  projectName: string,
): string {
  const weekTasks = tasks.filter((t) => t.section === "week");
  const backlogTasks = tasks.filter((t) => t.section === "backlog");

  const lines: string[] = [];
  lines.push(`# ${projectName} — Tasks`, "");
  lines.push("## This Week");
  for (const t of weekTasks) {
    lines.push(renderTaskLine(t));
  }
  lines.push("");
  lines.push("## Backlog");
  for (const t of backlogTasks) {
    lines.push(renderTaskLine(t));
  }
  lines.push("");

  return lines.join("\n");
}

function renderTaskLine(t: ParsedTask): string {
  const box = REVERSE_STATUS_MAP[t.status];
  const meta: string[] = [];
  if (t.createdAt) meta.push(`created:${t.createdAt}`);
  if (t.closedAt) {
    meta.push(t.status === "cut" ? `cut:${t.closedAt}` : `closed:${t.closedAt}`);
  }
  if (t.snoozedUntil) meta.push(`snoozed-until:${t.snoozedUntil}`);
  if (t.closedVia) meta.push(`closed-via:${t.closedVia}`);

  const metaStr = meta.length > 0 ? ` — ${meta.join(" — ")}` : "";
  return `- [${box}] #${t.id} ${t.title}${metaStr}`;
}

/**
 * Renumber tasks to be sequential within each section.
 * Used after merge operations that may have created gaps.
 */
export function renumberTasks(tasks: ParsedTask[]): ParsedTask[] {
  const weekTasks: ParsedTask[] = [];
  const backlogTasks: ParsedTask[] = [];
  for (const t of tasks) {
    if (t.section === "week") weekTasks.push(t);
    else backlogTasks.push(t);
  }
  // Sort by current id, then re-assign sequential ids
  weekTasks.sort((a, b) => a.id - b.id);
  backlogTasks.sort((a, b) => a.id - b.id);

  return [
    ...weekTasks.map((t, i) => ({ ...t, id: i + 1 })),
    ...backlogTasks.map((t, i) => ({ ...t, id: i + 1 })),
  ];
}

/**
 * Build a new ParsedTask with the next available ID in its section.
 */
export function nextTaskId(tasks: ParsedTask[], section: TaskSection): number {
  const max = tasks
    .filter((t) => t.section === section)
    .reduce((m, t) => Math.max(m, t.id), 0);
  return max + 1;
}

/**
 * Get the "next week" id prefix used by `--add` and friends.
 * Format: `W{weekNum}-{i}`
 */
export function nextWeekTaskId(
  tasks: ParsedTask[],
  weekNum: number,
): string {
  const prefix = `W${weekNum}-`;
  const max = tasks
    .filter((t) => t.section === "week" && t.raw.includes(`#${prefix}`))
    .reduce((m, t) => {
      const n = parseInt(t.raw.split(`#${prefix}`)[1]?.split(/\s/)[0] ?? "0", 10);
      return Math.max(m, Number.isNaN(n) ? 0 : n);
    }, 0);
  return `${prefix}${max + 1}`;
}

export { formatDate };
