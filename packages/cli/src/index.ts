#!/usr/bin/env node

import { Command } from "commander";
import { applyHelpOverride } from "./ui/help.js";
import { recordEvent, telemetryCommand } from "./analytics/telemetry.js";
import { flushTelemetry } from "./telemetry/index.js";

/**
 * LoopKit CLI entry point.
 *
 * Commands are registered eagerly for help/discoverability but the
 * heavy command bodies (which pull in @ai-sdk, AI prompts, analytics
 * engines, voice recording, etc.) are loaded lazily on first invocation.
 * This keeps cold start fast: `loopkit --help` doesn't need to
 * compile the AI client or the voice pipeline.
 */

// ─── Eager (cheap, needed for --help) ──────────────────────────────

const program = new Command();

program
  .name("loopkit")
  .description("The CLI for solo technical founders shipping weekly")
  .version("0.2.0");

applyHelpOverride(program);

// ─── Lazy command loaders ─────────────────────────────────────────

type LazyCommandFn = (...args: unknown[]) => Promise<void> | void;
type LazyModule = Record<string, LazyCommandFn>;
type ModuleLoader = () => Promise<unknown>;

function findExport(mod: unknown, name: string | undefined): LazyCommandFn {
  if (name && typeof (mod as LazyModule)[name] === "function") {
    return (mod as LazyModule)[name]!;
  }
  // Pick the first exported function
  for (const key of Object.keys(mod as object)) {
    const v = (mod as LazyModule)[key];
    if (typeof v === "function") return v;
  }
  throw new Error("No exported function found in module");
}

function makeCommand(
  name: string,
  description: string,
  loader: ModuleLoader,
  configure?: (cmd: Command) => void,
  exportName?: string,
): Command {
  const cmd = program.command(name).description(description);
  if (configure) configure(cmd);
  cmd.action(async (...args: unknown[]) => {
    const mod = await loader();
    const fn = findExport(mod, exportName);
    recordEvent({ command: name });
    try {
      await fn(...args);
    } finally {
      // Best-effort flush — never block on telemetry
      void flushTelemetry();
    }
  });
  return cmd;
}

// ─── Eager subcommand: labs (toggles a flag, very cheap) ──────────

program
  .command("labs [action]")
  .description("Toggle experimental commands (off by default)")
  .action(async (action) => {
    const { labsCommand } = await import("./commands/labs-cmd.js");
    labsCommand(action);
  });

// ─── Eager subcommand: sync status (cheap, no AI) ─────────────────

program
  .command("sync [action]")
  .description("Check or reset the CLI → dashboard sync state")
  .action(async (action) => {
    const { syncCommand } = await import("./commands/sync.js");
    syncCommand(action);
  });

// ─── Lazy: the heavy 5 core loop commands ────────────────────────

makeCommand(
  "init [name]",
  "Turn a fuzzy idea into a scored, falsifiable brief",
  () => import("./commands/init.js"),
  (cmd) =>
    cmd
      .option("-t, --template <id>", "Project template (saas|api|mobile|cli|newsletter|agency|open-source|marketplace|ai-wrapper)")
      .option("--cron", "Install Friday reminder cron job")
      .option("--validate", "Run devil's advocate validation on your brief")
      .option("--from-web <payload>", "Pre-fill from the web onboarding flow (base64 JSON)"),
);

makeCommand(
  "track [id]",
  "Parse tasks.md and show project momentum",
  () => import("./commands/track.js"),
  (cmd) =>
    cmd
      .option("-w, --week", "Show a summary of the current week")
      .option("-a, --add [title]", "Add a new task inline (or open $EDITOR with no arg)")
      .option("-r, --repair", "Repair and re-sequence broken task IDs")
      .option("-p, --project <slug>", "Switch active project")
      .option("-s, --stand", "Run 60-second daily standup check-in")
      .option("-i, --interactive", "Interactively select and update tasks")
      .option("--done", "Mark the specified task ID as done")
      .option("--snooze [days]", "Snooze the specified task ID (default: 3 days)")
      .option("--cut", "Cut/archive the specified task ID")
      .option("--push", "Push local tasks.md to the dashboard (CLI → Convex)")
      .option("--pull", "Pull dashboard tasks into local tasks.md (Convex → CLI)")
      .option("--sync", "Bidirectional sync with LWW conflict resolution"),
);

makeCommand(
  "ship",
  "AI drafts for HN, Twitter, and Indie Hackers",
  () => import("./commands/ship.js"),
  (cmd) => cmd.option("--changelog", "Convert the week's ship log + git commits into release notes"),
);

makeCommand(
  "pulse",
  "Log and cluster async user feedback with AI",
  () => import("./commands/pulse.js"),
  (cmd) =>
    cmd
      .option("--raw", "Show raw responses without AI clustering")
      .option("--setup", "Explain how to set up feedback collection")
      .option("--add <text>", "Add a response inline")
      .option("--share", "Generate a shareable feedback URL"),
);

makeCommand(
  "loop",
  "Sunday ritual: AI synthesizes the week",
  () => import("./commands/loop.js"),
  (cmd) =>
    cmd
      .option("--async", "Run loop any day within 7-day window (doesn't break streak)")
      .option("--revenue <amount>", "Log MRR directly (e.g. --revenue 240)"),
);

// ─── Lazy: secondary commands ────────────────────────────────────

makeCommand(
  "auth",
  "Browser OAuth login or paste an Anthropic API key",
  () => import("./commands/auth.js"),
  (cmd) => cmd.option("--key <api_key>", "Paste an Anthropic API key directly"),
);

makeCommand(
  "celebrate",
  "ASCII confetti + your shipping score + shareable card",
  () => import("./commands/celebrate.js"),
  (cmd) =>
    cmd
      .option("--share", "Post your win to the public feed at loopkit.dev/wins")
      .option("--annual [year]", "Show year-in-review card (default: current year)"),
);

makeCommand(
  "radar",
  "(labs) Scan Product Hunt & HN for launches in your category",
  () => import("./commands/radar.js"),
  (cmd) =>
    cmd
      .option("-c, --category <name>", "Category to scan")
      .option("-p, --project <slug>", "Project to scan for"),
);

makeCommand(
  "keywords",
  "(labs) Find low-competition keywords in your niche using free SEO data",
  () => import("./commands/keywords.js"),
  (cmd) =>
    cmd
      .option("-c, --category <name>", "Category to find keywords for")
      .option("-p, --project <slug>", "Project to find keywords for"),
);

makeCommand(
  "timing",
  "(labs) Analyze market timing signals: funding, dev activity, and hiring trends",
  () => import("./commands/timing.js"),
  (cmd) =>
    cmd
      .option("-c, --category <name>", "Category to analyze")
      .option("-p, --project <slug>", "Project to analyze for"),
);

makeCommand(
  "coach",
  "AI coaching based on your shipping patterns and milestones",
  () => import("./commands/coach.js"),
  (cmd) =>
    cmd
      .option("--on", "Enable coaching")
      .option("--off", "Disable coaching")
      .option("--dna", "Generate your Founder DNA Report"),
);

makeCommand(
  "revenue",
  "Track MRR milestones — from idea to first dollar",
  () => import("./commands/revenue.js"),
  (cmd) =>
    cmd
      .option("-a, --add <amount>", "Log MRR directly (e.g. --add 240)")
      .option("-l, --log", "Show full revenue history"),
);

makeCommand(
  "remind:friday",
  "Friday reminder: check if you've shipped (called by cron)",
  () => import("./commands/remind.js"),
);

makeCommand(
  "aliases",
  "Manage shell aliases for faster LoopKit commands",
  () => import("./commands/aliases.js"),
  (cmd) => cmd.option("--remove", "Remove LoopKit aliases from shell config"),
);

makeCommand(
  "update [month]",
  "(labs, deprecated) Generate structured monthly investor updates",
  () => import("./commands/update.js"),
  (cmd) => cmd.option("--year <year>", "Specify the year (defaults to current year)"),
);

makeCommand(
  "audit",
  "Founder therapy: 2-page report on the last 8 weeks of work",
  () => import("./commands/audit.js"),
  (cmd) =>
    cmd
      .option("-w, --weeks <n>", "Window in weeks (default 8, max 52)", (v) => parseInt(v, 10))
      .option("-e, --export <format>", "Export to .loopkit/audits/ (md or pdf)")
      .option("--cohort", "Show only the cohort comparison"),
);

makeCommand(
  "price",
  "Pricing copilot: 2-3 tier model + 30-day validation experiment",
  () => import("./commands/price.js"),
  (cmd) =>
    cmd
      .option("--local", "Show local context only (no AI call)")
      .option("-e, --export <format>", "Export to .loopkit/pricing/ (md only)")
      .option("--experiment <days>", "Add a reminder after N days to log conversion", (v) => parseInt(v, 10)),
);

makeCommand(
  "voice",
  "Record a 60s standup → transcribed → tasks added to tasks.md",
  () => import("./commands/track-voice.js"),
  (cmd) =>
    cmd
      .option("--max <seconds>", "Max recording duration in seconds (default 60)", (v) => parseInt(v, 10))
      .option("--no-preview", "Skip the confirmation step before writing"),
);

makeCommand(
  "doctor",
  "Diagnose your workspace — streak, backlog, shipping rhythm, time since last loop",
  () => import("./commands/doctor.js"),
);

makeCommand(
  "next",
  "Tell me the single most valuable next action for this week",
  () => import("./commands/next.js"),
);

// ─── Telemetry (cheap, no AI) ─────────────────────────────────────

program
  .command("telemetry [action]")
  .description("Manage anonymous usage telemetry")
  .action((action) => {
    telemetryCommand(action);
  });

// ─── Run ─────────────────────────────────────────────────────────

program.parse(process.argv);
