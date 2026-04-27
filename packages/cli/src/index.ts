#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { trackCommand } from "./commands/track.js";
import { shipCommand } from "./commands/ship.js";
import { pulseCommand } from "./commands/pulse.js";
import { loopCommand } from "./commands/loop.js";
import { authCommand } from "./commands/auth.js";
import { celebrateCommand } from "./commands/celebrate.js";
import { radarCommand } from "./commands/radar.js";
import { keywordsCommand } from "./commands/keywords.js";
import { recordEvent, telemetryCommand } from "./analytics/telemetry.js";

const program = new Command();

program
  .name("loopkit")
  .description(
    "The Solo Founder's Shipping OS — Define · Develop · Deliver · Learn · Repeat"
  )
  .version("0.1.0");

program
  .command("init [name]")
  .description("Turn a fuzzy idea into a scored, falsifiable brief")
  .option("--analyze <name>", "Run AI analysis on a previously saved session")
  .action((name, options) => {
    recordEvent({ command: "init" });
    initCommand(name, options);
  });

program
  .command("track")
  .description("Parse tasks.md and show project momentum")
  .option("-w, --week", "Show a summary of the current week")
  .option("-a, --add [title]", "Add a new task inline (or open $EDITOR with no arg)")
  .option("-r, --repair", "Repair and re-sequence broken task IDs")
  .option("-p, --project <slug>", "Switch active project")
  .action((options) => {
    recordEvent({ command: "track" });
    trackCommand(options);
  });

program
  .command("ship")
  .description("AI generates drafts for HN, Twitter, and Indie Hackers")
  .action(() => {
    recordEvent({ command: "ship" });
    shipCommand();
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
  .action(() => {
    recordEvent({ command: "loop" });
    loopCommand();
  });

program.addCommand(authCommand);

program
  .command("celebrate")
  .description("ASCII confetti + your shipping score, streak, and shareable card")
  .action(() => {
    recordEvent({ command: "celebrate" });
    celebrateCommand();
  });

program
  .command("telemetry [action]")
  .description("Manage anonymous usage telemetry")
  .action((action) => {
    telemetryCommand(action);
  });

program
  .command("radar")
  .description("Scan Product Hunt & Hacker News for launches in your category")
  .option("-c, --category <name>", "Category to scan")
  .option("-p, --project <slug>", "Project to scan for")
  .action((options) => {
    recordEvent({ command: "radar" });
    radarCommand(options);
  });

program
  .command("keywords")
  .description("Find low-competition keywords in your niche using free SEO data")
  .option("-c, --category <name>", "Category to find keywords for")
  .option("-p, --project <slug>", "Project to find keywords for")
  .action((options) => {
    recordEvent({ command: "keywords" });
    keywordsCommand(options);
  });

program.parse(process.argv);
