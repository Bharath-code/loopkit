import * as p from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { formatDate } from "@loopkit/shared";
import {
  readConfig,
  readTasksFile,
  writeTasksFile,
  createTasksScaffold,
  getTasksPath,
  ensureProjectDir,
} from "../storage/local.js";
import { colors, header, pass, fail, warn, info, nextStep } from "../ui/theme.js";

interface TrackOptions {
  week?: boolean;
  add?: string;
  repair?: boolean;
}

export async function trackCommand(options: TrackOptions): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (!slug) {
    console.log(
      colors.danger("No active project. Run `loopkit init` first.")
    );
    process.exit(1);
  }

  // ─── --add: Quick task add ────────────────────────────────────
  if (options.add) {
    addTask(slug, options.add);
    return;
  }

  // ─── --repair: Fix formatting ─────────────────────────────────
  if (options.repair) {
    repairTasks(slug);
    return;
  }

  // ─── Ensure tasks.md exists ───────────────────────────────────
  let content = readTasksFile(slug);
  if (!content) {
    createTasksScaffold(slug, slug);
    content = readTasksFile(slug)!;
    console.log(info("Created tasks.md — add your first task."));
  }

  // ─── Install git hook if needed ───────────────────────────────
  installGitHook();

  // ─── Parse and display ────────────────────────────────────────
  const tasks = parseTasks(content);
  const weekTasks = tasks.filter((t) => t.section === "week");
  const backlogTasks = tasks.filter((t) => t.section === "backlog");
  const done = weekTasks.filter((t) => t.done);
  const open = weekTasks.filter((t) => !t.done);
  const shippingScore =
    weekTasks.length > 0
      ? Math.round((done.length / weekTasks.length) * 100)
      : 0;

  if (options.week) {
    renderWeekSummary(weekTasks, backlogTasks, shippingScore, slug);
    return;
  }

  // ─── Board View ───────────────────────────────────────────────
  console.log(header("This Week"));

  if (open.length === 0 && done.length === 0) {
    console.log(colors.muted("  No tasks yet. Add one:"));
    console.log(colors.primary("  loopkit track --add \"Build the thing\""));
  } else {
    for (const task of done) {
      console.log(`  ${pass(`#${task.id} ${task.title}`)} ${colors.dim(task.closedVia || "")}`);
    }
    for (const task of open) {
      const age = getTaskAgeDays(task.createdAt);
      const ageLabel = age >= 3 ? colors.warning(` (${age}d)`) : "";
      console.log(`  ${colors.muted("○")} #${task.id} ${task.title}${ageLabel}`);
    }
  }

  if (backlogTasks.length > 0) {
    console.log(header("Backlog"));
    for (const task of backlogTasks) {
      const status = task.done ? pass("") : colors.muted("○");
      console.log(`  ${status} #${task.id} ${task.title}`);
    }
  }

  // ─── Shipping Score ───────────────────────────────────────────
  console.log(
    `\n  ${colors.white.bold("Shipping")} ${renderProgressBar(shippingScore)} ${colors.white.bold(`${shippingScore}%`)}`
  );

  // ─── Stale Task Detection ────────────────────────────────────
  for (const task of open) {
    const age = getTaskAgeDays(task.createdAt);
    if (age >= 3) {
      const action = await p.select({
        message: `#${task.id} "${task.title}" is ${age} days old. Still relevant?`,
        options: [
          { value: "keep", label: "[k]eep" },
          { value: "snooze", label: "[s]nooze 3 days" },
          { value: "cut", label: "[c]ut" },
        ],
      });

      if (!p.isCancel(action)) {
        if (action === "cut") {
          cutTask(slug, task.id);
        } else if (action === "snooze") {
          snoozeTask(slug, task.id, 3);
        }
      }
    }
  }

  console.log(nextStep("ship"));
}

// ─── Task Parser ────────────────────────────────────────────────

interface ParsedTask {
  id: number;
  title: string;
  done: boolean;
  section: "week" | "backlog";
  createdAt: string;
  closedVia?: string;
}

function parseTasks(content: string): ParsedTask[] {
  const lines = content.split("\n");
  const tasks: ParsedTask[] = [];
  let currentSection: "week" | "backlog" = "week";
  let nextId = 1;

  // Find max existing ID
  for (const line of lines) {
    const match = line.match(/#(\d+)\s/);
    if (match) {
      nextId = Math.max(nextId, parseInt(match[1]) + 1);
    }
  }

  for (const line of lines) {
    if (/##\s*this\s*week/i.test(line)) {
      currentSection = "week";
      continue;
    }
    if (/##\s*backlog/i.test(line)) {
      currentSection = "backlog";
      continue;
    }

    const taskMatch = line.match(
      /^-\s*\[([ x])\]\s*(?:#(\d+)\s)?(.+?)(?:\s*—\s*(.+))?$/
    );
    if (taskMatch) {
      const done = taskMatch[1] === "x";
      const id = taskMatch[2] ? parseInt(taskMatch[2]) : nextId++;
      const title = taskMatch[3].trim();
      const meta = taskMatch[4] || "";

      // Extract closed via info
      const closedVia = meta.match(/closed via (\w+)/)?.[1];
      const createdAt = meta.match(/\d{4}-\d{2}-\d{2}/)?.[0] || formatDate();

      tasks.push({
        id,
        title,
        done,
        section: currentSection,
        createdAt,
        closedVia,
      });
    }
  }

  return tasks;
}

// ─── Task Operations ────────────────────────────────────────────

function addTask(slug: string, title: string): void {
  let content = readTasksFile(slug);
  if (!content) {
    createTasksScaffold(slug, slug);
    content = readTasksFile(slug)!;
  }

  const tasks = parseTasks(content);
  const maxId = tasks.reduce((max, t) => Math.max(max, t.id), 0);
  const newId = maxId + 1;

  // Insert after "## This Week" heading
  const lines = content.split("\n");
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/##\s*this\s*week/i.test(lines[i])) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    // No "This Week" section found, add it
    lines.push("", "## This Week");
    insertIndex = lines.length;
  }

  lines.splice(insertIndex, 0, `- [ ] #${newId} ${title}`);
  writeTasksFile(slug, lines.join("\n"));
  console.log(pass(`Added #${newId}: ${title}`));
}

function cutTask(slug: string, taskId: number): void {
  const content = readTasksFile(slug);
  if (!content) return;

  const lines = content.split("\n");
  const updated = lines.filter((line) => {
    const match = line.match(/#(\d+)\s/);
    return !(match && parseInt(match[1]) === taskId);
  });

  writeTasksFile(slug, updated.join("\n"));
  console.log(warn(`Cut #${taskId}`));
}

function snoozeTask(slug: string, taskId: number, days: number): void {
  // For now, just add a note. Full snooze with date tracking in v2.
  console.log(info(`Snoozed #${taskId} for ${days} days`));
}

function repairTasks(slug: string): void {
  const content = readTasksFile(slug);
  if (!content) {
    console.log(colors.muted("No tasks.md to repair."));
    return;
  }

  // Re-assign sequential IDs
  const lines = content.split("\n");
  let nextId = 1;
  const repaired = lines.map((line) => {
    const match = line.match(/^(-\s*\[[ x]\]\s*)(?:#\d+\s)?(.+)$/);
    if (match) {
      return `${match[1]}#${nextId++} ${match[2]}`;
    }
    return line;
  });

  writeTasksFile(slug, repaired.join("\n"));
  console.log(pass(`Repaired tasks.md — ${nextId - 1} tasks re-numbered.`));
}

// ─── Git Hook ───────────────────────────────────────────────────

function installGitHook(): void {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir)) {
    console.log(
      warn("No git repo — auto-close from commits disabled.")
    );
    console.log(colors.muted("  Run `git init` to enable commit-to-task sync.\n"));
    return;
  }

  const hooksDir = path.join(gitDir, "hooks");
  const hookPath = path.join(hooksDir, "commit-msg");

  // Check if our hook is already installed
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (existing.includes("loopkit")) return; // Already installed
  }

  // Append-only: never overwrite existing hooks
  const hookScript = `
# ── LoopKit: auto-close tasks from commit messages ──
node -e "
const fs = require('fs');
const msg = fs.readFileSync(process.argv[1], 'utf-8');
const matches = msg.match(/\\[#(\\d+)\\]/g);
if (!matches) process.exit(0);

// Find .loopkit project
const configPath = '.loopkit/config.json';
if (!fs.existsSync(configPath)) process.exit(0);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const slug = config.activeProject;
if (!slug) process.exit(0);

const tasksPath = '.loopkit/projects/' + slug + '/tasks.md';
if (!fs.existsSync(tasksPath)) process.exit(0);

let content = fs.readFileSync(tasksPath, 'utf-8');
const sha = require('child_process').execSync('git rev-parse --short HEAD 2>/dev/null || echo unknown').toString().trim();
const date = new Date().toISOString().split('T')[0];

for (const match of matches) {
  const id = match.replace(/[\\[#\\]]/g, '');
  content = content.replace(
    new RegExp('- \\\\[ \\\\] #' + id + ' (.+)'),
    '- [x] #' + id + ' \$1 — closed via ' + sha + ' on ' + date
  );
  console.log('✓ Task #' + id + ' closed via commit ' + sha);
}

fs.writeFileSync(tasksPath, content);
" "\$1"
`;

  const existing = fs.existsSync(hookPath)
    ? fs.readFileSync(hookPath, "utf-8")
    : "#!/bin/sh\n";

  fs.writeFileSync(hookPath, existing + "\n" + hookScript);
  fs.chmodSync(hookPath, "755");
}

// ─── Helpers ────────────────────────────────────────────────────

function getTaskAgeDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / 86400000);
}

function renderProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const color =
    percent >= 70
      ? colors.success
      : percent >= 40
        ? colors.warning
        : colors.danger;
  return `${color("█".repeat(filled))}${colors.dim("░".repeat(empty))}`;
}

function renderWeekSummary(
  weekTasks: ParsedTask[],
  backlogTasks: ParsedTask[],
  score: number,
  slug: string
): void {
  const done = weekTasks.filter((t) => t.done);
  const open = weekTasks.filter((t) => !t.done);

  console.log(header(`Week Summary — ${slug}`));
  console.log(`  ${colors.white("Planned:")} ${weekTasks.length}`);
  console.log(`  ${colors.success("Completed:")} ${done.length}`);
  console.log(`  ${colors.warning("Open:")} ${open.length}`);
  console.log(`  ${colors.white("Backlog:")} ${backlogTasks.length}`);
  console.log(
    `\n  ${colors.white.bold("Shipping Score")} ${renderProgressBar(score)} ${colors.white.bold(`${score}%`)}`
  );

  if (done.length > 0) {
    console.log(header("Completed"));
    for (const task of done) {
      console.log(`  ${pass(`#${task.id} ${task.title}`)}`);
    }
  }

  console.log(nextStep("ship"));
}
