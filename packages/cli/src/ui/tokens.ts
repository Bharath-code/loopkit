/**
 * LoopKit CLI — Design Tokens
 * Single source of truth for all visual primitives.
 * No raw chalk calls outside this file — everything flows through semantic tokens.
 */

import chalk from "chalk";

// ─── Brand Palette ───────────────────────────────────────────────

export const palette = {
  violet:  chalk.hex("#7C3AED"),   // brand primary
  cyan:    chalk.hex("#06B6D4"),   // accent / secondary
  emerald: chalk.hex("#10B981"),   // success
  amber:   chalk.hex("#F59E0B"),   // warning
  red:     chalk.hex("#EF4444"),   // error / danger
  gray:    chalk.hex("#6B7280"),   // muted
  pink:    chalk.hex("#EC4899"),   // celebration
  orange:  chalk.hex("#F97316"),   // streak / energy
  white:   chalk.white,
  dim:     chalk.dim,
  bold:    chalk.bold,
} as const;

// ─── Semantic Color Tokens ───────────────────────────────────────

export const token = {
  // Brand
  brand:      palette.violet,
  brandBold:  palette.violet.bold,

  // Accent
  accent:     palette.cyan,
  accentBold: palette.cyan.bold,

  // States
  success:    palette.emerald,
  warning:    palette.amber,
  error:      palette.red,
  info:       palette.cyan,

  // Bold states
  successBold: palette.emerald.bold,
  warningBold: palette.amber.bold,
  errorBold:   palette.red.bold,

  // Text hierarchy
  heading:    chalk.white.bold,
  body:       chalk.white,
  label:      palette.gray.bold,
  muted:      palette.gray,
  dim:        chalk.dim,
  code:       chalk.hex("#A5B4FC"),  // soft lavender for inline code

  // Celebration
  celebrate:  palette.pink,
  energy:     palette.orange,
} as const;

// ─── Symbol Set ──────────────────────────────────────────────────

export const sym = {
  // Status
  check:    "✓",
  cross:    "✗",
  warn:     "⚠",
  info:     "◆",
  dot:      "•",
  arrow:    "›",
  arrowDbl: "»",
  pointer:  "❯",

  // Progress
  barFull:   "█",
  barEmpty:  "░",
  barHalf:   "▓",

  // Box drawing — single
  tl: "┌", tr: "┐",
  bl: "└", br: "┘",
  h:  "─", v:  "│",
  lt: "├", rt: "┤",
  tt: "┬", bt: "┴",
  cx: "┼",

  // Decorative
  line:    "─",
  thick:   "━",
  dotLine: "·",

  // Celebration
  star:     "★",
  rocket:   "🚀",
  fire:     "🔥",
  confetti: "🎉",
  gem:      "💎",
  chart:    "📊",
  money:    "💰",
  loop:     "∞",
} as const;

// ─── Spacing ─────────────────────────────────────────────────────

export const space = {
  none:    "",
  xs:      " ",
  sm:      "\n",
  md:      "\n\n",
  lg:      "\n\n\n",
  indent:  "  ",
  indent2: "    ",
  indent3: "      ",
} as const;

// ─── Typography Scale ─────────────────────────────────────────────

export const type = {
  /** Full-width branded title — violet bold */
  h1: (text: string) => token.brandBold(text),

  /** Section header — white bold */
  h2: (text: string) => token.heading(text),

  /** Subsection label — gray bold */
  h3: (text: string) => token.label(text),

  /** Regular body text */
  body: (text: string) => token.body(text),

  /** Dimmed secondary text */
  muted: (text: string) => token.muted(text),

  /** De-emphasized hint / metadata */
  dim: (text: string) => token.dim(text),

  /** Inline code / command reference — soft lavender */
  code: (text: string) => token.code(text),
} as const;

// ─── Box Variants ─────────────────────────────────────────────────

export type BoxVariant = "default" | "success" | "warning" | "error" | "info";

export const boxColor: Record<BoxVariant, chalk.Chalk> = {
  default: palette.violet,
  success: palette.emerald,
  warning: palette.amber,
  error:   palette.red,
  info:    palette.cyan,
};

// ─── Terminal Helpers ────────────────────────────────────────────

/** Strip ANSI escape codes to get true visible length */
export function stripAnsi(str: string): number {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  ).length;
}

/** Strip ANSI and return the clean string (for length math) */
export function stripAnsiStr(str: string): string {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );
}

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/** Get usable terminal width, capped at 80 cols for readability */
export function termWidth(): number {
  return clamp((process.stdout.columns ?? 80) - 4, 60, 80);
}
