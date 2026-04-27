import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { userOwnsProject } from "./authHelpers";

function sanitizeInput(text: string): string {
  const stripped = text.replace(/<[^>]*>/g, "");
  const trimmed = stripped.trim();
  return trimmed.slice(0, 500);
}

export const ensureProject = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: authentication required");
    }

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      // Only return the existing project if the current user owns it
      if (existing.userId === userId) {
        return { projectId: existing._id, created: false };
      }
      throw new Error(
        "Forbidden: project slug already exists under a different owner",
      );
    }

    const projectId = await ctx.db.insert("projects", {
      userId,
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
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return [];

    const limit = Math.min(args.limit ?? 100, 100);
    return await ctx.db
      .query("pulseResponses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit);
  },
});

export const countResponses = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const authorized = await userOwnsProject(ctx, args.projectId);
    if (!authorized) return 0;

    const responses = await ctx.db
      .query("pulseResponses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return responses.length;
  },
});
