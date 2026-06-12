/**
 * Conflict resolution for bidirectional task sync.
 *
 * Last-write-wins based on `updatedAt` timestamp. When timestamps are
 * equal, CLI wins (the CLI is the canonical seed for new tasks).
 *
 * Pure functions only — no I/O, no Convex calls. Tested in isolation.
 */

import type { ParsedTask } from "./tasks-parser.js";

/** Task shape used for sync. Both sides map to this. */
export interface SyncTask {
  id: number;
  title: string;
  status: "open" | "done" | "snoozed" | "cut";
  section: "week" | "backlog";
  createdAt: string;
  closedAt: string | undefined;
  closedVia: string | undefined;
  snoozedUntil: string | undefined;
  updatedAt: string;
  lastModifiedBy: "cli" | "web";
}

export type ConflictStrategy = "lww" | "prefer-cli" | "prefer-web";

export interface ConflictResult<T> {
  /** Tasks that won (the merged state) */
  resolved: T[];
  /** Tasks that were dropped (will be deleted on the losing side) */
  removed: number[];
  /** Stats for the sync report */
  stats: {
    added: number;
    updated: number;
    unchanged: number;
    conflicts: number;
  };
}

/**
 * Convert a ParsedTask (CLI side) to a SyncTask by stamping it with
 * `updatedAt` and `lastModifiedBy`.
 */
export function toSyncTask(
  task: ParsedTask,
  source: "cli" | "web",
  updatedAt: string = new Date().toISOString(),
): SyncTask {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    section: task.section,
    createdAt: task.createdAt,
    closedAt: task.closedAt,
    closedVia: task.closedVia,
    snoozedUntil: task.snoozedUntil,
    updatedAt,
    lastModifiedBy: source,
  };
}

/**
 * Compare two SyncTasks at the same id and pick the winner.
 * Returns `null` if they're identical (no conflict).
 */
export function pickWinner(
  local: SyncTask,
  remote: SyncTask,
  strategy: ConflictStrategy = "lww",
): SyncTask | null {
  if (strategy === "prefer-cli") return local;
  if (strategy === "prefer-web") return remote;

  // LWW
  if (local.updatedAt > remote.updatedAt) return local;
  if (local.updatedAt < remote.updatedAt) return remote;
  // Tie: CLI wins (canonical seed) — but only if there's a real difference
  if (
    local.title === remote.title &&
    local.status === remote.status &&
    local.section === remote.section &&
    local.closedAt === remote.closedAt &&
    local.closedVia === remote.closedVia &&
    local.snoozedUntil === remote.snoozedUntil &&
    local.lastModifiedBy === remote.lastModifiedBy
  ) {
    return null; // No real difference despite same timestamp
  }
  return local;
}

/**
 * Compare two lists of tasks and produce a merged list with conflict
 * resolution. Tasks present only on one side are kept as-is. Tasks
 * present on both are compared via the strategy.
 */
export function mergeTasks(
  local: SyncTask[],
  remote: SyncTask[],
  strategy: ConflictStrategy = "lww",
): ConflictResult<SyncTask> {
  const localById = new Map(local.map((t) => [t.id, t]));
  const remoteById = new Map(remote.map((t) => [t.id, t]));
  const allIds = new Set([...localById.keys(), ...remoteById.keys()]);

  const resolved: SyncTask[] = [];
  const removed: number[] = [];
  const stats = { added: 0, updated: 0, unchanged: 0, conflicts: 0 };

  for (const id of allIds) {
    const l = localById.get(id);
    const r = remoteById.get(id);

    if (l && !r) {
      // Local-only: it's new on the CLI side, push to Convex
      resolved.push(l);
      stats.added++;
      continue;
    }
    if (!l && r) {
      // Remote-only: it's new on the web side, pull to CLI
      resolved.push(r);
      stats.added++;
      continue;
    }
    if (l && r) {
      // Both sides have it: compare
      const winner = pickWinner(l, r, strategy);
      if (!winner) {
        // Identical
        resolved.push(l);
        stats.unchanged++;
        continue;
      }
      stats.updated++;
      if (winner !== l && winner !== r) {
        // Shouldn't happen with current strategies, but type-safety
        resolved.push(winner);
      } else if (winner.updatedAt !== l.updatedAt || winner !== l) {
        // A real conflict
        stats.conflicts++;
      }
      resolved.push(winner);
    }
  }

  // Sort by id for stable output
  resolved.sort((a, b) => a.id - b.id);
  return { resolved, removed, stats };
}

/**
 * Build a human-readable summary of the merge result.
 */
export function formatMergeReport(result: ConflictResult<SyncTask>): string {
  const { stats } = result;
  const parts: string[] = [];
  if (stats.added > 0) parts.push(`+${stats.added} new`);
  if (stats.updated > 0) parts.push(`~${stats.updated} updated`);
  if (stats.unchanged > 0) parts.push(`${stats.unchanged} unchanged`);
  if (stats.conflicts > 0) parts.push(`!${stats.conflicts} conflicts resolved`);
  return parts.length > 0 ? parts.join(", ") : "no changes";
}
