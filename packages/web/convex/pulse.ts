import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitResponse = mutation({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, we'd verify the project exists and belongs to a Pro user
    // For MVP, we insert it directly
    await ctx.db.insert("pulseResponses", {
      projectId: args.projectId,
      text: args.text,
      createdAt: Date.now(),
    });
  },
});

export const getResponses = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pulseResponses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});
