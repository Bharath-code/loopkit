import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { userOwnsProject, assertProjectOwner } from "./authHelpers";

export const getPatterns = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return [];

    return await ctx.db
      .query("patternInterrupts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);
  },
});

export const getActivePatterns = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return [];

    return await ctx.db
      .query("patternInterrupts")
      .withIndex("by_project_resolved", (q) =>
        q.eq("projectId", args.projectId).eq("resolved", false)
      )
      .order("desc")
      .take(10);
  },
});

export const recordPattern = mutation({
  args: {
    projectId: v.id("projects"),
    type: v.string(),
    severity: v.string(),
    message: v.string(),
    suggestions: v.array(v.string()),
    weeksObserved: v.number(),
  },
  handler: async (ctx, args) => {
    await assertProjectOwner(ctx, args.projectId);

    return await ctx.db.insert("patternInterrupts", {
      projectId: args.projectId,
      type: args.type,
      severity: args.severity,
      message: args.message,
      suggestions: args.suggestions,
      weeksObserved: args.weeksObserved,
      resolved: false,
      detectedAt: Date.now(),
    });
  },
});

export const resolvePattern = mutation({
  args: { patternId: v.id("patternInterrupts") },
  handler: async (ctx, args) => {
    const pattern = await ctx.db.get(args.patternId);
    if (!pattern) throw new Error("Pattern not found");

    await assertProjectOwner(ctx, pattern.projectId);

    return await ctx.db.patch(args.patternId, { resolved: true });
  },
});
