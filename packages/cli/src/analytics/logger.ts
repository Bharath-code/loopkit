import crypto from "node:crypto";

export type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  correlationId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    module,
    message,
    correlationId: crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    data,
  };

  switch (level) {
    case "error":
      console.error(formatLog(entry));
      break;
    case "warn":
      console.warn(formatLog(entry));
      break;
    default:
      console.log(formatLog(entry));
  }
}
