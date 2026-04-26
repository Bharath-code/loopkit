import { readLastNLoopLogs, readLoopLog } from "../storage/local.js";

export interface ChurnRisk {
  level: "low" | "medium" | "high";
  signals: ChurnSignal[];
  suggestions: string[];
}

export interface ChurnSignal {
  type: "declining_score" | "skipped_loops" | "rising_overrides" | "low_velocity";
  severity: "warning" | "critical";
  message: string;
}

export function detectChurnRisk(): ChurnRisk | null {
  const logs = readLastNLoopLogs(8);
  if (logs.length < 3) return null;

  const signals: ChurnSignal[] = [];
  const suggestions: string[] = [];

  detectDecliningScore(logs, signals, suggestions);
  detectSkippedLoops(logs, signals, suggestions);
  detectRisingOverrides(logs, signals, suggestions);
  detectLowVelocity(logs, signals, suggestions);

  if (signals.length === 0) return null;

  const hasCritical = signals.some((s) => s.severity === "critical");
  const level: ChurnRisk["level"] = hasCritical ? "high" : signals.length >= 2 ? "medium" : "low";

  return { level, signals, suggestions };
}

function detectDecliningScore(
  logs: Array<{ weekNumber: number; overridden: boolean }>,
  signals: ChurnSignal[],
  suggestions: string[]
): void {
  const weeks: number[] = [];
  for (const log of logs) {
    const content = readLoopLog(log.weekNumber);
    if (!content) continue;
    const match = content.match(/- Shipping score:\s*(\d+)%/);
    if (match) weeks.push(parseInt(match[1]));
  }

  if (weeks.length < 3) return;

  const recent = weeks.slice(0, 3);
  const isDeclining = recent[0] < recent[1] && recent[1] < recent[2];
  if (isDeclining) {
    const drop = recent[2] - recent[0];
    signals.push({
      type: "declining_score",
      severity: drop >= 30 ? "critical" : "warning",
      message: `Shipping score dropped ${drop} points over 3 weeks (${recent[2]}% → ${recent[0]}%).`,
    });
    suggestions.push("Reduce scope: pick 1-2 tasks per week instead of 5+.");
    suggestions.push("Check for burnout — are you working on the right things?");
  }
}

function detectSkippedLoops(
  logs: Array<{ weekNumber: number; overridden: boolean }>,
  signals: ChurnSignal[],
  suggestions: string[]
): void {
  if (logs.length < 4) return;

  const sorted = [...logs].sort((a, b) => b.weekNumber - a.weekNumber);
  const currentWeek = sorted[0].weekNumber;
  const expectedWeeks = new Set<number>();
  for (let i = 0; i < 4; i++) {
    expectedWeeks.add(currentWeek - i);
  }

  const actualWeeks = new Set(sorted.map((l) => l.weekNumber));
  const skipped: number[] = [];
  for (const w of expectedWeeks) {
    if (!actualWeeks.has(w)) skipped.push(w);
  }

  if (skipped.length >= 2) {
    signals.push({
      type: "skipped_loops",
      severity: "critical",
      message: `Missed ${skipped.length} weekly loops (weeks ${skipped.join(", ")}). Consistency is the #1 predictor of success.`,
    });
    suggestions.push("Set a Sunday calendar reminder for your weekly loop.");
    suggestions.push("Even a 5-minute review counts — don't skip, just shorten.");
  } else if (skipped.length === 1) {
    signals.push({
      type: "skipped_loops",
      severity: "warning",
      message: `Missed 1 weekly loop recently. Don't let it become a pattern.`,
    });
    suggestions.push("Try running loopkit loop mid-week if Sunday doesn't work.");
  }
}

function detectRisingOverrides(
  logs: Array<{ weekNumber: number; overridden: boolean }>,
  signals: ChurnSignal[],
  suggestions: string[]
): void {
  if (logs.length < 4) return;

  const recent = logs.slice(0, 4);
  const overrideCount = recent.filter((l) => l.overridden).length;

  if (overrideCount >= 3) {
    signals.push({
      type: "rising_overrides",
      severity: "warning",
      message: `Overrode AI suggestions ${overrideCount}/4 weeks. The AI may need better context.`,
    });
    suggestions.push("Update your brief with `loopkit init --analyze` to improve suggestions.");
    suggestions.push("Add more detail about your current priorities to the brief.");
  }
}

function detectLowVelocity(
  logs: Array<{ weekNumber: number; overridden: boolean }>,
  signals: ChurnSignal[],
  suggestions: string[]
): void {
  const weeks: number[] = [];
  for (const log of logs) {
    const content = readLoopLog(log.weekNumber);
    if (!content) continue;
    const match = content.match(/- Tasks completed:\s*(\d+)/);
    if (match) weeks.push(parseInt(match[1]));
  }

  if (weeks.length < 3) return;

  const recent = weeks.slice(0, 3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  if (avg < 1) {
    signals.push({
      type: "low_velocity",
      severity: "critical",
      message: `Averaging less than 1 task per week. You may be stuck or overwhelmed.`,
    });
    suggestions.push("Try the 'unstuck me' mode: run loopkit loop and select generate micro-tasks.");
    suggestions.push("Break your next task into something you can do in 30 minutes.");
  } else if (avg < 2) {
    signals.push({
      type: "low_velocity",
      severity: "warning",
      message: `Averaging ${avg.toFixed(1)} tasks per week. Consider micro-tasks to build momentum.`,
    });
    suggestions.push("Aim for 3 small tasks per week instead of 1 big one.");
  }
}

export function renderChurnWarning(risk: ChurnRisk): string {
  const emoji = risk.level === "high" ? "🚨" : risk.level === "medium" ? "⚠️" : "📉";
  const lines = [`${emoji} Churn Guardian — ${risk.level.toUpperCase()} RISK`];
  lines.push("");
  for (const signal of risk.signals) {
    lines.push(`  ${signal.severity === "critical" ? "🔴" : "🟡"} ${signal.message}`);
  }
  lines.push("");
  lines.push("  Suggestions:");
  for (const s of risk.suggestions) {
    lines.push(`  → ${s}`);
  }
  return lines.join("\n");
}
