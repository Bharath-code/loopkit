/**
 * loopkit revenue — GF-4
 *
 * Track MRR milestones. Makes LoopKit the single source of truth
 * from idea to first dollar. The revenue history is the ultimate
 * switching-cost feature — you don't leave a tool that holds your MRR journey.
 */

import * as p from "@clack/prompts";
import { getWeekNumber, formatDate, type RevenueEntry } from "@loopkit/shared";
import {
  readConfig,
  appendRevenueEntry,
  readRevenueHistory,
  getLatestMRR,
} from "../storage/local.js";
import { colors, header, box, pass, info } from "../ui/theme.js";

// ─── Command ────────────────────────────────────────────────────

export interface RevenueOptions {
  /** Direct MRR amount from flag: loopkit revenue --add 240 */
  add?: string;
  /** Show revenue history log */
  log?: boolean;
}

export async function revenueCommand(options?: RevenueOptions): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (!slug) {
    console.log(colors.danger("No active project. Run `loopkit init` first."));
    process.exit(1);
  }

  p.intro(colors.primary.bold("LoopKit — Revenue Tracker"));

  // ── Show log ─────────────────────────────────────────────────
  if (options?.log) {
    renderRevenueHistory();
    p.outro(colors.muted("Revenue log complete."));
    return;
  }

  // ── --add flag: loopkit revenue --add 240 ────────────────────
  if (options?.add !== undefined) {
    const parsed = parseAmountInput(options.add);
    if (parsed === null) {
      console.log(colors.danger(`Invalid amount: "${options.add}". Use a number like --add 240`));
      process.exit(1);
    }
    await saveRevenueEntry(parsed, slug);
    p.outro(colors.success.bold("Revenue logged. Keep shipping. 🚀"));
    return;
  }

  // ── Interactive mode ──────────────────────────────────────────
  const latest = getLatestMRR();
  if (latest !== null) {
    console.log(info(`Current MRR: ${colors.success.bold(formatCurrency(latest, "USD"))}`));
  }

  const amountStr = await p.text({
    message: "New MRR? (monthly recurring revenue in USD)",
    placeholder: latest !== null ? `Previous: ${latest}` : "e.g. 240",
    validate: (val) => {
      if (!val.trim()) return "Please enter an amount.";
      if (parseAmountInput(val) === null) return "Enter a number like 240 or 1500.";
    },
  });

  if (p.isCancel(amountStr)) {
    p.outro(colors.muted("Cancelled."));
    return;
  }

  const mrr = parseAmountInput(amountStr as string)!;

  // Optional fields
  const source = await p.select({
    message: "Revenue source:",
    options: [
      { value: "stripe", label: "Stripe" },
      { value: "lemon_squeezy", label: "Lemon Squeezy" },
      { value: "gumroad", label: "Gumroad" },
      { value: "manual", label: "Manual / Invoice" },
      { value: "other", label: "Other" },
    ],
  });

  if (p.isCancel(source)) {
    p.outro(colors.muted("Cancelled."));
    return;
  }

  const noteRaw = await p.text({
    message: "Note? (optional)",
    placeholder: "e.g. First paying customer!",
  });

  if (p.isCancel(noteRaw)) {
    p.outro(colors.muted("Cancelled."));
    return;
  }

  const note = (noteRaw as string).trim() || undefined;

  await saveRevenueEntry(mrr, slug, {
    source: source as RevenueEntry["source"],
    note,
  });

  p.outro(colors.success.bold("Revenue logged. Keep shipping. 🚀"));
}

// ─── Internal helpers ─────────────────────────────────────────────

async function saveRevenueEntry(
  mrr: number,
  _slug: string,
  extras?: { source?: RevenueEntry["source"]; note?: string; customer?: string },
): Promise<void> {
  const weekNum = getWeekNumber();
  const today = formatDate();

  const entry: RevenueEntry = {
    date: today,
    weekNumber: weekNum,
    mrr,
    currency: "USD",
    ...extras,
  };

  appendRevenueEntry(entry);

  // ── Show the result ──────────────────────────────────────────
  const history = readRevenueHistory();
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const delta = prev ? mrr - prev.mrr : null;

  const cardLines: string[] = [];

  if (history.length === 1) {
    cardLines.push(colors.success.bold("🎉 First revenue logged!"));
    cardLines.push("");
    cardLines.push(`  ${colors.white("MRR:")} ${colors.success.bold(formatCurrency(mrr, "USD"))}`);
    cardLines.push(colors.dim("  You're making money. This is what matters."));
  } else {
    cardLines.push(colors.white.bold("Revenue updated"));
    cardLines.push("");
    cardLines.push(`  ${colors.white("MRR:")} ${colors.success.bold(formatCurrency(mrr, "USD"))}`);
    if (delta !== null) {
      const deltaFormatted = formatCurrency(Math.abs(delta), "USD");
      const deltaStr =
        delta > 0
          ? colors.success(`↑ +${deltaFormatted} vs last entry`)
          : delta < 0
            ? colors.danger(`↓ -${deltaFormatted} vs last entry`)
            : colors.muted("→ Same as last entry");
      cardLines.push(`  ${colors.white("Change:")} ${deltaStr}`);
    }
    const annualised = formatCurrency(mrr * 12, "USD");
    cardLines.push(`  ${colors.white("ARR (projected):")} ${colors.secondary(annualised)}`);
  }

  if (extras?.note) {
    cardLines.push("");
    cardLines.push(colors.dim(`  "${extras.note}"`));
  }

  console.log(box(cardLines.join("\n"), `💰 Week ${weekNum}`));
  console.log(pass(`Saved to .loopkit/revenue.json`));
}

function renderRevenueHistory(): void {
  const history = readRevenueHistory();

  if (history.length === 0) {
    console.log(colors.muted("  No revenue logged yet."));
    console.log(info("Log your first MRR: loopkit revenue --add 240"));
    return;
  }

  console.log(header("Revenue History"));

  for (const entry of history) {
    const delta =
      history.indexOf(entry) > 0
        ? entry.mrr - history[history.indexOf(entry) - 1].mrr
        : null;
    const deltaStr =
      delta === null
        ? ""
        : delta > 0
          ? colors.success(` ↑+${formatCurrency(delta, entry.currency)}`)
          : delta < 0
            ? colors.danger(` ↓${formatCurrency(delta, entry.currency)}`)
            : colors.muted(" →");

    const sourceBadge = entry.source ? colors.dim(` [${entry.source}]`) : "";
    const note = entry.note ? colors.dim(` "${entry.note}"`) : "";

    console.log(
      `  ${colors.muted(entry.date)} ${colors.white.bold(formatCurrency(entry.mrr, entry.currency))}${deltaStr}${sourceBadge}${note}`
    );
  }

  const latest = history[history.length - 1];
  console.log("\n" + box(
    [
      `${colors.white("Latest MRR:")} ${colors.success.bold(formatCurrency(latest.mrr, latest.currency))}`,
      `${colors.white("ARR:")} ${colors.secondary(formatCurrency(latest.mrr * 12, latest.currency))}`,
      `${colors.white("Entries logged:")} ${history.length}`,
    ].join("\n"),
    "💰 Revenue Summary",
  ));
}

function parseAmountInput(input: string): number | null {
  // Strip currency symbols and whitespace, then parse
  const cleaned = input.replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  if (Number.isNaN(val) || val < 0) return null;
  return Math.round(val * 100) / 100; // Round to 2 decimal places
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
