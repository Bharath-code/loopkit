/**
 * LoopKit CLI — Prompt Utilities
 * Thin wrappers around @clack/prompts with:
 *   - Consistent Ctrl+C / cancel handling
 *   - Inline hint support
 *   - Progress-aware multi-step tracking
 *   - Destructive confirmation theming
 */

import * as p from "@clack/prompts";
import { token, sym, space } from "./tokens.js";
import { hint as hintText } from "./layout.js";

// ─── Cancel Guard ────────────────────────────────────────────────

/**
 * Check if a prompt result is a cancel sentinel.
 * If cancelled, optionally save state and print a resume message.
 *
 * @returns The value if not cancelled, or exits the process.
 */
export function requireInput<T>(
  result: T | symbol,
  opts?: {
    onCancel?: () => void;
    cancelMessage?: string;
  },
): T {
  if (p.isCancel(result)) {
    if (opts?.onCancel) {
      opts.onCancel();
    }
    p.cancel(
      opts?.cancelMessage
        ? token.muted(opts.cancelMessage)
        : token.muted("Cancelled."),
    );
    process.exit(0);
  }
  return result as T;
}

// ─── Keyboard Shortcuts Hint ─────────────────────────────────────

export function shortcutsHint(): string {
  return token.dim(
    `${space.indent}${sym.info} Ctrl+C to pause and save · Enter to confirm\n`,
  );
}

// ─── Hinted Text Prompt ──────────────────────────────────────────

export interface HintedTextOptions {
  message: string;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  validate?: (value: string) => string | undefined;
}

/**
 * Text prompt with an optional dim hint printed below the question label.
 */
export async function hintedText(opts: HintedTextOptions): Promise<string> {
  if (opts.hint) {
    console.log(hintText(opts.hint));
  }
  const result = await p.text({
    message: opts.message,
    placeholder: opts.placeholder,
    defaultValue: opts.defaultValue,
    validate: opts.validate,
  });
  return requireInput(result);
}

// ─── Multi-Step Progress Prompt ──────────────────────────────────

export interface SteppedTextOptions extends HintedTextOptions {
  step: number;
  total: number;
}

/**
 * Text prompt that shows [step/total] progress in the message.
 */
export async function steppedText(opts: SteppedTextOptions): Promise<string> {
  const stepLabel = token.dim(`[${opts.step}/${opts.total}]`);
  const message = `${stepLabel} ${opts.message}`;

  if (opts.hint) {
    console.log(hintText(opts.hint));
  }

  const result = await p.text({
    message,
    placeholder: opts.placeholder,
    defaultValue: opts.defaultValue,
    validate: opts.validate,
  });
  return requireInput(result);
}

// ─── Destructive Confirm ─────────────────────────────────────────

/**
 * Red-themed confirmation for destructive actions.
 * The message is prefixed with a warning icon and colored.
 */
export async function destructiveConfirm(
  message: string,
  label?: string,
): Promise<boolean> {
  const warningLabel = label
    ? `${token.error(`${sym.warn} ${label}`)}\n  ${token.dim(message)}`
    : `${token.error(sym.warn)} ${message}`;

  const result = await p.confirm({ message: warningLabel });
  if (p.isCancel(result)) {
    p.cancel(token.muted("Cancelled."));
    process.exit(0);
  }
  return result;
}

// ─── Confirm (safe) ──────────────────────────────────────────────

/**
 * Standard confirm that exits cleanly on Ctrl+C.
 */
export async function confirm(
  message: string,
  initialValue?: boolean,
): Promise<boolean> {
  const result = await p.confirm({ message, initialValue });
  return requireInput(result);
}

// ─── Select (safe) ───────────────────────────────────────────────

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Select prompt that exits cleanly on Ctrl+C.
 */
export async function select<T extends string>(
  message: string,
  options: SelectOption<T>[],
): Promise<T> {
  const result = await p.select({ message, options: options as any });
  return requireInput(result) as T;
}

// ─── Group Prompt ────────────────────────────────────────────────

/**
 * Run a group of prompts under a named section header.
 * Prints a dim section divider before the prompts.
 */
export async function section<T>(
  title: string,
  runner: () => Promise<T>,
): Promise<T> {
  console.log(`\n${token.label(title)}`);
  console.log(token.dim("  " + "─".repeat(title.length + 2)));
  return runner();
}

// ─── Pause / Save Hint ────────────────────────────────────────────

/**
 * Print a resume hint after a Ctrl+C pause save.
 */
export function pauseHint(command: string): void {
  console.log(
    `\n${token.muted("Session paused.")} ${token.dim("Resume with:")} ${token.code(`loopkit ${command}`)}\n`,
  );
}
