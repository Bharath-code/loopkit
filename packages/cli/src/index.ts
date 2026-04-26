#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { trackCommand } from "./commands/track.js";
import { shipCommand } from "./commands/ship.js";
import { pulseCommand } from "./commands/pulse.js";
import { loopCommand } from "./commands/loop.js";
import { authCommand } from "./commands/auth.js";
import { celebrateCommand } from "./commands/celebrate.js";
import { PostHog } from "posthog-node";
import { randomUUID } from "node:crypto";
import { readConfig } from "./storage/local.js";

const client = new PostHog("phc_dummy_key", {
  host: "https://us.i.posthog.com",
});

const config = readConfig();
let distinctId = config.distinctId;
if (!distinctId) {
  distinctId = randomUUID();
  config.distinctId = distinctId;
  import("./storage/local.js").then((m) => m.writeConfig(config));
}

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
    client.capture({ distinctId, event: "cli_command_init" });
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
    client.capture({ distinctId, event: "cli_command_track" });
    trackCommand(options);
  });

program
  .command("ship")
  .description("AI generates drafts for HN, Twitter, and Indie Hackers")
  .action(() => {
    client.capture({ distinctId, event: "cli_command_ship" });
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
    client.capture({ distinctId, event: "cli_command_pulse" });
    pulseCommand(options);
  });

program
  .command("loop")
  .description("The Sunday ritual: AI synthesizes your week")
  .action(() => {
    client.capture({ distinctId, event: "cli_command_loop" });
    loopCommand();
  });

program.addCommand(authCommand);

program
  .command("celebrate")
  .description("ASCII confetti + your shipping score, streak, and shareable card")
  .action(() => {
    client.capture({ distinctId, event: "cli_command_celebrate" });
    celebrateCommand();
  });

program.parse(process.argv);

// Ensure PostHog flushes before exit
process.on("exit", () => {
  client.shutdown();
});
