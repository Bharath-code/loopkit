/**
 * LoopKit CLI — Ceremony System
 * Per-command "moments" that give every outcome intentional framing.
 * Inspired by Stripe CLI and Linear CLI success/error patterns.
 */

import * as p from "@clack/prompts";
import { token, sym, space } from "./tokens.js";
import { box, divider, gradient, progressBar, scoreBar, streakMini, kvList, badge } from "./layout.js";

// ─── Success Ceremony ────────────────────────────────────────────

/**
 * Framed success card shown at the end of a successful command.
 */
export function success(
  title: string,
  body?: string,
  nextCommand?: string,
): void {
  const lines: string[] = [
    `${token.success(sym.check)} ${token.heading(title)}`,
  ];
  if (body) {
    lines.push("");
    lines.push(token.body(body));
  }
  if (nextCommand) {
    lines.push("");
    lines.push(
      `${token.muted("Next:")} ${token.code(`loopkit ${nextCommand}`)}`,
    );
  }
  console.log("\n" + box(lines.join("\n"), undefined, "success"));
}

// ─── Error Ceremony ─────────────────────────────────────────────

/**
 * Framed error card with optional recovery hint.
 */
export function error(
  title: string,
  body?: string,
  recoveryHint?: string,
): void {
  const lines: string[] = [
    `${token.error(sym.cross)} ${token.errorBold(title)}`,
  ];
  if (body) {
    lines.push("");
    lines.push(token.body(body));
  }
  if (recoveryHint) {
    lines.push("");
    lines.push(`${token.muted("Hint:")} ${token.dim(recoveryHint)}`);
  }
  console.log("\n" + box(lines.join("\n"), undefined, "error"));
}

// ─── Warning Notice ─────────────────────────────────────────────

export function warningNotice(title: string, body?: string): void {
  const lines: string[] = [
    `${token.warning(sym.warn)} ${token.warningBold(title)}`,
  ];
  if (body) {
    lines.push("");
    lines.push(token.dim(body));
  }
  console.log("\n" + box(lines.join("\n"), undefined, "warning"));
}

// ─── AI Thinking — Multi-step Spinner ────────────────────────────

export interface ThinkingStep {
  message: string;
  durationMs?: number;
}

/**
 * Show a sequence of spinner messages while AI is working.
 * Returns a controller: { stop(finalMessage) }
 */
export function aiThinking(initialMessage: string): {
  update: (msg: string) => void;
  stop: (finalMessage?: string) => void;
} {
  const spinner = p.spinner();
  spinner.start(token.brand(initialMessage));

  return {
    update: (msg: string) => {
      spinner.message(token.brand(msg));
    },
    stop: (finalMessage?: string) => {
      if (finalMessage) {
        spinner.stop(token.success(`${sym.check} ${finalMessage}`));
      } else {
        spinner.stop();
      }
    },
  };
}

// ─── Command Intro ───────────────────────────────────────────────

/**
 * Rich intro for a command — gradient title + optional context line.
 */
export function intro(
  commandLabel: string,
  context?: { project?: string; week?: number; tagline?: string },
): void {
  const title = gradient(`LoopKit — ${commandLabel}`);
  p.intro(title);

  if (context?.project) {
    console.log(
      `${space.indent}${token.muted("project")}  ${token.brand(context.project)}${
        context.week ? `  ${token.dim(`week ${context.week}`)}` : ""
      }`,
    );
    console.log();
  }

  if (context?.tagline) {
    console.log(`${space.indent}${token.dim(context.tagline)}\n`);
  }
}

// ─── Command Outro ───────────────────────────────────────────────

/**
 * Clean outro with muted dimmed message.
 */
export function outro(message: string): void {
  p.outro(token.muted(message));
}

// ─── Week Summary Card ───────────────────────────────────────────

export interface WeekSummaryData {
  productName: string;
  weekNum: number;
  shippingScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  streak: number;
  streakHistory?: boolean[];
  loopkitScore?: number | null;
  mrr?: number | null;
  currency?: string;
  feedbackResponses?: number;
  highlight?: string;
  nextBet?: string;
}

/**
 * Rich weekly summary card — the culmination of a week's loop.
 */
export function weekSummaryCard(data: WeekSummaryData): string {
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: data.currency ?? "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `${data.currency ?? "USD"} ${n}`;
    }
  };

  const lines: string[] = [];

  // Header
  lines.push(
    `${sym.rocket} ${token.heading(`${data.productName}`)}  ${token.dim(`Week ${data.weekNum}`)}`,
  );
  lines.push("");

  // Task progress
  lines.push(progressBar(data.tasksCompleted, data.tasksTotal));
  lines.push("");

  // Core stats
  const pairs: Array<[string, string]> = [
    ["Shipped", `${data.shippingScore}%`],
  ];

  if (data.loopkitScore != null) {
    pairs.push(["Score", `${data.loopkitScore}/100`]);
  }

  if (data.streak >= 1) {
    const streakStr = `${data.streak} week${data.streak !== 1 ? "s" : ""}`;
    pairs.push(["Streak", data.streak >= 3 ? token.energy(`${sym.fire} ${streakStr}`) : token.success(streakStr)]);
  }

  if (data.feedbackResponses != null && data.feedbackResponses > 0) {
    pairs.push(["Feedback", `${data.feedbackResponses} response${data.feedbackResponses !== 1 ? "s" : ""}`]);
  }

  if (data.mrr != null && data.mrr > 0) {
    pairs.push(["MRR", token.success.bold(fmt(data.mrr))]);
  }

  lines.push(kvList(pairs, ""));

  // Streak history mini-timeline
  if (data.streakHistory && data.streakHistory.length > 0) {
    lines.push("");
    lines.push(
      `${token.dim("Last " + data.streakHistory.length + "w")}  ${streakMini(data.streakHistory)}`,
    );
  }

  // Highlight
  if (data.highlight) {
    lines.push("");
    lines.push(token.dim(`"${data.highlight}"`));
  }

  // Next week
  if (data.nextBet) {
    lines.push("");
    lines.push(`${token.muted("Next:")} ${token.body(data.nextBet)}`);
  }

  return box(lines.join("\n"), `${sym.loop} Loop`, "success");
}

// ─── Brief Card ─────────────────────────────────────────────────

export interface BriefCardData {
  productName: string;
  bet: string;
  uncomfortableTruth: string;
  validateAction: string;
  icpScore: number;
  icpNote: string;
  problemScore: number;
  problemNote: string;
  mvpScore: number;
  mvpNote: string;
  riskiestAssumption: string;
  mvpPlainEnglish: string;
}

/**
 * Structured brief output — replaces the raw box() call in init command.
 */
export function briefCard(data: BriefCardData): string {
  const lines: string[] = [];

  lines.push(token.errorBold("THE UNCOMFORTABLE TRUTH"));
  lines.push(data.uncomfortableTruth);
  lines.push("");

  lines.push(token.heading("THE BET"));
  lines.push(token.dim(`"${data.bet}"`));
  lines.push("");

  lines.push(token.accentBold("VALIDATE TONIGHT"));
  lines.push(data.validateAction);
  lines.push("");

  lines.push(divider("scores").slice(0, 40)); // inner divider
  lines.push("");

  const scores: Array<[string, string]> = [
    ["ICP",     scoreBar(data.icpScore)],
    ["Problem", scoreBar(data.problemScore)],
    ["MVP",     scoreBar(data.mvpScore)],
  ];

  for (const [label, bar] of scores) {
    lines.push(kvList([[label, bar]], ""));
  }

  lines.push("");
  lines.push(token.muted(data.icpNote));
  lines.push(token.muted(data.problemNote));
  lines.push(token.muted(data.mvpNote));
  lines.push("");

  lines.push(token.errorBold("RISKIEST ASSUMPTION"));
  lines.push(data.riskiestAssumption);
  lines.push("");

  lines.push(token.heading("MVP IN PLAIN ENGLISH"));
  lines.push(data.mvpPlainEnglish);

  return box(lines.join("\n"), data.productName);
}

// ─── Onboarding Step ─────────────────────────────────────────────

/**
 * Progress-aware intro line for multi-step onboarding.
 */
export function onboardingStep(
  step: number,
  total: number,
  title: string,
): string {
  const pct = Math.round((step / total) * 10);
  const bar =
    token.brand("▰".repeat(pct)) + token.dim("▱".repeat(10 - pct));
  return `${bar}  ${token.dim(`${step}/${total}`)}  ${token.heading(title)}`;
}

// ─── Shipping Ceremony ────────────────────────────────────────────

/**
 * "You shipped" celebration banner — shown after a successful ship.
 */
export function shipCelebration(productName: string, platform: string): string {
  const lines = [
    gradient(`  ${sym.rocket} SHIPPED — ${productName}  `),
    "",
    `${space.indent}${token.success(`${sym.check} Posted to`)} ${token.heading(platform)}`,
    `${space.indent}${token.dim("Keep the loop going — close your week Sunday.")}`,
  ];
  return "\n" + lines.join("\n") + "\n";
}
