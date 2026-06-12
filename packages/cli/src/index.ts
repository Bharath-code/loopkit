#!/usr/bin/env node

import { Command } from "commander";
import { applyHelpOverride } from "./ui/help.js";
import { initCommand } from "./commands/init.js";
import { trackCommand } from "./commands/track.js";
import { shipCommand } from "./commands/ship.js";
import { pulseCommand } from "./commands/pulse.js";
import { loopCommand } from "./commands/loop.js";
import { authCommand } from "./commands/auth.js";
import { celebrateCommand } from "./commands/celebrate.js";
import { radarCommand } from "./commands/radar.js";
import { keywordsCommand } from "./commands/keywords.js";
import { timingCommand } from "./commands/timing.js";
import { coachCommand } from "./commands/coach.js";
import { revenueCommand } from "./commands/revenue.js";
import { remindFridayCommand } from "./commands/remind.js";
import { aliasesCommand } from "./commands/aliases.js";
import { updateCommand } from "./commands/update.js";
import { labsCommand } from "./commands/labs-cmd.js";
import { syncCommand } from "./commands/sync.js";
import { auditCommand } from "./commands/audit.js";
import { priceCommand } from "./commands/price.js";
import { recordEvent, telemetryCommand } from "./analytics/telemetry.js";

const program = new Command();

program
  .name("loopkit")
  .description("The CLI for solo technical founders shipping weekly")
  .version("0.1.0");

// Apply branded --help renderer (replaces Commander's default output)
applyHelpOverride(program);

// Help text is now handled by ui/help.ts (applyHelpOverride above)

program
  .command("init [name]")
  .description("Turn a fuzzy idea into a scored, falsifiable brief")
  .option("--analyze <name>", "Run AI analysis on a previously saved session")
  .option("-t, --template <id>", "Use a project template (saas|api|mobile|cli|newsletter|agency|open-source|marketplace|ai-wrapper)")
  .option("--cron", "Install Friday reminder cron job")
  .option("--validate", "Run devil's advocate validation on your brief")
  .option("--from-web <payload>", "Pre-fill from the web onboarding flow (base64 JSON)")
  .action((name, options) => {
    recordEvent({ command: "init" });
    initCommand(name, options);
  });

program
  .command("track [id]")
  .description("Parse tasks.md and show project momentum")
  .option("-w, --week", "Show a summary of the current week")
  .option("-a, --add [title]", "Add a new task inline (or open $EDITOR with no arg)")
  .option("-r, --repair", "Repair and re-sequence broken task IDs")
  .option("-p, --project <slug>", "Switch active project")
  .option("-s, --stand", "Run 60-second daily standup check-in")
  .option("-i, --interactive", "Interactively select and update tasks")
  .option("--done", "Mark the specified task ID as done")
  .option("--snooze [days]", "Snooze the specified task ID (default: 3 days)")
  .option("--cut", "Cut/archive the specified task ID")
  .action((id, options) => {
    recordEvent({ command: options.stand ? "track:stand" : "track" });
    trackCommand(id, options);
  });

program
  .command("ship")
  .description("AI generates drafts for HN, Twitter, and Indie Hackers")
  .option("--changelog", "Automatically convert the week's ship log and git commits into a release notes changelog")
  .action((options) => {
    recordEvent({ command: "ship" });
    shipCommand(options);
  });

program
  .command("pulse")
  .description("Async feedback clustered by AI")
  .option("--raw", "Show raw responses without AI clustering")
  .option("--setup", "Explain how to set up feedback collection")
  .option("--add <text>", "Add a response inline")
  .option("--share", "Generate a shareable feedback URL")
  .action((options) => {
    recordEvent({ command: "pulse" });
    pulseCommand(options);
  });

program
  .command("loop")
  .description("The Sunday ritual: AI synthesizes your week")
  .option("--revenue <amount>", "Log MRR directly (e.g. --revenue 240)")
  .option("--async", "Run loop any day within 7-day window (doesn't break streak)")
  .action((options) => {
    recordEvent({ command: "loop" });
    loopCommand(options);
  });

program.addCommand(authCommand);

program
  .command("celebrate")
  .description("ASCII confetti + your shipping score, streak, and shareable card")
  .option("--share", "Post your win to the public feed at loopkit.dev/wins")
  .option("--annual [year]", "Show year-in-review card (default: current year)")
  .action((options) => {
    recordEvent({ command: options.annual ? "celebrate:annual" : "celebrate" });
    celebrateCommand(true, options);
  });

program
  .command("telemetry [action]")
  .description("Manage anonymous usage telemetry")
  .action((action) => {
    telemetryCommand(action);
  });

program
  .command("radar")
  .description("(labs) Scan Product Hunt & Hacker News for launches in your category")
  .option("-c, --category <name>", "Category to scan")
  .option("-p, --project <slug>", "Project to scan for")
  .action((options) => {
    recordEvent({ command: "radar" });
    radarCommand(options);
  });

program
  .command("keywords")
  .description("(labs) Find low-competition keywords in your niche using free SEO data")
  .option("-c, --category <name>", "Category to find keywords for")
  .option("-p, --project <slug>", "Project to find keywords for")
  .action((options) => {
    recordEvent({ command: "keywords" });
    keywordsCommand(options);
  });

program
  .command("timing")
  .description("(labs) Analyze market timing signals: funding, dev activity, and hiring trends")
  .option("-c, --category <name>", "Category to analyze")
  .option("-p, --project <slug>", "Project to analyze for")
  .action((options) => {
    recordEvent({ command: "timing" });
    timingCommand(options);
  });

program
  .command("coach")
  .description("AI coaching based on your shipping patterns and milestones")
  .option("--on", "Enable coaching")
  .option("--off", "Disable coaching")
  .option("--dna", "Generate your Founder DNA Report")
  .action((options) => {
    recordEvent({ command: options.dna ? "coach:dna" : "coach" });
    coachCommand(options);
  });

program
  .command("revenue")
  .description("Track MRR milestones — from idea to first dollar")
  .option("-a, --add <amount>", "Log MRR directly (e.g. --add 240)")
  .option("-l, --log", "Show full revenue history")
  .action((options) => {
    recordEvent({ command: "revenue" });
    revenueCommand(options);
  });

program
  .command("remind:friday")
  .description("Friday reminder: check if you've shipped (called by cron)")
  .action(() => {
    remindFridayCommand();
  });

program
  .command("aliases")
  .description("Manage shell aliases for faster LoopKit commands")
  .option("--remove", "Remove LoopKit aliases from shell config")
  .action((options) => {
    recordEvent({ command: "aliases" });
    aliasesCommand(options);
  });

program
  .command("update [month]")
  .description("(labs) Generate structured monthly investor updates (Markdown & HTML)")
  .option("--year <year>", "Specify the year for the update (defaults to current year)")
  .action((month, options) => {
    recordEvent({ command: "update" });
    updateCommand(month, options);
  });

program
  .command("labs [action]")
  .description("Toggle experimental commands (off by default)")
  .action((action) => {
    labsCommand(action);
  });

program
  .command("sync [action]")
  .description("Check or reset the CLI → dashboard sync state")
  .action((action) => {
    syncCommand(action);
  });

program
  .command("audit")
  .description("Founder therapy: 2-page report on the last 8 weeks of work")
  .option("-w, --weeks <n>", "Window in weeks (default 8, max 52)", (v) => parseInt(v, 10))
  .option("-e, --export <format>", "Export to .loopkit/audits/ (md or pdf)")
  .option("--cohort", "Show only the cohort comparison")
  .action((options) => {
    recordEvent({ command: "audit" });
    auditCommand({
      weeks: options.weeks,
      export: options.export,
      cohort: options.cohort,
    });
  });

program
  .command("price")
  .description("Pricing copilot: 2-3 tier model + 30-day validation experiment")
  .option("--local", "Show local context only (no AI call)")
  .option("-e, --export <format>", "Export to .loopkit/pricing/ (md only)")
  .option("--experiment <days>", "Add a reminder after N days to log conversion", (v) => parseInt(v, 10))
  .action((options) => {
    recordEvent({ command: "price" });
    priceCommand({
      local: options.local,
      export: options.export,
      experiment: options.experiment,
    });
  });

program.parse(process.argv);
