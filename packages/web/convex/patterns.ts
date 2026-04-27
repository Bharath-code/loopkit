import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getPatterns = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
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
    return await ctx.db.patch(args.patternId, { resolved: true });
  },
});
