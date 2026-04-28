import chalk from "chalk";

// ─── Brand Colors ───────────────────────────────────────────────

export const colors = {
  primary: chalk.hex("#7C3AED"), // violet-600
  secondary: chalk.hex("#06B6D4"), // cyan-500
  success: chalk.hex("#10B981"), // emerald-500
  warning: chalk.hex("#F59E0B"), // amber-500
  danger: chalk.hex("#EF4444"), // red-500
  muted: chalk.hex("#6B7280"), // gray-500
  pink: chalk.hex("#EC4899"), // pink-500
  orange: chalk.hex("#F97316"), // orange-500
  dim: chalk.dim,
  bold: chalk.bold,
  white: chalk.white,
};

// ─── Score Visualization ────────────────────────────────────────

export function scoreBar(score: number, max: number = 10): string {
  const filled = Math.round((score / max) * 10);
  const empty = 10 - filled;
  const color =
    score >= 8 ? colors.success : score >= 6 ? colors.warning : colors.danger;
  return `${color("█".repeat(filled))}${colors.dim("░".repeat(empty))} ${color(`${score}/${max}`)}`;
}

// ─── Section Headers ────────────────────────────────────────────

export function header(text: string): string {
  return `\n${colors.primary.bold(text)}\n`;
}

export function subheader(text: string): string {
  return colors.white.bold(text);
}

// ─── Status Indicators ──────────────────────────────────────────

export function pass(text: string): string {
  return `${colors.success("✓")} ${text}`;
}

export function fail(text: string): string {
  return `${colors.danger("✗")} ${text}`;
}

export function warn(text: string): string {
  return `${colors.warning("⚠")} ${text}`;
}

export function info(text: string): string {
  return `${colors.secondary("◆")} ${text}`;
}

// ─── Box Renderer ───────────────────────────────────────────────

export function box(content: string, title?: string): string {
  const lines = content.split("\n");
  const maxLen = Math.max(
    ...lines.map((l) => stripAnsi(l).length),
    title ? stripAnsi(title).length + 4 : 0,
  );
  const width = Math.min(maxLen + 4, 72);

  const top = title
    ? `┌─ ${colors.primary.bold(title)} ${"─".repeat(Math.max(0, width - stripAnsi(title).length - 5))}┐`
    : `┌${"─".repeat(width - 2)}┐`;
  const bottom = `└${"─".repeat(width - 2)}┘`;

  const paddedLines = lines.map((line) => {
    const visLen = stripAnsi(line).length;
    const padding = Math.max(0, width - 4 - visLen);
    return `│ ${line}${" ".repeat(padding)} │`;
  });

  return [top, ...paddedLines, bottom].join("\n");
}

// ─── Helpers ────────────────────────────────────────────────────

function stripAnsi(str: string): string {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );
}

export function nextStep(command: string, hint?: string): string {
  const note = hint ? ` ${colors.dim(`(${hint})`)}` : "";
  return `\n${colors.muted("Next:")} ${colors.primary(`loopkit ${command}`)}${note}\n`;
}

// ─── Keyboard Shortcuts Hint ────────────────────────────────────

export function shortcutsHint(): string {
  return colors.dim("  ? help · q quit · s skip · Enter confirm\n");
}

// ─── Empty State ────────────────────────────────────────────────

export function emptyState(
  message: string,
  action: string,
  command: string,
): string {
  return [
    colors.muted(`  ${message}`),
    colors.muted(`  ${action}:`),
    colors.primary(`  ${command}`),
    "",
  ].join("\n");
}

// ─── Coaching Card ──────────────────────────────────────────────

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
    warning: "⚠️",
    info: "💡",
  };

  const color =
    moment.priority === "critical"
      ? colors.danger
      : moment.priority === "warning"
        ? colors.warning
        : colors.secondary;

  const lines: string[] = [];
  lines.push(`${emojiMap[moment.priority]} ${color.bold(moment.title)}`);
  lines.push("");
  lines.push(moment.message);
  lines.push("");
  lines.push(`${colors.muted("→")} ${color.bold(moment.action)}`);
  if (moment.command) {
    lines.push(colors.dim(`   Run: ${moment.command}`));
  }

  return box(lines.join("\n"), `${emojiMap[moment.priority]} Coach`);
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
    return box(
      `${colors.success("✓")} No urgent coaching moments. You're on track.`,
      "💡 Coach",
    );
  }

  const lines: string[] = [];
  lines.push(
    colors.secondary.bold(`Coaching Plan — ${plan.totalWeeks} weeks tracked`),
  );
  lines.push("");

  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...plan.moments].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  for (const m of sorted) {
    lines.push(coachingCard(m).split("\n").slice(1, -1).join("\n"));
    lines.push("");
  }

  return box(lines.join("\n"), "💡 Coach");
}

// ─── Pattern Interrupt Card ─────────────────────────────────────

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
    overplanner: "📋",
    snooze_loop: "⏸",
    ship_avoider: "🚢",
    icp_drift: "🎯",
    scope_creep: "📈",
  };

  const lines: string[] = [];
  lines.push(
    colors.secondary.bold(`Pattern Interrupt — ${totalWeeks} weeks of data`),
  );
  lines.push("");

  for (const p of patterns) {
    const emoji = emojiMap[p.type] || "⚡";
    const label = p.type.replace(/_/g, " ").toUpperCase();
    const color = p.severity === "critical" ? colors.danger : colors.warning;

    lines.push(`${emoji} ${color.bold(label)} (${p.weeksObserved}w)`);
    lines.push(`   ${p.message}`);
    for (const s of p.suggestions) {
      lines.push(`   ${colors.muted("→")} ${s}`);
    }
    lines.push("");
  }

  return box(lines.join("\n"), "⚡ Pattern Interrupt");
}

// ─── Standup Card (GF-3) ────────────────────────────────────────

export function standupCard(data: {
  taskToday: string;
  openTasks: string[];
  standupStreak: number;
  loopkitScore?: number | null;
}): string {
  const lines: string[] = [];

  lines.push(colors.success.bold("✓ Standup logged"));
  lines.push("");
  lines.push(`${colors.white("Today's #1:")} ${data.taskToday}`);

  if (data.openTasks.length > 0) {
    lines.push("");
    lines.push(colors.white(`Open (${data.openTasks.length} tasks):`));
    // Show up to 4 open tasks to keep the card compact
    const preview = data.openTasks.slice(0, 4);
    for (const t of preview) {
      lines.push(`  ${colors.muted("○")} ${t}`);
    }
    if (data.openTasks.length > 4) {
      lines.push(colors.dim(`  … and ${data.openTasks.length - 4} more`));
    }
  }

  if (data.standupStreak >= 2) {
    lines.push("");
    lines.push(
      `${colors.warning("🔥 Standup streak:")} ${colors.warning.bold(`${data.standupStreak} days`)}`
    );
  }

  if (data.loopkitScore != null) {
    lines.push(
      `${colors.secondary("◆ LoopKit Score:")} ${colors.secondary.bold(`${data.loopkitScore}/100`)}`
    );
  }

  const streakLabel = data.standupStreak >= 1 ? `Day ${data.standupStreak}` : "Day 1";
  return box(lines.join("\n"), `📋 ${streakLabel}`);
}

// ─── Revenue Card (GF-4) ────────────────────────────────────────

export function revenueCard(data: {
  mrr: number;
  delta: number | null;
  currency: string;
  entriesLogged: number;
}): string {
  const lines: string[] = [];

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

  lines.push(`${colors.white("MRR:")} ${colors.success.bold(fmt(data.mrr))}`);
  lines.push(`${colors.white("ARR:")} ${colors.secondary(fmt(data.mrr * 12))}`);

  if (data.delta !== null) {
    const deltaFormatted = fmt(Math.abs(data.delta));
    const deltaStr =
      data.delta > 0
        ? colors.success(`↑ +${deltaFormatted} this entry`)
        : data.delta < 0
          ? colors.danger(`↓ -${deltaFormatted} this entry`)
          : colors.muted("→ No change");
    lines.push(`${colors.white("Change:")} ${deltaStr}`);
  }

  lines.push(colors.dim(`${data.entriesLogged} revenue entr${data.entriesLogged === 1 ? "y" : "ies"} logged`));

  return box(lines.join("\n"), "💰 Revenue");
}

