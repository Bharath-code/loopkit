/**
 * Bidirectional task sync orchestrator.
 *
 * Push: read local tasks.md → upsert each task to Convex.
 * Pull: read Convex tasks → write back to local tasks.md.
 * Both: merge with LWW conflict resolution.
 *
 * Auth: uses the same `auth.apiKey` token that other sync calls use.
 * No token = silent skip (per existing sync.ts pattern).
 */

import { parseTasksFile, renderTasksFile, type ParsedTask } from "./tasks-parser.js";
import {
  toSyncTask,
  mergeTasks,
  formatMergeReport,
  type SyncTask,
  type ConflictStrategy,
  type ConflictResult,
} from "./conflict.js";
import { readTasksFile, writeTasksFile, readBriefJson, readConfig } from "../storage/local.js";
import { getConvexProjectId } from "../storage/sync.js";

const API_URL = process.env.LOOPKIT_API_URL || "http://localhost:3000";

export type SyncDirection = "push" | "pull" | "both";

export interface SyncReport {
  direction: SyncDirection;
  strategy: ConflictStrategy;
  slug: string;
  stats: ConflictResult<SyncTask>["stats"];
  reportLine: string;
  /** Tasks that changed locally (caller can write tasks.md) */
  newLocalTasks: SyncTask[] | null;
}

export interface PushResult {
  inserted: number;
  updated: number;
  skipped: number;
}

export async function pushTasks(slug: string): Promise<PushResult> {
  const projectId = getConvexProjectId(slug);
  if (!projectId) {
    throw new Error(`No Convex projectId for slug "${slug}". Run \`loopkit auth\` and try again.`);
  }

  const content = readTasksFile(slug) || "";
  const parsed = parseTasksFile(content);
  if (parsed.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const syncTasks = parsed.map((t: ParsedTask) => toSyncTask(t, "cli"));

  // Single bulk call — one HTTP roundtrip, one Convex mutation.
  const res = await fetch(`${API_URL}/api/sync/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      tasks: syncTasks,
    }),
  });

  if (!res.ok) {
    throw new Error(`Push failed: HTTP ${res.status}`);
  }

  const result = (await res.json()) as PushResult;
  return result;
}

export async function pullTasks(slug: string): Promise<SyncTask[]> {
  const projectId = getConvexProjectId(slug);
  if (!projectId) {
    throw new Error(`No Convex projectId for slug "${slug}". Run \`loopkit auth\` and try again.`);
  }

  const config = readConfig();
  const token = config.auth?.apiKey;
  if (!token) {
    throw new Error("Not authenticated. Run `loopkit auth` first.");
  }

  const res = await fetch(
    `${API_URL}/api/sync/tasks?projectId=${encodeURIComponent(projectId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) {
    throw new Error(`Pull failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as { tasks: SyncTask[] };
  return json.tasks;
}

export async function syncTasks(
  slug: string,
  direction: SyncDirection = "both",
  strategy: ConflictStrategy = "lww",
): Promise<SyncReport> {
  const localContent = readTasksFile(slug) || "";
  const localTasks = parseTasksFile(localContent);
  const localSync = localTasks.map((t) => toSyncTask(t, "cli"));

  let remoteSync: SyncTask[] = [];
  if (direction !== "push") {
    try {
      remoteSync = await pullTasks(slug);
    } catch (err) {
      // If pull fails, fall back to push-only
      remoteSync = [];
      if (direction === "both") {
        // No rethrow — we'll do push-only sync
      } else {
        throw err;
      }
    }
  }

  if (direction === "push") {
    const result = await pushTasks(slug);
    return {
      direction,
      strategy,
      slug,
      stats: { added: result.inserted, updated: result.updated, unchanged: result.skipped, conflicts: 0 },
      reportLine: `Pushed: +${result.inserted} new, ~${result.updated} updated, ${result.skipped} unchanged`,
      newLocalTasks: null,
    };
  }

  if (direction === "pull") {
    const merged = mergeTasks(localSync, remoteSync, strategy);
    if (merged.resolved.length > 0) {
      const brief = readBriefJson(slug);
      const projectName = brief?.answers?.name ?? slug;
      const newContent = renderTasksFile(
        merged.resolved.map((t) => syncTaskToParsed(t)),
        projectName,
      );
      writeTasksFile(slug, newContent);
    }
    return {
      direction,
      strategy,
      slug,
      stats: merged.stats,
      reportLine: `Pulled: ${formatMergeReport(merged)}`,
      newLocalTasks: merged.resolved,
    };
  }

  // Both: merge, then push the merged state
  const merged = mergeTasks(localSync, remoteSync, strategy);

  // Push the merged state to Convex
  let pushResult: PushResult = { inserted: 0, updated: 0, skipped: 0 };
  if (merged.resolved.length > 0) {
    try {
      const projectId = getConvexProjectId(slug);
      if (projectId) {
        const res = await fetch(`${API_URL}/api/sync/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            tasks: merged.resolved,
          }),
        });
        if (res.ok) {
          pushResult = (await res.json()) as PushResult;
        }
      }
    } catch {
      /* push failure is non-fatal — local merge already applied */
    }
  }

  // Apply merged state locally
  if (merged.resolved.length > 0) {
    const brief = readBriefJson(slug);
    const projectName = brief?.answers?.name ?? slug;
    const newContent = renderTasksFile(
      merged.resolved.map((t) => syncTaskToParsed(t)),
      projectName,
    );
    writeTasksFile(slug, newContent);
  }

  return {
    direction,
    strategy,
    slug,
    stats: {
      ...merged.stats,
      added: pushResult.inserted,
      updated: pushResult.updated,
    },
    reportLine: `Synced: ${formatMergeReport(merged)} (push: +${pushResult.inserted} new, ~${pushResult.updated} updated)`,
    newLocalTasks: merged.resolved,
  };
}

function syncTaskToParsed(t: SyncTask): ParsedTask {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    section: t.section,
    createdAt: t.createdAt,
    closedAt: t.closedAt,
    closedVia: t.closedVia,
    snoozedUntil: t.snoozedUntil,
    raw: "", // will be re-rendered
  };
}
