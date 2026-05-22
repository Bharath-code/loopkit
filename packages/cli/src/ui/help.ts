/**
 * LoopKit CLI — Custom Help Renderer
 * Replaces Commander's generic --help with a branded, Stripe-CLI-quality output.
 *
 * Usage: call `applyHelpOverride(program)` on the Commander program instance
 * before parsing. This patches the `--help` output.
 */

import { type Command } from "commander";
import { token, sym, space } from "./tokens.js";
import { gradient, divider, badge } from "./layout.js";

// ─── Content ─────────────────────────────────────────────────────

const BRAND = gradient("LoopKit");

const TAGLINE = token.muted("The CLI for solo founders shipping weekly.");

const PRIMARY_COMMANDS = [
  {
    name:        "init",
    args:        "[name]",
    description: "Turn a fuzzy idea into a scored, falsifiable brief",
    when:        "Day 1",
    flags:       ["--template <id>", "--validate", "--cron"],
  },
  {
    name:        "track",
    args:        "",
    description: "Parse tasks.md and show project momentum",
    when:        "Daily",
    flags:       ["--add [title]", "--stand", "--week"],
  },
  {
    name:        "ship",
    args:        "",
    description: "AI drafts for HN, Twitter, and Indie Hackers",
    when:        "On launch",
    flags:       [],
  },
  {
    name:        "pulse",
    args:        "",
    description: "Log and cluster async user feedback with AI",
    when:        "After launch",
    flags:       ["--add <text>", "--raw", "--setup"],
  },
  {
    name:        "loop",
    args:        "",
    description: "Sunday ritual: AI synthesizes the week",
    when:        "Sunday",
    flags:       ["--async", "--revenue <n>"],
  },
  {
    name:        "revenue",
    args:        "",
    description: "Track MRR — from $0 to first paying customer",
    when:        "On payment",
    flags:       ["--add <amount>", "--log"],
  },
] as const;

const TOOL_COMMANDS = [
  { name: "radar",     description: "Scan Product Hunt & HN launches in your category" },
  { name: "keywords",  description: "Find low-competition keywords in your niche" },
  { name: "timing",    description: "Analyze market timing signals" },
  { name: "coach",     description: "AI coaching based on your shipping patterns" },
  { name: "celebrate", description: "ASCII confetti + shareable weekly card" },
  { name: "update",    description: "Generate structured monthly investor updates (Markdown & HTML)" },
  { name: "auth",      description: "Manage your API key (BYOK)" },
  { name: "aliases",   description: "Install shell shortcuts: lk, lks, lkt, lkl" },
  { name: "telemetry", description: "Manage anonymous usage analytics" },
] as const;

const GLOBAL_FLAGS = [
  { flag: "-h, --help",    description: "Show this help" },
  { flag: "-V, --version", description: "Print version number" },
] as const;

const EXAMPLES = [
  {
    command: "loopkit init MyProject",
    note:    "Start a new project brief",
  },
  {
    command: "loopkit track --add",
    note:    "Add a task to your backlog",
  },
  {
    command: "loopkit track --stand",
    note:    "60-second daily standup",
  },
  {
    command: "loopkit loop --async",
    note:    "Close the week any day (±3d window)",
  },
] as const;

// ─── Renderer ────────────────────────────────────────────────────

function renderHelp(): string {
  const lines: string[] = [];

  // ── Header
  lines.push("");
  lines.push(`  ${BRAND}  ${TAGLINE}`);
  lines.push("");
  lines.push(`  ${token.dim("Version 0.1.0")}`);
  lines.push("");

  // ── Usage
  lines.push(divider());
  lines.push("");
  lines.push(`  ${token.label("USAGE")}`);
  lines.push(`${space.indent2}loopkit ${token.muted("<command>")} ${token.dim("[options]")}`);
  lines.push("");

  // ── The Loop — primary commands
  lines.push(divider(token.brand("The Weekly Loop")));
  lines.push("");

  const cmdWidth = 10;
  const argWidth = 12;
  const whenWidth = 10;

  for (const cmd of PRIMARY_COMMANDS) {
    const name = token.brand.bold(cmd.name.padEnd(cmdWidth));
    const args = token.dim((cmd.args as string).padEnd(argWidth));
    const when = badge(cmd.when, "muted");
    const desc = token.body(cmd.description);
    lines.push(`  ${name}${args}${when}  ${desc}`);

    if (cmd.flags.length > 0) {
      for (const flag of cmd.flags) {
        lines.push(`  ${" ".repeat(cmdWidth + argWidth + 6)}${token.dim(flag)}`);
      }
      lines.push("");
    }
  }

  // ── Tools — secondary commands
  lines.push("");
  lines.push(divider(token.muted("Tools")));
  lines.push("");

  for (const cmd of TOOL_COMMANDS) {
    const name = token.muted(cmd.name.padEnd(cmdWidth));
    lines.push(`  ${name}${space.indent}${token.dim(cmd.description)}`);
  }
  lines.push("");

  // ── Global flags
  lines.push(divider());
  lines.push("");
  lines.push(`  ${token.label("FLAGS")}`);
  for (const f of GLOBAL_FLAGS) {
    lines.push(`  ${f.flag.padEnd(16)}  ${token.dim(f.description)}`);
  }
  lines.push("");

  // ── Examples
  lines.push(`  ${token.label("EXAMPLES")}`);
  for (const ex of EXAMPLES) {
    lines.push(
      `  ${token.code(ex.command.padEnd(38))}  ${token.dim(ex.note)}`,
    );
  }
  lines.push("");

  // ── Footer
  lines.push(divider());
  lines.push(
    `  ${token.dim("Docs:")} ${token.brand("https://loopkit.dev")}  ${token.dim("/")}  ${token.dim("Built by solo founders, for solo founders.")}`,
  );
  lines.push("");

  return lines.join("\n");
}

// ─── Apply Override ──────────────────────────────────────────────

/**
 * Patch Commander's default help output with our branded renderer.
 * Call this BEFORE `program.parse()`.
 */
export function applyHelpOverride(program: Command): void {
  // Override the help command
  program.configureHelp({
    formatHelp: () => renderHelp(),
  });

  // Also handle -h / --help flag
  program.helpOption("-h, --help", "Show help");
}
