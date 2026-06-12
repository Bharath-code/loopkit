import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { formatDate, slugify, getWeekNumber } from "@loopkit/shared";
import {
  readConfig,
  readTasksFile,
  writeTasksFile,
  createTasksScaffold,
  getTasksPath,
  ensureProjectDir,
  appendToCut,
  projectExists,
  readLastNLoopLogs,
  readLoopLog,
  saveStandup,
  readStandup,
  getStandupStreak,
  getLastShipDate,
  getProjectCreationDate,
} from "../storage/local.js";
import { computeBenchmarks, renderBenchmarks } from "../analytics/benchmarks.js";
import { getSnoozeWarning } from "../analytics/oracle.js";
import { getPriorityMoment, recordMomentShown } from "../analytics/coach.js";
import { computeLoopKitScore } from "../analytics/score.js";
import { shouldShowSyncBanner } from "./sync.js";
import { colors, header, pass, warn, info, clog, nextStep, shortcutsHint, emptyState, coachingCard, standupCard, ceremonyIntro, ceremonyOutro, select, isCancel, text, confirm } from "../ui/theme.js";

export async function trackCommand(
  id?: string,
  options?: {
    add?: string;
    week?: boolean;
    repair?: boolean;
    project?: string;
    stand?: boolean;
    interactive?: boolean;
    done?: boolean;
    snooze?: string | boolean;
    cut?: boolean;
  }
): Promise<void> {
  const config = readConfig();

  // Handle project switcher
  if (options?.project) {
    const newProject = slugify(options.project);
    if (!projectExists(newProject)) {
      clog.error(`Project "${options.project}" does not exist.`);
      process.exit(1);
    }
    
    config.activeProject = newProject;
    const { writeConfig } = await import("../storage/local.js");
    writeConfig(config);
    clog.success(`Switched active project to: ${colors.primary(options.project)}`);
    // Continue running track for the new project
  }

  const slug = config.activeProject;

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    process.exit(1);
  }

  const today = formatDate();

  // ─── Sync banner (if dashboard isn't getting data) ──────────────────────
  if (shouldShowSyncBanner()) {
    clog.warn("Your dashboard isn't syncing. Run `loopkit sync status`.");
  }

  // ─── If ID is specified, run inline action or single-task interactive prompt ─────────────────────────
  if (id) {
    const taskId = parseInt(id.replace(/^#/, ""), 10);
    if (isNaN(taskId)) {
      clog.error(`Invalid task ID: "${id}". ID must be a number.`);
      process.exit(1);
    }

    if (options?.done) {
      completeTask(slug, taskId, today);
      return;
    }

    if (options?.snooze) {
      let days = 3;
      if (typeof options.snooze === "string") {
        const parsedDays = parseInt(options.snooze, 10);
        if (!isNaN(parsedDays)) {
          days = parsedDays;
        }
      }
      snoozeTask(slug, taskId, days, today);
      const oracleWarning = getSnoozeWarning();
      if (oracleWarning) {
        clog.message(`🔮 Snooze Oracle: ${oracleWarning}`);
      }
      return;
    }

    if (options?.cut) {
      cutTask(slug, taskId, undefined, today);
      return;
    }

    // Single-task interactive prompt if no action flag is passed but ID is present
    await runSingleTaskMenu(slug, taskId, today);
    return;
  }

  // ─── --add: Quick task add ────────────────────────────────────
  if (options?.add) {
    if (typeof options.add === "string") {
      await addTask(slug, options.add);
    } else {
      await addTasksViaEditor(slug);
    }
    return;
  }

  // ─── --repair: Fix formatting ─────────────────────────────────
  if (options?.repair) {
    repairTasks(slug);
    return;
  }

  // ─── --stand: Daily Standup (GF-3) ───────────────────────────
  if (options?.stand) {
    await runStandupFlow(slug);
    return;
  }

  // ─── --interactive: Interactive task manager ─────────────────
  if (options?.interactive) {
    await runInteractiveTasks(slug);
    return;
  }

  // ─── Ensure tasks.md exists ───────────────────────────────────
  let content = readTasksFile(slug);
  if (!content) {
    createTasksScaffold(slug, slug);
    content = readTasksFile(slug)!;
    clog.info("Created tasks.md — add your first task.");
  }

  // ─── Install git hook if needed ───────────────────────────────
  installGitHook();

  // ─── Parse and display ────────────────────────────────────────
  const tasks = parseTasks(content);
  const weekTasks = tasks.filter((t) => t.section === "week");
  const backlogTasks = tasks.filter((t) => t.section === "backlog");

  // Separate active vs snoozed-and-still-sleeping
  const visibleOpen = weekTasks.filter(
    (t) => !t.done && (!t.snoozedUntil || t.snoozedUntil <= today)
  );
  const snoozedActive = weekTasks.filter(
    (t) => !t.done && t.snoozedUntil && t.snoozedUntil > today
  );
  const resurfaced = weekTasks.filter(
    (t) => !t.done && t.snoozedUntil && t.snoozedUntil <= today
  );
  const done = weekTasks.filter((t) => t.done);

  // Shipping score counts all week tasks (snoozed included)
  const shippingScore =
    weekTasks.length > 0 ? Math.round((done.length / weekTasks.length) * 100) : 0;

  if (options?.week) {
    renderWeekSummary(weekTasks, backlogTasks, shippingScore, slug);
    return;
  }

  // ─── Board View ───────────────────────────────────────────────
  console.log(shortcutsHint());

  const lastShip = getLastShipDate(slug);
  const refDate = lastShip || getProjectCreationDate(slug);
  const now = new Date();
  const diffTime = now.getTime() - refDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 14) {
    clog.error(`  ⚠️  SHIPPING BLOCK ACTIVE: You haven't shipped in ${diffDays} days! Task addition is locked unless overridden.`);
  }

  clog.step("This Week");

  if (visibleOpen.length === 0 && done.length === 0 && snoozedActive.length === 0) {
    console.log(
      emptyState(
        "No tasks yet — every journey starts with a single step.",
        "Add your first task",
        'loopkit track --add "Build the landing page"'
      )
    );
  } else {
    for (const task of done) {
      console.log(`  ${pass(`#${task.id} ${task.title}`)} ${colors.dim(task.closedVia || "")}`);
    }
    for (const task of visibleOpen) {
      const age = getTaskAgeDays(task.createdAt);
      const ageLabel = age >= 3 ? colors.warning(` (${age}d)`) : "";
      console.log(`  ${colors.muted("○")} #${task.id} ${task.title}${ageLabel}`);
    }
    if (snoozedActive.length > 0) {
      console.log(colors.dim(`  ··· ${snoozedActive.length} snoozed (resurface: ${snoozedActive[0].snoozedUntil})`));
    }
  }

  // ─── Resurfaced tasks (snooze expired) ───────────────────────
  if (resurfaced.length > 0) {
    clog.warn(`↑ ${resurfaced.length} snoozed task(s) resurfaced today:`);
    for (const task of resurfaced) {
      console.log(`    ${colors.warning("○")} #${task.id} ${task.title}`);
    }
  }

  if (backlogTasks.length > 0) {
    clog.step("Backlog");
    for (const task of backlogTasks) {
      const status = task.done ? pass("") : colors.muted("○");
      console.log(`  ${status} #${task.id} ${task.title}`);
    }
  }

  // ─── Shipping Score ───────────────────────────────────────────
  const weekNum = getWeekNumber();
  const prevLogs = readLastNLoopLogs(2, slug);
  const prevLog = prevLogs.find((l) => l.weekNumber !== weekNum);
  let prevScore: number | null = null;
  if (prevLog) {
    const logContent = readLoopLog(prevLog.weekNumber);
    if (logContent) {
      const m = logContent.match(/[Ss]hipping score:\s*(\d+)%/);
      if (m) prevScore = parseInt(m[1], 10);
    }
  }
  const deltaStr =
    prevScore !== null
      ? shippingScore > prevScore
        ? colors.success(` ↑+${shippingScore - prevScore}%`)
        : shippingScore < prevScore
          ? colors.danger(` ↓${shippingScore - prevScore}%`)
          : colors.dim(" ↔ same as last week")
      : "";
  console.log(
    `\n  ${colors.white.bold("Shipping")} ${renderProgressBar(shippingScore)} ${colors.white.bold(`${shippingScore}%`)}${deltaStr}`
  );

  // ─── "Almost There" Nudge ─────────────────────────────────────
  if (shippingScore >= 50 && shippingScore <= 70 && visibleOpen.length === 2) {
    const tasksLeft = visibleOpen.length;
    const potentialScore = Math.round(((done.length + tasksLeft) / weekTasks.length) * 100);
    clog.warn(`Almost there — ${tasksLeft} tasks left to hit ${potentialScore}%.`);
    clog.message(`  → loopkit track #${visibleOpen[0].id} --done  (if you finished it)`);
    clog.message(`  → loopkit track #${visibleOpen[0].id} --snooze tomorrow`);
  }

  // ─── LoopKit Score™ (GF-1) ─────────────────────────────────
  const scoreBreakdown = computeLoopKitScore();
  if (scoreBreakdown) {
    const { renderLoopKitScore, readLoopKitScoreFromLog } = await import("../analytics/score.js");
    const prevWeekScore = prevLog ? readLoopKitScoreFromLog(prevLog.weekNumber) : null;
    console.log(renderLoopKitScore(scoreBreakdown, prevWeekScore));
  }

  // ─── AI Coach v1 (IE-10) — stuck state ────────────────────────
  if (config.coaching?.enabled !== false && done.length === 0 && visibleOpen.length === 0) {
    const coachMoment = getPriorityMoment(slug);
    if (coachMoment) {
      console.log(coachingCard(coachMoment));
      recordMomentShown(coachMoment.id);
    }
  }

  // ─── Smart Benchmarks ──────────────────────────────────────────
  const benchmarks = computeBenchmarks();
  if (benchmarks && benchmarks.metrics.totalWeeks >= 4) {
    clog.step("Benchmarks");
    console.log(renderBenchmarks(benchmarks));
  }

  // ─── Stale Task Detection (Non-blocking warning) ───────────────
  const staleTasks = visibleOpen.filter((t) => getTaskAgeDays(t.createdAt) >= 3);
  if (staleTasks.length > 0) {
    clog.warn(`${staleTasks.length} stale task(s) detected (3+ days old):`);
    for (const task of staleTasks) {
      const age = getTaskAgeDays(task.createdAt);
      clog.message(`  → #${task.id} "${task.title}" is ${age} days old. Run: loopkit track ${task.id} --snooze/--done/--cut`);
    }
  }

  console.log(nextStep("ship"));
}

// ─── GF-3: Daily Standup Flow ────────────────────────────────────────

async function runStandupFlow(slug: string): Promise<void> {
  ceremonyIntro("Daily Standup");

  const today = formatDate();

  // ── Guard: already checked in today ────────────────────────────
  const existing = readStandup(today);
  if (existing) {
    clog.success(`Already checked in today (${today}).`);
    clog.message(`Today's #1: "${existing.taskToday}"`);
    ceremonyOutro("Come back tomorrow. You're building a habit.");
    return;
  }

  // ── Parse open tasks ──────────────────────────────────────
  const content = readTasksFile(slug);
  const openTasks: string[] = [];

  if (content) {
    const lines = content.split("\n");
    let inWeek = false;
    for (const line of lines) {
      if (/##\s*this\s*week/i.test(line)) { inWeek = true; continue; }
      if (/##\s*backlog/i.test(line)) { inWeek = false; continue; }
      if (inWeek && /^-\s*\[ \]/.test(line)) {
        const title = line.replace(/^-\s*\[ \]\s*(?:#\d+\s)?/, "").replace(/\s*—.*$/, "").trim();
        if (title) openTasks.push(title);
      }
    }
  }

  // ── Show context ────────────────────────────────────────
  if (openTasks.length > 0) {
    clog.message(`${openTasks.length} open task${openTasks.length !== 1 ? "s" : ""} this week:`);
    openTasks.slice(0, 5).forEach((t) => clog.message(`    ${colors.muted("○")} ${t}`));
    if (openTasks.length > 5) {
      clog.message(`  … and ${openTasks.length - 5} more`);
    }
    clog.message("");
  } else {
    clog.info("No open tasks yet. Add some with `loopkit track --add “task”`");
  }

  // ── The one question that matters ────────────────────────────
  const taskToday = await text({
    message: "What’s your #1 task today?",
    placeholder: openTasks[0] ?? "The single most important thing to do today",
    validate: (val) => {
      if (!val.trim()) return "Please enter something — even a rough plan counts.";
    },
  });

  if (isCancel(taskToday)) {
    ceremonyOutro("Standup cancelled. Come back when ready.");
    return;
  }

  // ── Compute streak & score ─────────────────────────────────
  const standupStreak = getStandupStreak() + 1; // +1 for today's
  const scoreBreakdown = computeLoopKitScore();

  // ── Save ──────────────────────────────────────────────────
  saveStandup({
    date: today,
    taskToday: taskToday as string,
    openTasks,
    loopkitScore: scoreBreakdown?.score ?? undefined,
    standupStreak,
  });

  // ── Show the standup card ─────────────────────────────────
  console.log(standupCard({
    taskToday: taskToday as string,
    openTasks,
    standupStreak,
    loopkitScore: scoreBreakdown?.score ?? null,
  }));

  ceremonyOutro("Standup locked in. Go build. 🚀");
}

// ─── Task Parser ─────────────────────────────────────────────────

interface ParsedTask {
  id: number;
  title: string;
  done: boolean;
  section: "week" | "backlog";
  createdAt: string;
  closedVia?: string;
  snoozedUntil?: string;
}

function parseTasks(content: string): ParsedTask[] {
  const lines = content.split("\n");
  const tasks: ParsedTask[] = [];
  let currentSection: "week" | "backlog" = "week";

  // Collect all explicit IDs to avoid collisions
  const takenIds = new Set<number>();
  for (const line of lines) {
    const match = line.match(/^-\s*\[[ x]\]\s*#(\d+)\s/);
    if (match) takenIds.add(parseInt(match[1]));
  }

  let nextId = 1;
  function nextFreeId(): number {
    while (takenIds.has(nextId)) nextId++;
    takenIds.add(nextId);
    return nextId++;
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

    // Pattern: - [x] #N title — meta=key:value key:value
    const taskMatch = line.match(/^-\s*\[([ x])\]\s*(?:#(\d+)\s)?(.+?)(?:\s*—\s*(.+))?$/);
    if (taskMatch) {
      const done = taskMatch[1] === "x";
      const id = taskMatch[2] ? parseInt(taskMatch[2]) : nextFreeId();
      const title = taskMatch[3].trim();
      const meta = taskMatch[4] || "";

      const closedVia = meta.match(/closed via (\w+)/)?.[1];
      const snoozedUntil = meta.match(/snoozed:(\d{4}-\d{2}-\d{2})/)?.[1];
      const createdAt = meta.match(/created:(\d{4}-\d{2}-\d{2})/)?.[0]?.replace("created:", "")
        || meta.match(/\d{4}-\d{2}-\d{2}/)?.[0]
        || formatDate();

      tasks.push({ id, title, done, section: currentSection, createdAt, closedVia, snoozedUntil });
    }
  }

  return tasks;
}

async function handleShippingBlock(slug: string): Promise<boolean> {
  const lastShip = getLastShipDate(slug);
  const refDate = lastShip || getProjectCreationDate(slug);
  const now = new Date();
  
  const diffTime = now.getTime() - refDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 14) {
    clog.error(`⚠️  SHIPPING BLOCK: You haven't shipped in ${diffDays} days!`);
    clog.message("To maintain momentum, you should ship at least once every 14 days.");
    
    const override = await confirm({
      message: "Do you want to override this block and add the task anyway?",
      active: "Yes, override",
      inactive: "No, cancel",
    });
    
    if (isCancel(override) || !override) {
      clog.warn("Task addition canceled. Run `loopkit ship` first.");
      return false;
    }
    
    const reason = await text({
      message: "Please enter a reason for overriding this shipping block:",
      placeholder: "e.g., waiting on third-party API approval",
      validate: (value) => (value.trim().length < 5 ? "Reason must be at least 5 characters." : undefined),
    });
    
    if (isCancel(reason) || !reason) {
      clog.warn("Task addition canceled. Reason required.");
      return false;
    }
    
    clog.success(`Override registered. Reason: "${reason}"`);
  }
  return true;
}

// ─── Task Operations ─────────────────────────────────────────────

async function addTask(slug: string, title: string, skipBlockCheck = false): Promise<void> {
  if (!skipBlockCheck) {
    const allowed = await handleShippingBlock(slug);
    if (!allowed) return;
  }

  let content = readTasksFile(slug);
  if (!content) {
    createTasksScaffold(slug, slug);
    content = readTasksFile(slug)!;
  }

  const tasks = parseTasks(content);
  const maxId = tasks.reduce((max, t) => Math.max(max, t.id), 0);
  const newId = maxId + 1;
  const today = formatDate();

  const lines = content.split("\n");
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/##\s*this\s*week/i.test(lines[i])) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    lines.push("", "## This Week");
    insertIndex = lines.length;
  }

  // Store createdAt in metadata so age tracking works across runs
  lines.splice(insertIndex, 0, `- [ ] #${newId} ${title} — created:${today}`);
  writeTasksFile(slug, lines.join("\n"));
  clog.success(`Added #${newId}: ${title}`);
}

async function addTasksViaEditor(slug: string): Promise<void> {
  const allowed = await handleShippingBlock(slug);
  if (!allowed) return;

  const editor =
    process.env.EDITOR ||
    process.env.VISUAL ||
    (process.platform === "win32" ? "notepad" : "nano");

  const template = [
    "# Enter task titles, one per line. Save and close to add them all.",
    "# Lines starting with # are ignored. Blank lines are skipped.",
    "",
  ].join("\n");

  const tmpFile = path.join(os.tmpdir(), `loopkit-tasks-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, template, "utf-8");

  const result = spawnSync(editor, [tmpFile], { stdio: "inherit" });

  if (result.error) {
    clog.error(`Could not open ${editor}: ${result.error.message}`);
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    return;
  }

  const content = fs.readFileSync(tmpFile, "utf-8");
  try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }

  const lines = content.split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    clog.message("No tasks entered.");
    return;
  }

  for (const title of lines) {
    await addTask(slug, title, true);
  }
}

/**
 * Completes the specified task by marking it as checked and adding completion metadata.
 */
function completeTask(slug: string, taskId: number, today: string): void {
  const content = readTasksFile(slug);
  if (!content) {
    clog.error("Could not read tasks file.");
    process.exit(1);
  }

  const tasks = parseTasks(content);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    clog.error(`Task #${taskId} not found.`);
    process.exit(1);
  }

  if (task.done) {
    clog.warn(`Task #${taskId} is already completed.`);
    return;
  }

  const lines = content.split("\n");
  const updatedLines = lines.map((line) => {
    const match = line.match(/^(-\s*\[\s*\]\s*)#(\d+)\s/);
    if (match && parseInt(match[2]) === taskId) {
      const rest = line.substring(match[1].length);
      let cleanLine = rest.replace(/\s*snoozed:\d{4}-\d{2}-\d{2}/, "").trim();
      if (cleanLine.endsWith(" —")) {
        cleanLine = cleanLine.substring(0, cleanLine.length - 2).trim();
      } else if (cleanLine.endsWith("—")) {
        cleanLine = cleanLine.substring(0, cleanLine.length - 1).trim();
      }
      const metadata = `closed via cli on ${today}`;
      if (cleanLine.includes(" — ")) {
        return `- [x] ${cleanLine} ${metadata}`;
      }
      return `- [x] ${cleanLine} — ${metadata}`;
    }
    return line;
  });

  writeTasksFile(slug, updatedLines.join("\n"));
  clog.success(`Completed #${taskId}: "${task.title}"`);
}

/**
 * Archives the task line to cut.md then removes it from tasks.md.
 * Never silently deletes — data goes to cut.md for recovery.
 */
function cutTask(slug: string, taskId: number, taskTitle?: string, today?: string): void {
  const content = readTasksFile(slug);
  if (!content) {
    clog.error("Could not read tasks file.");
    process.exit(1);
  }

  const tasks = parseTasks(content);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    clog.error(`Task #${taskId} not found.`);
    process.exit(1);
  }

  const title = taskTitle || task.title;
  const actualToday = today || formatDate();

  const lines = content.split("\n");
  let archivedLine = "";

  const updated = lines.filter((line) => {
    const match = line.match(/#(\d+)\s/);
    if (match && parseInt(match[1]) === taskId) {
      archivedLine = line.trim();
      return false; // remove from tasks.md
    }
    return true;
  });

  // Write to cut.md archive first (data safety before deletion)
  appendToCut(slug, archivedLine || `#${taskId} ${title}`, actualToday);
  writeTasksFile(slug, updated.join("\n"));
  clog.warn(`#${taskId} cut → archived to .loopkit/projects/${slug}/cut.md`);
}

/**
 * Adds `snoozedUntil` metadata to the task line in tasks.md.
 * The board view will hide it until the date passes.
 */
function snoozeTask(slug: string, taskId: number, days: number, today: string): void {
  const content = readTasksFile(slug);
  if (!content) {
    clog.error("Could not read tasks file.");
    process.exit(1);
  }

  const tasks = parseTasks(content);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    clog.error(`Task #${taskId} not found.`);
    process.exit(1);
  }

  if (task.done) {
    clog.warn(`Task #${taskId} is already completed. Cannot snooze.`);
    return;
  }

  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + days);
  const snoozedUntil = formatDate(snoozeDate);

  const lines = content.split("\n").map((line) => {
    const match = line.match(/#(\d+)\s/);
    if (match && parseInt(match[1]) === taskId) {
      // Remove any existing snooze tag then add new one
      let withoutSnooze = line.replace(/\s*snoozed:\d{4}-\d{2}-\d{2}/, "").trim();
      if (withoutSnooze.endsWith(" —")) {
        withoutSnooze = withoutSnooze.substring(0, withoutSnooze.length - 2).trim();
      } else if (withoutSnooze.endsWith("—")) {
        withoutSnooze = withoutSnooze.substring(0, withoutSnooze.length - 1).trim();
      }
      // Append snooze metadata to the meta section
      if (withoutSnooze.includes(" — ")) {
        return `${withoutSnooze} snoozed:${snoozedUntil}`;
      }
      return `${withoutSnooze} — snoozed:${snoozedUntil}`;
    }
    return line;
  });

  writeTasksFile(slug, lines.join("\n"));
  clog.info(`#${taskId} snoozed until ${snoozedUntil}`);
}

/**
 * Interactive menu to perform actions on a single task.
 */
async function runSingleTaskMenu(slug: string, taskId: number, today: string): Promise<void> {
  const content = readTasksFile(slug);
  if (!content) {
    clog.error("Could not read tasks file.");
    process.exit(1);
  }

  const tasks = parseTasks(content);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    clog.error(`Task #${taskId} not found.`);
    process.exit(1);
  }

  ceremonyIntro(`Task #${taskId}`);
  clog.message(`Task: "${task.title}"`);
  clog.message(`Status: ${task.done ? "Done" : "Open"}`);
  clog.message(`Created: ${task.createdAt}`);
  if (task.snoozedUntil) {
    clog.message(`Snoozed until: ${task.snoozedUntil}`);
  }

  const action = await select({
    message: "Choose action:",
    options: [
      { value: "done", label: "Complete task" },
      { value: "snooze", label: "Snooze task" },
      { value: "cut", label: "Cut (archive) task" },
      { value: "cancel", label: "Cancel" },
    ],
  });

  if (isCancel(action) || action === "cancel") {
    ceremonyOutro("Cancelled.");
    return;
  }

  if (action === "done") {
    completeTask(slug, taskId, today);
  } else if (action === "snooze") {
    const daysStr = await text({
      message: "Snooze for how many days?",
      placeholder: "3",
      validate: (val) => {
        if (val && isNaN(parseInt(val, 10))) return "Please enter a valid number of days.";
      },
    });
    if (isCancel(daysStr)) {
      ceremonyOutro("Cancelled.");
      return;
    }
    const days = daysStr ? parseInt(daysStr, 10) : 3;
    snoozeTask(slug, taskId, days, today);
    const oracleWarning = getSnoozeWarning();
    if (oracleWarning) {
      clog.message(`🔮 Snooze Oracle: ${oracleWarning}`);
    }
  } else if (action === "cut") {
    cutTask(slug, taskId, task.title, today);
  }

  ceremonyOutro("Done.");
}

/**
 * Interactive task manager allowing user to recursively choose, update and exit.
 */
async function runInteractiveTasks(slug: string): Promise<void> {
  const today = formatDate();

  while (true) {
    const content = readTasksFile(slug);
    if (!content) {
      clog.error("Could not read tasks file.");
      process.exit(1);
    }

    const tasks = parseTasks(content);
    const openTasks = tasks.filter(
      (t) => !t.done && (!t.snoozedUntil || t.snoozedUntil <= today)
    );

    if (openTasks.length === 0) {
      ceremonyIntro("Interactive Task Manager");
      clog.info("No open tasks! You're completely caught up. 🎉");
      ceremonyOutro("Keep shipping!");
      return;
    }

    ceremonyIntro("Interactive Task Manager");
    
    const taskOptions = openTasks.map((t) => {
      const sectionLabel = t.section === "backlog" ? " [Backlog]" : "";
      return {
        value: t.id.toString(),
        label: `#${t.id} ${t.title}${sectionLabel}`,
      };
    });

    taskOptions.push({ value: "exit", label: "Exit Interactive Manager" });

    const selectedTaskIdStr = await select({
      message: "Select a task to update:",
      options: taskOptions,
    });

    if (isCancel(selectedTaskIdStr) || selectedTaskIdStr === "exit") {
      ceremonyOutro("Exiting task manager.");
      return;
    }

    const selectedTaskId = parseInt(selectedTaskIdStr, 10);
    const task = openTasks.find((t) => t.id === selectedTaskId);
    if (!task) {
      clog.error("Selected task not found.");
      continue;
    }

    const action = await select({
      message: `Action for #${task.id} "${task.title}":`,
      options: [
        { value: "done", label: "Complete task" },
        { value: "snooze", label: "Snooze task" },
        { value: "cut", label: "Cut (archive) task" },
        { value: "back", label: "Go back to list" },
      ],
    });

    if (isCancel(action) || action === "back") {
      continue;
    }

    if (action === "done") {
      completeTask(slug, selectedTaskId, today);
    } else if (action === "snooze") {
      const daysStr = await text({
        message: "Snooze for how many days?",
        placeholder: "3",
        validate: (val) => {
          if (val && isNaN(parseInt(val, 10))) return "Please enter a valid number of days.";
        },
      });
      if (isCancel(daysStr)) {
        continue;
      }
      const days = daysStr ? parseInt(daysStr, 10) : 3;
      snoozeTask(slug, selectedTaskId, days, today);
      const oracleWarning = getSnoozeWarning();
      if (oracleWarning) {
        clog.message(`🔮 Snooze Oracle: ${oracleWarning}`);
      }
    } else if (action === "cut") {
      cutTask(slug, selectedTaskId, task.title, today);
    }
  }
}

function repairTasks(slug: string): void {
  const content = readTasksFile(slug);
  if (!content) {
    clog.message("No tasks.md to repair.");
    return;
  }

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
  clog.success(`Repaired tasks.md — ${nextId - 1} tasks re-numbered.`);
}

// ─── Git Hook ────────────────────────────────────────────────────

function installGitHook(): void {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir)) {
    clog.warn("No git repo — auto-close from commits disabled.");
    clog.message("Run `git init` to enable commit-to-task sync.");
    return;
  }

  const hooksDir = path.join(gitDir, "hooks");
  const hookPath = path.join(hooksDir, "commit-msg");
  const scriptPath = path.join(hooksDir, "loopkit-commit-msg.js");

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (existing.includes("loopkit")) return;
  }

  // Write standalone node script (cleaner, no inline eval, no shell spawn)
  const nodeScript = `var fs = require('fs');
var crypto = require('crypto');

var msgFile = process.argv[2];
var msg = fs.readFileSync(msgFile, 'utf-8');
var taskRefs = [];
var re = /\\[#(\\d+)\\]/g;
var m;
while ((m = re.exec(msg)) !== null) {
  taskRefs.push(m[1]);
}
if (taskRefs.length === 0) process.exit(0);

var configPath = '.loopkit/config.json';
if (!fs.existsSync(configPath)) process.exit(0);
var config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
var slug = config.activeProject;
if (!slug) process.exit(0);

var tasksPath = '.loopkit/projects/' + slug + '/tasks.md';
if (!fs.existsSync(tasksPath)) process.exit(0);

var content = fs.readFileSync(tasksPath, 'utf-8');
var shortHash = crypto.createHash('sha256').update(msg).digest('hex').slice(0, 7);
var date = new Date().toISOString().split('T')[0];

for (var i = 0; i < taskRefs.length; i++) {
  var id = taskRefs[i];
  content = content.replace(
    new RegExp('- \\\\[ \\\\] #' + id + ' (.+)'),
    '- [x] #' + id + ' \\u2713 \\u2014 closed via ' + shortHash + ' on ' + date
  );
  console.log('\\u2713 Task #' + id + ' closed via commit ' + shortHash);
}

fs.writeFileSync(tasksPath, content);
`;

  fs.writeFileSync(scriptPath, nodeScript, "utf-8");

  // Shell hook calls node script directly (~0ms overhead vs inline eval)
  const hookLine = `\n# ── LoopKit: auto-close tasks from commit messages ──\nnode .git/hooks/loopkit-commit-msg.js "$1"\n`;

  const existing = fs.existsSync(hookPath)
    ? fs.readFileSync(hookPath, "utf-8")
    : "#!/bin/sh\n";

  fs.writeFileSync(hookPath, existing + hookLine);
  fs.chmodSync(hookPath, "755");
}

// ─── Helpers ─────────────────────────────────────────────────────

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

  clog.step(`Week Summary — ${slug}`);
  console.log(`  ${colors.white("Planned:")} ${weekTasks.length}`);
  console.log(`  ${colors.success("Completed:")} ${done.length}`);
  console.log(`  ${colors.warning("Open:")} ${open.length}`);
  console.log(`  ${colors.white("Backlog:")} ${backlogTasks.length}`);
  console.log(
    `\n  ${colors.white.bold("Shipping Score")} ${renderProgressBar(score)} ${colors.white.bold(`${score}%`)}`
  );

  // Benchmarks in week summary
  const weekBenchmarks = computeBenchmarks();
  if (weekBenchmarks && weekBenchmarks.metrics.totalWeeks >= 4) {
    clog.step("Benchmarks");
    console.log(renderBenchmarks(weekBenchmarks));
  }

  if (done.length > 0) {
    clog.step("Completed");
    for (const task of done) {
      clog.success(`#${task.id} ${task.title}`);
    }
  }

  console.log(nextStep("ship"));
}
