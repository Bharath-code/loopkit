import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function sanitizeInput(text: string): string {
  const stripped = text.replace(/<[^>]*>/g, "");
  const trimmed = stripped.trim();
  return trimmed.slice(0, 500);
}

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
    const sanitized = sanitizeInput(args.text);
    if (!sanitized) return { error: "Empty feedback after sanitization" };

    await ctx.db.insert("pulseResponses", {
      projectId: args.projectId,
      text: sanitized,
      createdAt: Date.now(),
    });
  },
});

export const checkRateLimit = query({
  args: { key: v.string(), windowMs: v.number(), maxRequests: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const record = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!record) return { allowed: true, remaining: args.maxRequests };

    if (now - record.windowStart > args.windowMs) {
      return { allowed: true, remaining: args.maxRequests };
    }

    const remaining = args.maxRequests - record.count;
    return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
  },
});

export const incrementRateLimit = mutation({
  args: { key: v.string(), windowMs: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const record = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!record || now - record.windowStart > args.windowMs) {
      await ctx.db.insert("rateLimits", {
        key: args.key,
        windowStart: now,
        count: 1,
      });
    } else {
      await ctx.db.patch(record._id, { count: record.count + 1 });
    }
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
