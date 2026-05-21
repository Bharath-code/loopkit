import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getWeekNumber, formatDate, type TelemetryEvent, type TelemetryExport, type TelemetryBrief, TelemetryBriefSchema } from "@loopkit/shared";
import { getRoot, readConfig, writeConfig } from "../storage/local.js";
import { colors, info, pass, fail, confirm, isCancel, clog } from "../ui/theme.js";

const TELEMETRY_DIR = "telemetry";
const BRIEF_AGGREGATES_FILE = "brief-aggregates.json";
const MAX_AGGREGATE_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const MAX_AGGREGATES_BEFORE_COMPACTION = 1000;

function getTelemetryDir(): string {
  return path.join(getRoot(), TELEMETRY_DIR);
}

function getEventsPath(weekNum: number): string {
  return path.join(getTelemetryDir(), `week-${weekNum}.json`);
}

function ensureTelemetryDir(): void {
  const dir = getTelemetryDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readEvents(weekNum: number): TelemetryEvent[] {
  const filePath = getEventsPath(weekNum);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TelemetryEvent[];
  } catch {
    return [];
  }
}

function appendEvent(event: TelemetryEvent): void {
  ensureTelemetryDir();
  const weekNum = getWeekNumber(new Date(event.timestamp));
  const events = readEvents(weekNum);
  events.push(event);
  fs.writeFileSync(getEventsPath(weekNum), JSON.stringify(events, null, 2));
}

function readAllEvents(): TelemetryEvent[] {
  const dir = getTelemetryDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /^week-\d+\.json$/.test(f));
  const all: TelemetryEvent[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as TelemetryEvent[];
      all.push(...data);
    } catch {
      // skip corrupt files
    }
  }
  return all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function deleteAllEvents(): void {
  const dir = getTelemetryDir();
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function exportTelemetry(): TelemetryExport {
  const config = readConfig();
  const events = readAllEvents();
  const weeks = new Set<number>();
  for (const e of events) {
    if (e.weekNumber) weeks.add(e.weekNumber);
  }
  return {
    exportedAt: new Date().toISOString(),
    distinctId: config.distinctId || "unknown",
    weekCount: weeks.size,
    events,
  };
}

export function exportTelemetryToFile(filePath?: string, data?: TelemetryExport): string {
  const exportData = data || exportTelemetry();
  const outPath = filePath || path.join(process.cwd(), `loopkit-telemetry-${formatDate()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));
  return outPath;
}

export function deleteTelemetry(): void {
  deleteAllEvents();
  const config = readConfig();
  config.telemetry = { optedIn: false, prompted: true };
  writeConfig(config);
}

export async function startTelemetryPrompt(): Promise<void> {
  const config = readConfig();

  if (!config.telemetry) {
    config.telemetry = { optedIn: false, prompted: false };
    writeConfig(config);
  }

  if (config.telemetry.prompted) return;

  const weekNum = getWeekNumber();

  if (config.telemetry.promptWeek && config.telemetry.promptWeek === weekNum) return;

  clog.step("📊 Help make LoopKit better");
  clog.message("We collect anonymous usage data to improve features and show benchmarks.");
  clog.message("Everything is local by default. Nothing leaves your machine unless you opt in.");

  const optIn = await confirm({
    message: "Opt into anonymous usage telemetry?",
  });

  if (isCancel(optIn)) {
    config.telemetry.prompted = true;
    config.telemetry.promptWeek = weekNum;
    writeConfig(config);
    return;
  }

  config.telemetry.optedIn = optIn;
  config.telemetry.prompted = true;
  config.telemetry.promptWeek = weekNum;
  writeConfig(config);

  if (optIn) {
    clog.success("Telemetry enabled. Thank you!");
    clog.message("  Run `loopkit telemetry export` to review data, `loopkit telemetry delete` to remove.");
  } else {
    clog.info("Telemetry disabled. You can enable it later with `loopkit telemetry on`.");
  }
}

export function isTelemetryEnabled(): boolean {
  const config = readConfig();
  return config.telemetry?.optedIn === true;
}

function getBriefAggregatesPath(): string {
  return path.join(getRoot(), BRIEF_AGGREGATES_FILE);
}

function readBriefAggregates(): TelemetryBrief[] {
  const filePath = getBriefAggregatesPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const parsed = TelemetryBriefSchema.array().parse(raw);
    return compactAggregates(parsed);
  } catch {
    return [];
  }
}

function compactAggregates(aggregates: TelemetryBrief[]): TelemetryBrief[] {
  const now = Date.now();
  const cutoff = now - MAX_AGGREGATE_AGE_MS;
  let filtered = aggregates.filter((a) => {
    const ts = new Date(a.timestamp).getTime();
    return ts >= cutoff;
  });

  if (filtered.length > MAX_AGGREGATES_BEFORE_COMPACTION) {
    filtered = filtered.slice(-MAX_AGGREGATES_BEFORE_COMPACTION);
  }

  if (filtered.length !== aggregates.length) {
    fs.writeFileSync(getBriefAggregatesPath(), JSON.stringify(filtered, null, 2));
  }

  return filtered;
}

function appendBriefAggregate(brief: TelemetryBrief): void {
  ensureTelemetryDir();
  const aggregates = readBriefAggregates();
  aggregates.push(brief);
  fs.writeFileSync(getBriefAggregatesPath(), JSON.stringify(aggregates, null, 2));
}

export function recordBriefCategories(data: {
  icpCategory: string;
  problemCategory: string;
  mvpCategory: string;
}): void {
  if (!isTelemetryEnabled()) return;

  const brief: TelemetryBrief = {
    icpCategory: data.icpCategory.toLowerCase().trim(),
    problemCategory: data.problemCategory.toLowerCase().trim(),
    mvpCategory: data.mvpCategory.toLowerCase().trim(),
    weekNumber: getWeekNumber(),
    timestamp: new Date().toISOString(),
  };

  appendBriefAggregate(brief);
}

export function getLocalTrendingData(): {
  icp: Record<string, number>;
  problem: Record<string, number>;
  mvp: Record<string, number>;
  totalFounders: number;
} {
  const aggregates = readBriefAggregates();
  const icp: Record<string, number> = {};
  const problem: Record<string, number> = {};
  const mvp: Record<string, number> = {};

  for (const a of aggregates) {
    icp[a.icpCategory] = (icp[a.icpCategory] || 0) + 1;
    problem[a.problemCategory] = (problem[a.problemCategory] || 0) + 1;
    mvp[a.mvpCategory] = (mvp[a.mvpCategory] || 0) + 1;
  }

  return { icp, problem, mvp, totalFounders: aggregates.length };
}

export function recordEvent(event: {
  command: string;
  durationMs?: number;
  error?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  hasShipLog?: boolean;
  projectType?: string;
}): void {
  if (!isTelemetryEnabled()) return;

  const config = readConfig();

  const record: TelemetryEvent = {
    id: crypto.randomUUID(),
    command: event.command,
    timestamp: new Date().toISOString(),
    weekNumber: getWeekNumber(),
    durationMs: event.durationMs,
    error: event.error,
    tasksCompleted: event.tasksCompleted,
    tasksTotal: event.tasksTotal,
    hasShipLog: event.hasShipLog,
    projectType: event.projectType,
  };

  appendEvent(record);
}

export async function telemetryCommand(action?: string): Promise<void> {
  switch (action) {
    case "on": {
      const config = readConfig();
      config.telemetry = { optedIn: true, prompted: true };
      writeConfig(config);
      clog.success("Telemetry enabled.");
      break;
    }
    case "off": {
      const config = readConfig();
      config.telemetry = { optedIn: false, prompted: true };
      writeConfig(config);
      clog.info("Telemetry disabled. Existing data preserved.");
      break;
    }
    case "export": {
      const data = exportTelemetry();
      const outPath = exportTelemetryToFile(undefined, data);
      clog.success(`Exported ${data.events.length} events across ${data.weekCount} weeks`);
      clog.message(`  Saved to: ${outPath}`);
      break;
    }
    case "delete": {
      const confirmed = await confirm({
        message: "Delete all local telemetry data? This cannot be undone.",
      });

      if (!isCancel(confirmed) && confirmed) {
        deleteTelemetry();
        clog.success("All telemetry data deleted.");
      }
      break;
    }
    case "status": {
      const enabled = isTelemetryEnabled();
      const data = exportTelemetry();
      clog.step(`  Telemetry: ${enabled ? colors.success("on") : colors.muted("off")}`);
      clog.message(`  Events: ${data.events.length}`);
      clog.message(`  Weeks: ${data.weekCount}`);
      clog.message(`  ID: ${data.distinctId}`);
      if (!enabled) {
        clog.message("  Run `loopkit telemetry on` to enable.");
      }
      break;
    }
    default: {
      clog.step("loopkit telemetry");
      clog.message("Manage anonymous usage telemetry.\n");
      clog.message(`  ${colors.white("telemetry")} ${colors.dim("     Show status")}`);
      clog.message(`  ${colors.white("telemetry on")} ${colors.dim("   Enable collection")}`);
      clog.message(`  ${colors.white("telemetry off")} ${colors.dim("  Disable collection (preserves data)")}`);
      clog.message(`  ${colors.white("telemetry export")} ${colors.dim("Export all data to JSON file")}`);
      clog.message(`  ${colors.white("telemetry delete")} ${colors.dim("Delete all local telemetry data")}`);
      break;
    }
  }
}
