/**
 * LoopKit CLI — Layout Primitives
 * Composable building blocks for terminal output.
 * All functions are pure: they take data and return formatted strings.
 */

import chalk from "chalk";
import {
  token,
  sym,
  space,
  type BoxVariant,
  boxColor,
  stripAnsi,
  stripAnsiStr,
  termWidth,
} from "./tokens.js";

// ─── Gradient ────────────────────────────────────────────────────

/**
 * Render text with a white→violet gradient (left to right).
 * Used for primary brand headers.
 */
export function gradient(text: string): string {
  const len = text.length;
  if (len === 0) return "";
  const chars = text.split("");
  return chars
    .map((ch, i) => {
      const t = len > 1 ? i / (len - 1) : 0;
      // Interpolate white (#FFFFFF) → violet (#7C3AED)
      const r = Math.round(0xff + (0x7c - 0xff) * t);
      const g = Math.round(0xff + (0x3a - 0xff) * t);
      const b = Math.round(0xff + (0xed - 0xff) * t);
      return chalk.hex(
        `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
      ).bold(ch);
    })
    .join("");
}

// ─── Divider ─────────────────────────────────────────────────────

/**
 * Full-width horizontal divider with optional centered label.
 * `divider()` → ──────────────────────
 * `divider("WEEK 12")` → ─── WEEK 12 ───────────
 */
export function divider(label?: string): string {
  const width = termWidth();
  if (!label) {
    return token.dim(sym.line.repeat(width));
  }
  const clean = stripAnsiStr(label);
  const remaining = Math.max(0, width - clean.length - 4);
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  return `${token.dim(sym.line.repeat(left))} ${label} ${token.dim(sym.line.repeat(right))}`;
}

// ─── Badge ───────────────────────────────────────────────────────

export type BadgeVariant = "brand" | "success" | "warning" | "error" | "info" | "muted";

const badgeColors: Record<BadgeVariant, chalk.Chalk> = {
  brand:   token.brand,
  success: token.success,
  warning: token.warning,
  error:   token.error,
  info:    token.info,
  muted:   token.muted,
};

/**
 * Inline pill badge.
 * `badge("SHIPPED", "success")` → emerald-colored text
 */
export function badge(text: string, variant: BadgeVariant = "brand"): string {
  return badgeColors[variant].bold(` ${text} `);
}

// ─── Key-Value ───────────────────────────────────────────────────

/**
 * Right-aligned key, left-aligned value with consistent column width.
 * `kv("MRR", "$240/mo")` → `       MRR  $240/mo`
 */
export function kv(
  key: string,
  value: string,
  keyWidth: number = 12,
): string {
  const padded = key.padStart(keyWidth);
  return `${token.label(padded)}  ${value}`;
}

/**
 * Render a list of key-value pairs with auto-aligned keys.
 */
export function kvList(
  pairs: Array<[string, string]>,
  indent: string = space.indent,
): string {
  const maxKey = Math.max(...pairs.map(([k]) => k.length));
  return pairs
    .map(([k, v]) => `${indent}${token.label(k.padStart(maxKey))}  ${v}`)
    .join("\n");
}

// ─── Table ───────────────────────────────────────────────────────

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "right";
  format?: (val: string) => string;
}

/**
 * Render a formatted table with header row and divider.
 */
export function table(
  rows: Record<string, string>[],
  columns: TableColumn[],
  indent: string = space.indent,
): string {
  if (rows.length === 0) return "";

  // Calculate column widths
  const widths = columns.map((col) => {
    const maxData = Math.max(...rows.map((r) => stripAnsi(r[col.key] ?? "")));
    return col.width ?? Math.max(col.header.length, maxData);
  });

  const renderRow = (cells: string[], bold = false): string => {
    const parts = cells.map((cell, i) => {
      const col = columns[i];
      const width = widths[i];
      const clean = stripAnsiStr(cell);
      const pad = Math.max(0, width - clean.length);
      const padded = col.align === "right" ? " ".repeat(pad) + cell : cell + " ".repeat(pad);
      return bold ? chalk.bold(padded) : padded;
    });
    return `${indent}${parts.join("  ")}`;
  };

  const header = renderRow(columns.map((c) => c.header), true);
  const separator = `${indent}${widths.map((w) => sym.line.repeat(w)).join("  ")}`;
  const dataRows = rows.map((row) =>
    renderRow(
      columns.map((col) => {
        const raw = row[col.key] ?? "";
        return col.format ? col.format(raw) : raw;
      }),
    ),
  );

  return [token.muted(header), token.muted(separator), ...dataRows].join("\n");
}

// ─── Tree ────────────────────────────────────────────────────────

export interface TreeNode {
  label: string;
  children?: TreeNode[];
}

/**
 * Render an indented tree structure.
 */
export function tree(nodes: TreeNode[], prefix = ""): string {
  const lines: string[] = [];
  nodes.forEach((node, i) => {
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└─ " : "├─ ";
    lines.push(`${prefix}${token.dim(connector)}${node.label}`);
    if (node.children?.length) {
      const childPrefix = prefix + (isLast ? "   " : `${token.dim(sym.v)}  `);
      lines.push(tree(node.children, childPrefix));
    }
  });
  return lines.join("\n");
}

// ─── Timeline / Progress Steps ───────────────────────────────────

export type StepStatus = "done" | "active" | "pending" | "error";

export interface TimelineStep {
  label: string;
  status: StepStatus;
  detail?: string;
}

const stepIcon: Record<StepStatus, string> = {
  done:    token.success(sym.check),
  active:  token.brand(sym.pointer),
  pending: token.muted(sym.dot),
  error:   token.error(sym.cross),
};

/**
 * Render a vertical step timeline (e.g., for onboarding or multi-step flow).
 */
export function timeline(steps: TimelineStep[]): string {
  return steps
    .map((step) => {
      const icon = stepIcon[step.status];
      const label =
        step.status === "done"
          ? token.muted(step.label)
          : step.status === "active"
            ? token.body(step.label)
            : token.dim(step.label);
      const detail = step.detail
        ? `\n${space.indent2}${token.dim(step.detail)}`
        : "";
      return `${space.indent}${icon} ${label}${detail}`;
    })
    .join("\n");
}

// ─── Score Bar ────────────────────────────────────────────────────

/**
 * Visual score bar with colored fill.
 * `scoreBar(7.5, 10)` → `████████░░ 7.5/10`
 */
export function scoreBar(score: number, max: number = 10): string {
  const filled = Math.round((score / max) * 10);
  const empty = 10 - filled;
  const color =
    score >= 8 ? token.success : score >= 6 ? token.warning : token.error;
  return `${color(sym.barFull.repeat(filled))}${token.dim(sym.barEmpty.repeat(empty))} ${color(`${score}/${max}`)}`;
}

/**
 * Percentage progress bar (wider, for task completion).
 * `progressBar(7, 10)` → `███████░░░░░ 7/10 (70%)`
 */
export function progressBar(
  value: number,
  total: number,
  width: number = 20,
): string {
  if (total === 0) return token.dim(`${"░".repeat(width)} 0/0`);
  const pct = Math.min(value / total, 1);
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const color = pct >= 0.8 ? token.success : pct >= 0.5 ? token.warning : token.error;
  const pctStr = `${Math.round(pct * 100)}%`;
  return `${color(sym.barFull.repeat(filled))}${token.dim(sym.barEmpty.repeat(empty))} ${token.muted(`${value}/${total}`)} ${color.bold(`(${pctStr})`)}`;
}

// ─── Box ─────────────────────────────────────────────────────────

/**
 * Render content inside a styled border box.
 * Supports variant coloring and optional title.
 */
export function box(
  content: string,
  title?: string,
  variant: BoxVariant = "default",
): string {
  const borderColor = boxColor[variant];
  const lines = content.split("\n");
  const width = termWidth();

  const titleLen = title ? stripAnsi(title) + 4 : 0;
  const maxContent = Math.max(...lines.map((l) => stripAnsi(l)));
  const innerWidth = Math.min(Math.max(maxContent, titleLen, 40), width - 2);

  let top: string;
  if (title) {
    const rightPad = Math.max(0, innerWidth - stripAnsi(title) - 2);
    top = `${borderColor(sym.tl + sym.h)} ${title} ${borderColor(sym.h.repeat(rightPad) + sym.tr)}`;
  } else {
    top = borderColor(`${sym.tl}${sym.h.repeat(innerWidth)}${sym.tr}`);
  }

  const bottom = borderColor(`${sym.bl}${sym.h.repeat(innerWidth)}${sym.br}`);

  const paddedLines = lines.map((line) => {
    const visLen = stripAnsi(line);
    const padding = Math.max(0, innerWidth - 2 - visLen);
    return `${borderColor(sym.v)} ${line}${" ".repeat(padding)} ${borderColor(sym.v)}`;
  });

  return [top, ...paddedLines, bottom].join("\n");
}

// ─── Section ─────────────────────────────────────────────────────

/**
 * A titled content section with consistent spacing.
 */
export function section(title: string, content: string): string {
  return `\n${token.heading(title)}\n${content}`;
}

// ─── Prose ───────────────────────────────────────────────────────

/**
 * Flow text that wraps at terminal width with proper indent.
 */
export function prose(text: string, indent: string = space.indent): string {
  const width = termWidth() - indent.length;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      if (line) lines.push(indent + line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(indent + line);
  return lines.join("\n");
}

// ─── Hint ────────────────────────────────────────────────────────

/**
 * Dimmed, indented inline hint text.
 */
export function hint(text: string): string {
  return `${space.indent2}${token.dim(text)}`;
}

// ─── Streak Mini Timeline ─────────────────────────────────────────

/**
 * Compact weekly streak visualization.
 * `streakMini([true, true, false, true])` → `● ● ○ ●`
 */
export function streakMini(weeks: boolean[]): string {
  return weeks
    .map((shipped) =>
      shipped ? token.success("●") : token.dim("○"),
    )
    .join(" ");
}
