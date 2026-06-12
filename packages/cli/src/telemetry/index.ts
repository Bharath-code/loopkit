/**
 * CLI-side telemetry — the offline-tolerant twin of the web `track()` helper.
 *
 * Design:
 *   - Every track() call appends an event to .loopkit/telemetry-queue.json
 *   - The queue is flushed at the end of every command via `flushTelemetry()`
 *   - Failed flushes keep the events in the queue (next command retries)
 *   - Opt-in: only records if config.telemetry.optedIn === true
 *   - Network-free: never blocks the command; max 5s budget per flush
 *   - Silent: never throws, never logs unless flushDebug is set
 *
 * The web side reads these from the `funnelEvents` Convex table via
 * `/admin/funnel` (dev-only) — that dashboard is the only place the
 * data surfaces.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getRoot, readConfig } from "../storage/local";

const API_URL = process.env.LOOPKIT_API_URL || "http://localhost:3000";
const QUEUE_PATH = path.join(getRoot(), "telemetry-queue.json");
const FLUSH_TIMEOUT_MS = 5000;
const MAX_QUEUE_SIZE = 5000;
const MAX_BATCH = 100;

export type CliEventName =
  | "cli.init_run"
  | "cli.init_complete"
  | "cli.first_task_added"
  | "cli.first_task_completed"
  | "cli.first_ship"
  | "cli.first_loop"
  | "cli.loop_run"
  | "cli.streak_achieved"
  | "cli.command_error";

export interface CliEvent {
  event: CliEventName;
  properties?: Record<string, string | number | boolean>;
  occurredAt: number;
}

interface Queue {
  distinctId: string;
  events: CliEvent[];
}

function getOrCreateDistinctId(): string {
  // The same distinctId is stored in config.distinctId so it survives
  // across commands. The first time we need one, we generate it.
  const config = readConfig();
  if (config.distinctId) return config.distinctId;

  // Generate a stable but unguessable id
  const id = `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  // We don't write config here (no need to round-trip through the
  // encryption/validation pipeline) — just cache it in the queue file.
  return id;
}

function readQueue(): Queue {
  try {
    if (!fs.existsSync(QUEUE_PATH)) {
      return { distinctId: getOrCreateDistinctId(), events: [] };
    }
    const raw = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
    return {
      distinctId: raw.distinctId ?? getOrCreateDistinctId(),
      events: Array.isArray(raw.events) ? raw.events : [],
    };
  } catch {
    return { distinctId: getOrCreateDistinctId(), events: [] };
  }
}

function writeQueue(queue: Queue): void {
  try {
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf-8");
  } catch {
    // Disk full or read-only FS — drop the queue silently.
  }
}

function isOptedIn(): boolean {
  try {
    return readConfig().telemetry?.optedIn === true;
  } catch {
    return false;
  }
}

/**
 * Record a CLI event. Appends to the queue; never throws.
 */
export function trackCli(
  event: CliEventName,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!isOptedIn()) return;
  try {
    const queue = readQueue();
    queue.events.push({
      event,
      properties,
      occurredAt: Date.now(),
    });
    // Cap the queue — if it gets huge (offline for weeks), drop the oldest
    if (queue.events.length > MAX_QUEUE_SIZE) {
      queue.events = queue.events.slice(-MAX_QUEUE_SIZE);
    }
    writeQueue(queue);
  } catch {
    // Telemetry must never break a command.
  }
}

/**
 * Flush the queue to the server. Called at the end of every command.
 * - Best-effort: failures keep the events in the queue
 * - Bounded: max 5s per flush attempt
 * - Resilient: partial flushes keep the remainder for next time
 */
export async function flushTelemetry(): Promise<void> {
  if (!isOptedIn()) return;

  const queue = readQueue();
  if (queue.events.length === 0) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);

  try {
    // Send in batches of MAX_BATCH
    let sent = 0;
    while (sent < queue.events.length) {
      const batch = queue.events.slice(sent, sent + MAX_BATCH);
      const res = await fetch(`${API_URL}/api/telemetry/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distinctId: queue.distinctId,
          events: batch,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Server rejected — keep the rest of the queue, stop trying
        break;
      }
      sent += batch.length;
    }

    // Drop the events we successfully sent
    if (sent > 0) {
      queue.events = queue.events.slice(sent);
      writeQueue(queue);
    }
  } catch {
    // Network down — leave the queue as-is, retry next command
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Bind the CLI's distinctId to the user's account. Called after
 * `loopkit auth` succeeds, so pre-auth events get linked to the user.
 */
export async function bindTelemetryToUser(): Promise<void> {
  const queue = readQueue();
  if (queue.events.length === 0 && !queue.distinctId.startsWith("cli_")) {
    return;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);
    await fetch(`${API_URL}/api/telemetry/bind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ distinctId: queue.distinctId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // Best-effort; not critical
  }
}
