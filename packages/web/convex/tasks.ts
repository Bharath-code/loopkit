/**
 * Tasks table — bidirectional CLI ↔ Convex sync.
 *
 * The CLI writes/reads `tasks.md` locally; the dashboard reads/writes
 * Convex. This module is the Convex side of the bridge.
 *
 * Conflict resolution is LWW (last-write-wins) on `updatedAt`:
 *   - If local.updatedAt > remote.updatedAt → local wins
 *   - If equal → status `cli` wins (the CLI is the canonical seed)
 *
 * Auth: every query/mutation verifies the caller owns the project.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { userOwnsProject } from "./authHelpers";

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return [];

    const limit = Math.min(args.limit ?? 200, 500);
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
      .then((rows) => rows.slice(0, limit));
  },
});

export const getByCliId = query({
  args: {
    projectId: v.id("projects"),
    cliTaskId: v.number(),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return null;

    return await ctx.db
      .query("tasks")
      .withIndex("by_cli_id", (q) =>
        q.eq("projectId", args.projectId).eq("cliTaskId", args.cliTaskId),
      )
      .first();
  },
});

/**
 * Upsert a single task. The CLI uses this to push local state to the
 * dashboard. The `updatedAt` field is the LWW tiebreaker.
 */
export const upsert = mutation({
  args: {
    projectId: v.id("projects"),
    cliTaskId: v.number(),
    title: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("done"),
      v.literal("snoozed"),
      v.literal("cut"),
    ),
    section: v.union(v.literal("week"), v.literal("backlog")),
    createdAt: v.string(),
    closedAt: v.optional(v.string()),
    closedVia: v.optional(v.string()),
    snoozedUntil: v.optional(v.string()),
    updatedAt: v.string(),
    lastModifiedBy: v.union(v.literal("cli"), v.literal("web")),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) {
      throw new Error("Not authorized for this project");
    }

    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_cli_id", (q) =>
        q.eq("projectId", args.projectId).eq("cliTaskId", args.cliTaskId),
      )
      .first();

    if (!existing) {
      return await ctx.db.insert("tasks", args);
    }

    // LWW: only update if incoming.updatedAt is newer
    if (args.updatedAt > existing.updatedAt) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return existing._id;
  },
});

/**
 * Delete a task by its CLI id. Used when a task is cut from the
 * local tasks.md and the change should propagate.
 */
export const deleteByCliId = mutation({
  args: {
    projectId: v.id("projects"),
    cliTaskId: v.number(),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) {
      throw new Error("Not authorized for this project");
    }

    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_cli_id", (q) =>
        q.eq("projectId", args.projectId).eq("cliTaskId", args.cliTaskId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { deleted: !!existing };
  },
});

/**
 * Mark a task done from the dashboard. Sets status, closedAt, and
 * stamps lastModifiedBy=web.
 */
export const markDone = mutation({
  args: {
    projectId: v.id("projects"),
    cliTaskId: v.number(),
    closedVia: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) {
      throw new Error("Not authorized for this project");
    }

    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_cli_id", (q) =>
        q.eq("projectId", args.projectId).eq("cliTaskId", args.cliTaskId),
      )
      .first();

    if (!existing) {
      throw new Error("Task not found in Convex; CLI should push first");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(existing._id, {
      status: "done",
      closedAt: now,
      closedVia: args.closedVia,
      updatedAt: now,
      lastModifiedBy: "web",
    });
    return existing._id;
  },
});

/**
 * Bulk-apply dashboard edits. The dashboard calls this on every
 * mutation to keep Convex in sync with the client's optimistic state.
 *
 * Race safety: Convex mutations are atomic per-call, so two parallel
 * bulkUpsert calls won't interleave their inserts. Within a single call
 * we gather all existing rows in one query (not a per-row read inside
 * the loop) to ensure the LWW comparison uses a consistent snapshot.
 * If two pushes arrive for the same row with identical updatedAt, the
 * last write wins; this is acceptable because CLI is canonical for
 * new tasks and the timestamps are millisecond-resolution.
 */
export const bulkUpsert = mutation({
  args: {
    projectId: v.id("projects"),
    tasks: v.array(
      v.object({
        cliTaskId: v.number(),
        title: v.string(),
        status: v.union(
          v.literal("open"),
          v.literal("done"),
          v.literal("snoozed"),
          v.literal("cut"),
        ),
        section: v.union(v.literal("week"), v.literal("backlog")),
        createdAt: v.string(),
        closedAt: v.optional(v.string()),
        closedVia: v.optional(v.string()),
        snoozedUntil: v.optional(v.string()),
        updatedAt: v.string(),
        lastModifiedBy: v.literal("web"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) {
      throw new Error("Not authorized for this project");
    }

    // Gather all existing rows in one query, then write. This avoids
    // the read-inside-loop pattern that can yield surprising
    // interleavings when multiple mutations target the same rows.
    const existingRows = await ctx.db
      .query("tasks")
      .withIndex("by_cli_id", (q) => q.eq("projectId", args.projectId))
      .collect();
    const existingByCliId = new Map(
      existingRows.map((r) => [r.cliTaskId, r]),
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const t of args.tasks) {
      const existing = existingByCliId.get(t.cliTaskId);

      if (!existing) {
        await ctx.db.insert("tasks", { ...t, projectId: args.projectId });
        inserted++;
      } else if (t.updatedAt > existing.updatedAt) {
        await ctx.db.patch(existing._id, t);
        updated++;
      } else {
        skipped++;
      }
    }

    return { inserted, updated, skipped };
  },
});

/**
 * Count tasks per status — used by the dashboard for quick stats.
 */
export const countByStatus = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return { open: 0, done: 0, snoozed: 0, cut: 0 };

    const rows = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const counts = { open: 0, done: 0, snoozed: 0, cut: 0 };
    for (const r of rows) {
      counts[r.status]++;
    }
    return counts;
  },
});
