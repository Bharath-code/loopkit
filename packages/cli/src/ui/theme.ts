/**
 * LoopKit CLI — Theme (Upgraded)
 *
 * This file is the primary public surface for all UI utilities.
 * It re-exports everything from the design system modules so commands
 * only need to import from one place:
 *
 *   import { colors, box, header, ... } from "../ui/theme.js";
 *
 * All new code should prefer importing directly from:
 *   - ui/tokens.ts    — colors, symbols, spacing, typography
 *   - ui/layout.ts    — box, table, kv, badge, divider, gradient, ...
 *   - ui/ceremony.ts  — success, error, aiThinking, weekSummaryCard, ...
 *   - ui/prompts.ts   — requireInput, steppedText, confirm, select, ...
 */

import {
  token,
  sym,
  space,
  type,
  palette,
  stripAnsi,
  termWidth,
  type BoxVariant,
} from "./tokens.js";

import {
  box as layoutBox,
  gradient,
  divider,
  badge,
  kv,
  kvList,
  table,
  tree,
  timeline,
  scoreBar,
  progressBar,
  section,
  prose,
  hint,
  streakMini,
} from "./layout.js";

// ─── Re-exports ──────────────────────────────────────────────────

export { token, sym, space, type, palette, stripAnsi, termWidth };
export type { BoxVariant };

export {
  gradient,
  divider,
  badge,
  kv,
  kvList,
  table,
  tree,
  timeline,
  scoreBar,
  progressBar,
  section,
  prose,
  hint,
  streakMini,
};

export type { TableColumn, TreeNode, TimelineStep, StepStatus } from "./layout.js";

export {
  aiThinking,
  weekSummaryCard,
  briefCard,
  onboardingStep,
  shipCelebration,
} from "./ceremony.js";

export {
  requireInput,
  shortcutsHint,
  hintedText,
  steppedText,
  destructiveConfirm,
  pauseHint,
} from "./prompts.js";

// ─── Backwards-compatible `colors` object ────────────────────────
// Kept for all existing commands. Do not add new usages — use `token`.

export const colors = {
  primary:   token.brand,
  secondary: token.accent,
  success:   token.success,
  warning:   token.warning,
  danger:    token.error,
  muted:     token.muted,
  pink:      token.celebrate,
  orange:    token.energy,
  dim:       token.dim,
  bold:      token.heading,
  white:     token.body,
} as const;

// ─── Layout: backwards-compatible box ────────────────────────────

/** Box with optional title and variant coloring */
export function box(
  content: string,
  title?: string,
  variant: BoxVariant = "default",
): string {
  return layoutBox(content, title, variant);
}

// ─── Section Headers ─────────────────────────────────────────────

/** Level-1 header — violet bold with leading newline */
export function header(text: string): string {
  return `\n${token.brandBold(text)}\n`;
}

/** Level-2 header — white bold */
export function subheader(text: string): string {
  return token.heading(text);
}

// ─── Status Indicators ───────────────────────────────────────────

export function pass(text: string): string {
  return `${token.success(sym.check)} ${text}`;
}

export function fail(text: string): string {
  return `${token.error(sym.cross)} ${text}`;
}

export function warn(text: string): string {
  return `${token.warning(sym.warn)} ${text}`;
}

export function info(text: string): string {
  return `${token.accent(sym.info)} ${text}`;
}

// ─── Navigation Hints ────────────────────────────────────────────

export function nextStep(command: string, hint?: string): string {
  const note = hint ? ` ${token.dim(`(${hint})`)}` : "";
  return `\n${token.muted("Next:")} ${token.code(`loopkit ${command}`)}${note}\n`;
}

export function emptyState(
  message: string,
  action: string,
  command: string,
): string {
  return [
    token.muted(`  ${message}`),
    token.muted(`  ${action}:`),
    token.code(`  ${command}`),
    "",
  ].join("\n");
}

// ─── Coaching Cards ───────────────────────────────────────────────

export function coachingCard(moment: {
  id: string;
  priority: "critical" | "warning" | "info";
  title: string;
  message: string;
  action: string;
  command?: string;
}): string {
  const emojiMap: Record<string, string> = {
    critical: "🚨",
    warning:  "⚠️",
    info:     "💡",
  };

  const colorFn =
    moment.priority === "critical"
      ? token.errorBold
      : moment.priority === "warning"
        ? token.warningBold
        : token.accentBold;

  const variant: BoxVariant =
    moment.priority === "critical" ? "error"
    : moment.priority === "warning" ? "warning"
    : "info";

  const lines: string[] = [];
  lines.push(`${emojiMap[moment.priority]} ${colorFn(moment.title)}`);
  lines.push("");
  lines.push(moment.message);
  lines.push("");
  lines.push(`${token.muted("→")} ${colorFn(moment.action)}`);
  if (moment.command) {
    lines.push(token.dim(`   Run: ${moment.command}`));
  }

  return layoutBox(lines.join("\n"), `${emojiMap[moment.priority]} Coach`, variant);
}

export function coachingPlanCard(plan: {
  moments: Array<{
    id: string;
    priority: "critical" | "warning" | "info";
    title: string;
    message: string;
    action: string;
    command?: string;
  }>;
  totalWeeks: number;
}): string {
  if (plan.moments.length === 0) {
    return layoutBox(
      `${token.success("✓")} No urgent coaching moments. You're on track.`,
      "💡 Coach",
      "success",
    );
  }

  const lines: string[] = [];
  lines.push(token.accentBold(`Coaching Plan — ${plan.totalWeeks} weeks tracked`));
  lines.push("");

  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...plan.moments].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  for (const m of sorted) {
    lines.push(coachingCard(m).split("\n").slice(1, -1).join("\n"));
    lines.push("");
  }

  return layoutBox(lines.join("\n"), "💡 Coach", "info");
}

export function patternCard(
  patterns: Array<{
    type: string;
    severity: "warning" | "critical";
    message: string;
    suggestions: string[];
    weeksObserved: number;
  }>,
  totalWeeks: number,
): string {
  const emojiMap: Record<string, string> = {
    overplanner:  "📋",
    snooze_loop:  "⏸",
    ship_avoider: "🚢",
    icp_drift:    "🎯",
    scope_creep:  "📈",
  };

  const lines: string[] = [];
  lines.push(token.accentBold(`Pattern Interrupt — ${totalWeeks} weeks of data`));
  lines.push("");

  for (const pt of patterns) {
    const emoji = emojiMap[pt.type] || "⚡";
    const label = pt.type.replace(/_/g, " ").toUpperCase();
    const colorFn = pt.severity === "critical" ? token.errorBold : token.warningBold;

    lines.push(`${emoji} ${colorFn(label)} (${pt.weeksObserved}w)`);
    lines.push(`   ${pt.message}`);
    for (const s of pt.suggestions) {
      lines.push(`   ${token.muted("→")} ${s}`);
    }
    lines.push("");
  }

  const variant: BoxVariant = patterns.some((p) => p.severity === "critical")
    ? "error" : "warning";

  return layoutBox(lines.join("\n"), "⚡ Pattern Interrupt", variant);
}

export function standupCard(data: {
  taskToday: string;
  openTasks: string[];
  standupStreak: number;
  loopkitScore?: number | null;
}): string {
  const lines: string[] = [];

  lines.push(token.successBold("✓ Standup logged"));
  lines.push("");
  lines.push(`${token.label("Today's #1:")} ${data.taskToday}`);

  if (data.openTasks.length > 0) {
    lines.push("");
    lines.push(token.body(`Open (${data.openTasks.length} tasks):`));
    const preview = data.openTasks.slice(0, 4);
    for (const t of preview) {
      lines.push(`  ${token.muted("○")} ${t}`);
    }
    if (data.openTasks.length > 4) {
      lines.push(token.dim(`  … and ${data.openTasks.length - 4} more`));
    }
  }

  if (data.standupStreak >= 2) {
    lines.push("");
    lines.push(
      `${token.energy("🔥 Standup streak:")} ${token.energy.bold(`${data.standupStreak} days`)}`,
    );
  }

  if (data.loopkitScore != null) {
    lines.push(
      `${token.accent("◆ LoopKit Score:")} ${token.accentBold(`${data.loopkitScore}/100`)}`,
    );
  }

  const streakLabel = data.standupStreak >= 1 ? `Day ${data.standupStreak}` : "Day 1";
  return layoutBox(lines.join("\n"), `📋 ${streakLabel}`, "info");
}

export function revenueCard(data: {
  mrr: number;
  delta: number | null;
  currency: string;
  entriesLogged: number;
}): string {
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: data.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `${data.currency} ${n}`;
    }
  };

  const lines: string[] = [];
  lines.push(`${token.label("MRR:")} ${token.successBold(fmt(data.mrr))}`);
  lines.push(`${token.label("ARR:")} ${token.accent(fmt(data.mrr * 12))}`);

  if (data.delta !== null) {
    const deltaFormatted = fmt(Math.abs(data.delta));
    const deltaStr =
      data.delta > 0
        ? token.success(`↑ +${deltaFormatted} this entry`)
        : data.delta < 0
          ? token.error(`↓ -${deltaFormatted} this entry`)
          : token.muted("→ No change");
    lines.push(`${token.label("Change:")} ${deltaStr}`);
  }

  lines.push(
    token.dim(
      `${data.entriesLogged} revenue entr${data.entriesLogged === 1 ? "y" : "ies"} logged`,
    ),
  );

  return layoutBox(lines.join("\n"), "💰 Revenue", "success");
}
