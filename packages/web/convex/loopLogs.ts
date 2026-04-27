import { query } from "./_generated/server";
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

    const limit = Math.min(args.limit ?? 100, 100);
    return await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit);
  },
});

export const latestByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return null;

    return await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();
  },
});

export const streakCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return 0;

    const logs = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    let streak = 0;
    let prevWeek: number | null = null;

    for (const log of logs) {
      if (prevWeek === null) {
        streak = 1;
        prevWeek = log.weekNumber;
      } else if (log.weekNumber === prevWeek - 1) {
        streak++;
        prevWeek = log.weekNumber;
      } else {
        break;
      }
    }

    return streak;
  },
});
