/**
 * Direct MRR save handler.
 * Triggered by `loopkit loop --revenue <amount>`. Bypasses the full
 * Sunday ritual to log revenue in 2 seconds.
 */

import { getWeekNumber } from "@loopkit/shared";
import {
  appendRevenueEntry,
  getLatestMRR,
  readRevenueHistory,
} from "../../storage/local.js";
import {
  ceremonyIntro,
  ceremonyOutro,
  clog,
  colors,
} from "../../ui/theme.js";

export async function handleRevenueFlag(amount: string | number): Promise<void> {
  const raw = String(amount);
  const parsed = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed) || parsed < 0) {
    clog.error(`Invalid amount: "${amount}". Use a number like --revenue 240`);
    process.exit(1);
  }

  const weekNum = getWeekNumber();
  const prev = getLatestMRR();
  const delta = prev !== null ? parsed - prev : null;

  appendRevenueEntry({
    date: new Date().toISOString().split("T")[0],
    weekNumber: weekNum,
    mrr: parsed,
    currency: "USD",
    source: "manual",
  });

  const history = readRevenueHistory();
  if (history.length === 1) {
    clog.success(`🎉 First revenue logged! MRR: $${parsed}`);
  } else {
    const deltaStr =
      delta !== null && delta !== 0
        ? delta > 0
          ? colors.success(` ↑+$${delta}`)
          : colors.danger(` ↓$${Math.abs(delta)}`)
        : "";
    clog.success(`MRR logged: $${parsed}${deltaStr}`);
  }

  ceremonyOutro("Revenue saved. Keep shipping. 🚀");
}
