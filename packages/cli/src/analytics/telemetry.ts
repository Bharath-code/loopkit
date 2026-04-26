import * as p from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getWeekNumber, formatDate, type TelemetryEvent, type TelemetryExport } from "@loopkit/shared";
import { getRoot, readConfig, writeConfig } from "../storage/local.js";
import { colors, info, pass, fail } from "../ui/theme.js";

const TELEMETRY_DIR = "telemetry";

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

  console.log(`\n${colors.primary.bold("  📊 Help make LoopKit better")}`);
  console.log(colors.dim("  We collect anonymous usage data to improve features and show benchmarks."));
  console.log(colors.dim("  Everything is local by default. Nothing leaves your machine unless you opt in."));

  const optIn = await p.confirm({
    message: "Opt into anonymous usage telemetry?",
  });

  if (p.isCancel(optIn)) {
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
    console.log(pass("Telemetry enabled. Thank you!"));
    console.log(colors.dim("  Run `loopkit telemetry export` to review data, `loopkit telemetry delete` to remove."));
  } else {
    console.log(info("Telemetry disabled. You can enable it later with `loopkit telemetry on`."));
  }
}

export function isTelemetryEnabled(): boolean {
  const config = readConfig();
  return config.telemetry?.optedIn === true;
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
      console.log(pass("Telemetry enabled."));
      break;
    }
    case "off": {
      const config = readConfig();
      config.telemetry = { optedIn: false, prompted: true };
      writeConfig(config);
      console.log(info("Telemetry disabled. Existing data preserved."));
      break;
    }
    case "export": {
      const data = exportTelemetry();
      const outPath = exportTelemetryToFile(undefined, data);
      console.log(pass(`Exported ${data.events.length} events across ${data.weekCount} weeks`));
      console.log(colors.dim(`  Saved to: ${outPath}`));
      break;
    }
    case "delete": {
      const confirmed = await p.confirm({
        message: "Delete all local telemetry data? This cannot be undone.",
      });

      if (!p.isCancel(confirmed) && confirmed) {
        deleteTelemetry();
        console.log(pass("All telemetry data deleted."));
      }
      break;
    }
    case "status": {
      const enabled = isTelemetryEnabled();
      const data = exportTelemetry();
      console.log(colors.white.bold(`  Telemetry: ${enabled ? colors.success("on") : colors.muted("off")}`));
      console.log(colors.dim(`  Events: ${data.events.length}`));
      console.log(colors.dim(`  Weeks: ${data.weekCount}`));
      console.log(colors.dim(`  ID: ${data.distinctId}`));
      if (!enabled) {
        console.log(colors.dim("  Run `loopkit telemetry on` to enable."));
      }
      break;
    }
    default: {
      console.log(colors.primary.bold("\n  loopkit telemetry"));
      console.log(colors.dim("  Manage anonymous usage telemetry.\n"));
      console.log(`  ${colors.white("telemetry")} ${colors.dim("     Show status")}`);
      console.log(`  ${colors.white("telemetry on")} ${colors.dim("   Enable collection")}`);
      console.log(`  ${colors.white("telemetry off")} ${colors.dim("  Disable collection (preserves data)")}`);
      console.log(`  ${colors.white("telemetry export")} ${colors.dim("Export all data to JSON file")}`);
      console.log(`  ${colors.white("telemetry delete")} ${colors.dim("Delete all local telemetry data")}`);
      break;
    }
  }
}
