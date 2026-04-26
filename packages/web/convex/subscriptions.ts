import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertSubscription = mutation({
  args: {
    userId: v.id("users"),
    polarId: v.string(),
    polarPriceId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_polar_id", (q) => q.eq("polarId", args.polarId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        polarPriceId: args.polarPriceId,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        polarId: args.polarId,
        polarPriceId: args.polarPriceId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
      });
    }
  },
});
