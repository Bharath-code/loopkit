import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TIER_LIMITS: Record<string, number> = {
  free: 10,
  solo: 100,
  pro: 1000,
};

export const checkLimit = query({
  args: { userId: v.id("users"), tier: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    const limit = TIER_LIMITS[args.tier] ?? TIER_LIMITS.free;
    const count = usage?.count ?? 0;

    return {
      allowed: count < limit,
      count,
      limit,
      remaining: Math.max(0, limit - count),
    };
  },
});

export const incrementUsage = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("aiUsage", {
        userId: args.userId,
        date: today,
        count: 1,
      });
    }
  },
});
