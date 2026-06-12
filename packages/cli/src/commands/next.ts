/**
 * `loopkit next` — the single most valuable next action.
 *
 * Reads local state and prints ONE concrete next step. No menus,
 * no ambiguity, no "what do you want to do?". The user runs this
 * 5x/week and the streak stays alive.
 *
 * Priority order (highest first):
 *   1. No init yet → run `loopkit init`
 *   2. No tasks added yet → `loopkit track -a '<one task>'`
 *   3. Overdue loop (>7 days) → `loopkit loop --async`
 *   4. Day 4-6 of week, 0 tasks closed → `loopkit track` (close one)
 *   5. Day 0-2, has open tasks → `loopkit track` (just keep going)
 *   6. Has open tasks >3 days old → `loopkit track` (close or snooze)
 *   7. Last ship >7 days ago → `loopkit ship`
 *   8. Tasks done but never shipped → `loopkit ship`
 *   9. Backlog bloated → cut 5
 *  10. All caught up → suggest next `loop` day
 */
import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { colors, header, pass, info, nextStep, ceremonyOutro, clog } from "../ui/theme.js";
import {
  getRoot,
  getProjectDir,
  readConfig,
  readBriefJson,
  readTasksFile,
  listLoopLogs,
} from "../storage/local.js";
import { getShipDir } from "../storage/local.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface NextAction {
  title: string;
  reason: string;
  command: string;
}

function getDayOfWeek(): number {
  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  return new Date().getDay();
}

function getDaysSince(date: Date | null): number {
  if (!date) return Infinity;
  return Math.floor((Date.now() - date.getTime()) / ONE_DAY_MS);
}

function getLastShipDate(): Date | null {
  const shipDir = getShipDir();
  if (!fs.existsSync(shipDir)) return null;
  const files = fs
    .readdirSync(shipDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  if (files.length === 0) return null;
  files.sort();
  const last = files[files.length - 1].replace(/\.md$/, "");
  const d = new Date(last);
  return Number.isNaN(d.getTime()) ? null : d;
}

function countTaskStatuses(content: string | null): {
  open: number;
  done: number;
  cut: number;
  snoozed: number;
} {
  if (!content) return { open: 0, done: 0, cut: 0, snoozed: 0 };
  const counts = { open: 0, done: 0, cut: 0, snoozed: 0 };
  for (const line of content.split("\n")) {
    if (line.includes("[x]") || line.includes("[X]")) counts.done++;
    else if (line.includes("[~]")) counts.snoozed++;
    else if (line.includes("[-]")) counts.cut++;
    else if (/\[\d+\]/.test(line)) counts.open++;
  }
  return counts;
}

export function decideNextAction(): NextAction | null {
  return decide();
}

function decide(): NextAction | null {
  // 1. No init yet
  if (!fs.existsSync(getRoot()) || !fs.existsSync(path.join(getRoot(), "config.json"))) {
    return {
      title: "Initialize your workspace",
      reason: "You haven't run init yet. It takes 4 minutes and gives you a scored brief + task scaffold.",
      command: "loopkit init",
    };
  }

  const config = readConfig();
  const slug = config.activeProject ?? null;
  if (!slug) {
    return {
      title: "Set an active project",
      reason: "Your config has no active project. Init one or pick an existing one.",
      command: "loopkit init",
    };
  }

  if (!fs.existsSync(getProjectDir(slug)) || !readBriefJson(slug)) {
    return {
      title: "Re-create the project brief",
      reason: "The active project's brief.md is missing. Re-running init restores it.",
      command: `loopkit init --project ${slug}`,
    };
  }

  const tasksContent = readTasksFile(slug);
  const tasks = countTaskStatuses(tasksContent);
  const lastLoop = listLoopLogs().at(-1) ?? null;
  const lastLoopDate = lastLoop ? new Date(lastLoop.date) : null;
  const lastShip = getLastShipDate();
  const dayOfWeek = getDayOfWeek();

  // 2. No tasks added yet
  if (tasks.open === 0 && tasks.done === 0 && tasks.snoozed === 0) {
    return {
      title: "Add your first task",
      reason: "Your task list is empty. Add one concrete thing you can ship in the next 48 hours.",
      command: "loopkit track -a 'Ship the first task'",
    };
  }

  // 3. Overdue loop (>7 days)
  if (lastLoopDate && getDaysSince(lastLoopDate) > 7) {
    return {
      title: "Close last week's loop (async mode)",
      reason: `Your last loop was ${getDaysSince(lastLoopDate)} days ago. Async mode lets you do it any day this week.`,
      command: "loopkit loop --async",
    };
  }

  // 4-6. Tasks open logic
  if (tasks.open > 0) {
    // Day 4-6 with 0 tasks closed this week → urgency
    if (dayOfWeek >= 3 && dayOfWeek <= 5 && tasks.done === 0) {
      return {
        title: "Close one task today",
        reason: `It's day ${dayOfWeek} of the week and you haven't closed a task yet. Pick the smallest open one.`,
        command: "loopkit track",
      };
    }
    // Has done tasks already → just keep going
    if (tasks.done > 0) {
      return {
        title: "Keep the streak going",
        reason: `You've closed ${tasks.done} task${tasks.done === 1 ? "" : "s"} this week. Pick the next one.`,
        command: "loopkit track",
      };
    }
    // Has open tasks but none done
    return {
      title: "Close your first task this week",
      reason: `You have ${tasks.open} open task${tasks.open === 1 ? "" : "s"}. Mark the smallest one done to start the rhythm.`,
      command: "loopkit track",
    };
  }

  // 7. Last ship >7 days ago
  if (lastShip && getDaysSince(lastShip) > 7) {
    return {
      title: "Ship something — even a small write-up",
      reason: `Last ship was ${getDaysSince(lastShip)} days ago. Draft a 3-line build-in-public post.`,
      command: "loopkit ship",
    };
  }

  // 8. Tasks done but never shipped (no ship logs)
  if (tasks.done >= 1 && !lastShip) {
    return {
      title: "Ship the work you already did",
      reason: `You've closed ${tasks.done} task${tasks.done === 1 ? "" : "s"} but never shipped a launch post. Draft one now.`,
      command: "loopkit ship",
    };
  }

  // 9. Backlog bloated
  if (tasks.snoozed + tasks.open > 20) {
    return {
      title: "Cut 5 tasks from your backlog",
      reason: `You have ${tasks.snoozed + tasks.open} tasks between open and snoozed. The ones you can't name in 10 seconds aren't real.`,
      command: "loopkit track",
    };
  }

  // 10. All caught up — suggest loop day
  if (lastLoopDate && getDaysSince(lastLoopDate) < 7) {
    if (dayOfWeek === 0) {
      return {
        title: "Run the Sunday ritual",
        reason: "It's Sunday. 10 minutes to close the loop and lock in the streak.",
        command: "loopkit loop",
      };
    }
    return {
      title: "You're caught up",
      reason: `Last loop closed ${getDaysSince(lastLoopDate)} day${getDaysSince(lastLoopDate) === 1 ? "" : "s"} ago. Come back Sunday for the next ritual.`,
      command: "loopkit loop",
    };
  }

  return null;
}

export const nextCommand = new Command("next")
  .description("Tell me the single most valuable next action for this week")
  .action(() => {
    const action = decide();

    console.log();
    console.log(header("  LoopKit next  "));
    console.log();

    if (!action) {
      clog.success("You're all caught up. Take a break.");
      console.log(`     ${colors.dim("Run ")}${nextStep("loopkit loop")}${colors.dim(" when it's loop day.")}`);
      ceremonyOutro("See you next time.");
      return;
    }

    console.log(`  ${pass("→")}  ${colors.brand(action.title)}`);
    console.log(`     ${colors.dim(action.reason)}`);
    console.log();
    console.log(`     ${nextStep(action.command)}`);
    console.log();
    ceremonyOutro("That's it. One thing.");
  });
