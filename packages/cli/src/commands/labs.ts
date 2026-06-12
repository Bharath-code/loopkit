import { readConfig, writeConfig } from "../storage/local.js";
import { clog } from "../ui/theme.js";

const LABS_COMMANDS = new Set(["radar", "keywords", "timing", "update"]);

export function isLabsEnabled(): boolean {
  if (process.env.LOOPKIT_LABS === "1") return true;
  if (process.env.LOOPKIT_LABS === "0") return false;
  const config = readConfig();
  return config.labsEnabled === true;
}

export function setLabsEnabled(enabled: boolean): void {
  const config = readConfig();
  config.labsEnabled = enabled;
  writeConfig(config);
}

/**
 * Gate a command behind the labs flag. Returns true if execution should proceed.
 * If false, prints a friendly message and the caller should return early.
 */
export function labsGate(cmd: string): boolean {
  if (!LABS_COMMANDS.has(cmd)) return true;
  if (isLabsEnabled()) return true;

  clog.warn(`"${cmd}" is in labs. Set LOOPKIT_LABS=1 or run \`loopkit labs on\`.`);
  return false;
}

export function listLabsCommands(): string[] {
  return Array.from(LABS_COMMANDS);
}
