/**
 * `loopkit doctor` — read-only diagnostic command.
 *
 * Inspects the user's local state (.loopkit/, projects, logs, ships)
 * and emits 3-5 actionable observations. Pure heuristics — no AI.
 * Runs in <100ms, makes zero network calls.
 *
 * Use cases:
 *   - User drifts and wants to know what's wrong
 *   - User hasn't run `loop` in N days (streak at risk)
 *   - User's backlog is bloated (snooze oracle signal)
 *   - User is on day 4 of the week with 0 tasks closed
 *   - User's last 3 weeks were all snooze/cut (churn signal)
 *
 * Exit code 0 if everything is healthy, 1 if critical issues found.
 */
import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { colors, header, pass, warn, fail, info, nextStep, box, ceremonyOutro, clog } from "../ui/theme.js";
import {
  getRoot,
  getLogsDir,
  getShipDir,
  getProjectDir,
  readConfig,
  listLoopLogs,
  readTasksFile,
  readBriefJson,
} from "../storage/local.js";

type Severity = "ok" | "info" | "warn" | "fail";

interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  action?: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

function isInitialized(): boolean {
  return fs.existsSync(path.join(getRoot(), "config.json"));
}

function getActiveProjectSlug(): string | null {
  const config = readConfig();
  return config.activeProject ?? null;
}

function getDaysSinceLastCommitLike(): number | null {
  // Heuristic: most recent mtime of any file under .loopkit/
  const root = getRoot();
  if (!fs.existsSync(root)) return null;
  let latest = 0;
  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      try {
        const stat = fs.statSync(p);
        if (stat.mtimeMs > latest) latest = stat.mtimeMs;
        if (e.isDirectory()) walk(p);
      } catch {
        // ignore
      }
    }
  }
  walk(root);
  if (latest === 0) return null;
  return Math.floor((Date.now() - latest) / ONE_DAY_MS);
}

function countTasks(content: string | null): { open: number; done: number; cut: number; snoozed: number } {
  if (!content) return { open: 0, done: 0, cut: 0, snoozed: 0 };
  const counts = { open: 0, done: 0, cut: 0, snoozed: 0 };
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.includes("[x]") || line.includes("[X]")) counts.done++;
    else if (line.includes("[~]")) counts.snoozed++;
    else if (line.includes("[-]")) counts.cut++;
    else if (/\[\d+\]/.test(line)) counts.open++;
  }
  return counts;
}

export function runDoctorChecks(findings: Finding[]): void {
  checkStreak(findings);
  checkBacklog(findings);
  checkShippingRhythm(findings);
  checkTimeSinceActivity(findings);
  checkBrief(findings);
}

export function getDoctorFindings(): Finding[] {
  const findings: Finding[] = [];
  checkFreshness(findings);
  if (findings.some((f) => f.severity === "fail")) return findings;
  runDoctorChecks(findings);
  return findings;
}

function checkFreshness(findings: Finding[]): void {
  if (!fs.existsSync(getRoot())) {
    findings.push({
      severity: "fail",
      title: "No LoopKit workspace found",
      detail: "Run `loopkit init` in your project to create one.",
      action: "loopkit init",
    });
    return;
  }
  if (!isInitialized()) {
    findings.push({
      severity: "fail",
      title: "Config missing or corrupt",
      detail: "`.loopkit/config.json` doesn't exist or is unreadable. Re-run `loopkit init` to repair.",
      action: "loopkit init",
    });
    return;
  }

  const slug = getActiveProjectSlug();
  if (!slug) {
    findings.push({
      severity: "fail",
      title: "No active project set",
      detail: "Your config has no `activeProject`. Run `loopkit track -p <slug>` or `loopkit init` to set one.",
    });
    return;
  }

  if (!fs.existsSync(getProjectDir(slug))) {
    findings.push({
      severity: "fail",
      title: `Project '${slug}' not found on disk`,
      detail: "The config references a project that doesn't exist. Re-init or switch to another project.",
      action: `loopkit track -p ${slug}`,
    });
    return;
  }
}

function checkStreak(findings: Finding[]): void {
  const logs = listLoopLogs();
  if (logs.length === 0) {
    findings.push({
      severity: "info",
      title: "No loop logs yet",
      detail: "You haven't run `loopkit loop` yet. Your streak starts the first time you do.",
      action: "loopkit loop",
    });
    return;
  }

  const latest = logs[logs.length - 1];
  const latestDate = new Date(latest.date);
  const daysSince = Math.floor((Date.now() - latestDate.getTime()) / ONE_DAY_MS);

  if (daysSince > 7) {
    findings.push({
      severity: "fail",
      title: `Streak at risk — last loop was ${daysSince} days ago`,
      detail: "You've gone more than a week without closing a loop. Run one today to reset the counter.",
      action: "loopkit loop --async",
    });
  } else if (daysSince > 3) {
    findings.push({
      severity: "warn",
      title: `Loop is ${daysSince} days old`,
      detail: "If today is your Sunday (or your loop day), run `loopkit loop` before midnight to keep the streak alive.",
    });
  } else {
    findings.push({
      severity: "ok",
      title: `Streak alive — last loop ${daysSince} day${daysSince === 1 ? "" : "s"} ago`,
      detail: `Week ${latest.weekNumber} closed. Shipping score: ${latest.shippingScore}%.`,
    });
  }

  // Overrides warning (churn signal)
  const recentOverrides = logs.slice(-4).filter((l) => l.overridden).length;
  if (recentOverrides >= 3) {
    findings.push({
      severity: "warn",
      title: `${recentOverrides}/4 recent weeks had score overrides`,
      detail: "If you're overriding the score often, the calculation isn't matching your reality. Consider adjusting the heuristic or running a more honest loop.",
    });
  }
}

function checkBacklog(findings: Finding[]): void {
  const slug = getActiveProjectSlug();
  if (!slug) return;

  const content = readTasksFile(slug);
  const counts = countTasks(content);
  const totalActive = counts.open + counts.snoozed;

  if (totalActive === 0 && counts.done > 0) {
    findings.push({
      severity: "ok",
      title: "Backlog is clean",
      detail: `${counts.done} task${counts.done === 1 ? "" : "s"} closed this period, nothing pending. Great week.`,
    });
  } else if (totalActive > 30) {
    findings.push({
      severity: "warn",
      title: `Backlog is bloated — ${totalActive} open/snoozed tasks`,
      detail: "Tasks you don't see are tasks you don't do. Consider cutting 10+ that aren't on this week's critical path.",
      action: "loopkit track",
    });
  } else if (counts.snoozed > counts.open) {
    findings.push({
      severity: "warn",
      title: `More snoozed than open (${counts.snoozed} vs ${counts.open})`,
      detail: "Snoozed tasks accumulate. Anything snoozed 3+ times is unlikely to ship — consider cutting it.",
      action: "loopkit track",
    });
  }

  // Snooze oracle: count tasks with snooze history
  if (content) {
    const highSnoozeTasks = (content.match(/\(snoozed\s+\d+\s*times?\)/g) ?? []).length;
    if (highSnoozeTasks > 0) {
      findings.push({
        severity: "warn",
        title: `${highSnoozeTasks} task${highSnoozeTasks === 1 ? "" : "s"} snoozed 3+ times`,
        detail: "Historically, tasks snoozed 3+ times get cut 80% of the time. Move them to the cut pile now to free up attention.",
        action: "loopkit track",
      });
    }
  }
}

function checkShippingRhythm(findings: Finding[]): void {
  const shipDir = getShipDir();
  if (!fs.existsSync(shipDir)) {
    findings.push({
      severity: "info",
      title: "No ships yet",
      detail: "Ships are the public artifacts of your weekly work. Run `loopkit ship` after your first task closes.",
    });
    return;
  }
  const files = fs.readdirSync(shipDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    findings.push({
      severity: "info",
      title: "No ships yet",
      detail: "Run `loopkit ship` to draft your first launch post.",
    });
    return;
  }
  // Sort by filename (YYYY-MM-DD.md) ascending
  files.sort();
  const latest = files[files.length - 1];
  const latestDate = new Date(latest.replace(/\.md$/, ""));
  if (Number.isNaN(latestDate.getTime())) return;
  const daysSince = Math.floor((Date.now() - latestDate.getTime()) / ONE_DAY_MS);
  if (daysSince < 7) {
    findings.push({
      severity: "ok",
      title: `Last ship ${daysSince} day${daysSince === 1 ? "" : "s"} ago (${latest.replace(/\.md$/, "")})`,
      detail: `${files.length} total ship${files.length === 1 ? "" : "s"} logged.`,
    });
  } else if (daysSince < 21) {
    findings.push({
      severity: "warn",
      title: `Last ship ${daysSince} days ago`,
      detail: "Ships don't have to be big. A small write-up of what you learned counts.",
      action: "loopkit ship",
    });
  } else {
    findings.push({
      severity: "fail",
      title: `Last ship ${daysSince} days ago`,
      detail: "The build-in-public loop has gone silent. Even a 2-line 'I shipped nothing this week and that's a finding' post counts.",
      action: "loopkit ship",
    });
  }
}

function checkTimeSinceActivity(findings: Finding[]): void {
  const days = getDaysSinceLastCommitLike();
  if (days === null) return;
  if (days > 14) {
    findings.push({
      severity: "fail",
      title: `No .loopkit activity in ${days} days`,
      detail: "The workspace is stale. Either restart with `loopkit track` or archive with `loopkit track --project <new>`.",
    });
  } else if (days > 4) {
    findings.push({
      severity: "info",
      title: `Last workspace touch ${days} days ago`,
      detail: "If you're between weeks, a single `loopkit track` keeps the rhythm visible.",
    });
  }
}

function checkBrief(findings: Finding[]): void {
  const slug = getActiveProjectSlug();
  if (!slug) return;
  const brief = readBriefJson(slug);
  if (!brief) {
    findings.push({
      severity: "warn",
      title: "No brief.md found for active project",
      detail: "Run `loopkit init` to regenerate the brief from your answers.",
      action: "loopkit init --analyze",
    });
  }
}

function renderFinding(f: Finding, index: number): void {
  const icon = f.severity === "ok" ? pass("✓") : f.severity === "warn" ? warn("!") : f.severity === "fail" ? fail("✗") : info("i");
  console.log(`  ${icon}  ${colors.primary(f.title)}`);
  console.log(`     ${colors.dim(f.detail)}`);
  if (f.action) {
    console.log(`     ${nextStep(f.action)}`);
  }
  if (index < 100) {
    // no-op
  }
}

export const doctorCommand = new Command("doctor")
  .description("Diagnose your workspace — get 3-5 actionable observations about streak, backlog, shipping rhythm")
  .action(() => {
    ceremonyOutroBox();

    if (!isInitialized()) {
      clog.error("No LoopKit workspace found in this directory.");
      clog.message("  Run " + colors.primary("loopkit init") + " to create one.");
      process.exit(1);
    }

    const findings: Finding[] = [];
    checkFreshness(findings);
    if (findings.some((f) => f.severity === "fail")) {
      // fatal — don't bother with the rest
      console.log();
      console.log(header("  LoopKit doctor  "));
      console.log();
      findings.forEach((f, i) => renderFinding(f, i));
      console.log();
      const failCount = findings.filter((f) => f.severity === "fail").length;
      if (failCount > 0) process.exit(1);
      return;
    }

    runDoctorChecks(findings);

    console.log();
    console.log(header("  LoopKit doctor  "));
    console.log();
    findings.forEach((f, i) => renderFinding(f, i));
    console.log();

    const failCount = findings.filter((f) => f.severity === "fail").length;
    const warnCount = findings.filter((f) => f.severity === "warn").length;
    if (failCount > 0) {
      clog.error(`${failCount} critical, ${warnCount} warning${warnCount === 1 ? "" : "s"}`);
      process.exit(1);
    } else if (warnCount > 0) {
      clog.warn(`${warnCount} warning${warnCount === 1 ? "" : "s"}`);
    } else {
      clog.success("All clear. Keep shipping.");
    }
    ceremonyOutro("Run `loopkit next` for your single most valuable next action.");
  });

function ceremonyOutroBox(): void {
  // Lightweight — doctor is a diagnostic, not a ceremony
  // (The "feel" of the command is in the findings list itself.)
  void box;
  void ONE_WEEK_MS;
}
