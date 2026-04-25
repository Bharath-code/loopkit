#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { trackCommand } from "./commands/track.js";
import { shipCommand } from "./commands/ship.js";
import { pulseCommand } from "./commands/pulse.js";
import { loopCommand } from "./commands/loop.js";
import { authCommand } from "./commands/auth.js";

const program = new Command();

program
  .name("loopkit")
  .description(
    "The Solo Founder's Shipping OS — Define · Develop · Deliver · Learn · Repeat"
  )
  .version("0.1.0");

program
  .command("init")
  .description("Turn a fuzzy idea into a sharp, falsifiable brief")
  .argument("[name]", "Resume an existing project by name")
  .option("--analyze <name>", "Add AI analysis to an existing brief")
  .action(initCommand);

program
  .command("track")
  .description("Lightweight task management synced with git commits")
  .option("--week", "Show full week summary")
  .option("--add <task>", "Add a task inline")
  .option("--repair", "Auto-fix formatting issues in tasks.md")
  .action(trackCommand);

program
  .command("ship")
  .description("Generate launch posts for HN, Twitter, and Indie Hackers")
  .action(shipCommand);

program
  .command("pulse")
  .description("View and cluster async feedback from your users")
  .option("--raw", "Show raw responses without clustering")
  .option("--setup", "Generate feedback form URL")
  .option("--add <response>", "Add a single feedback response inline")
  .action(pulseCommand);

program
  .command("loop")
  .description("Weekly review — one decision, one post, loop closed")
  .action(loopCommand);

program.addCommand(authCommand);

program.parse();
