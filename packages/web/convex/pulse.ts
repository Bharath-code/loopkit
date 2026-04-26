import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensureProject = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) return { projectId: existing._id, created: false };

    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      name: args.name,
      slug: args.slug,
      createdAt: Date.now(),
    });

    return { projectId, created: true };
  },
});

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

export const countResponses = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("pulseResponses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return responses.length;
  },
});
