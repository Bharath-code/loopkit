import chalk from "chalk";

// ─── Brand Colors ───────────────────────────────────────────────

export const colors = {
  primary: chalk.hex("#7C3AED"),     // violet-600
  secondary: chalk.hex("#06B6D4"),   // cyan-500
  success: chalk.hex("#10B981"),     // emerald-500
  warning: chalk.hex("#F59E0B"),     // amber-500
  danger: chalk.hex("#EF4444"),      // red-500
  muted: chalk.hex("#6B7280"),       // gray-500
  dim: chalk.dim,
  bold: chalk.bold,
  white: chalk.white,
};

// ─── Score Visualization ────────────────────────────────────────

export function scoreBar(score: number, max: number = 10): string {
  const filled = Math.round((score / max) * 10);
  const empty = 10 - filled;
  const color =
    score >= 8
      ? colors.success
      : score >= 6
        ? colors.warning
        : colors.danger;
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
  const maxLen = Math.max(...lines.map((l) => stripAnsi(l).length), title ? stripAnsi(title).length + 4 : 0);
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
    ""
  );
}

export function nextStep(command: string): string {
  return `\n${colors.muted("Next:")} ${colors.primary(`loopkit ${command}`)}\n`;
}

// ─── Keyboard Shortcuts Hint ────────────────────────────────────

export function shortcutsHint(): string {
  return colors.dim("  ? help · q quit · s skip · Enter confirm\n");
}

// ─── Empty State ────────────────────────────────────────────────

export function emptyState(message: string, action: string, command: string): string {
  return [
    colors.muted(`  ${message}`),
    colors.muted(`  ${action}:`),
    colors.primary(`  ${command}`),
    "",
  ].join("\n");
}
