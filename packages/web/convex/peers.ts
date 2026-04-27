import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getPeerShips = query({
  args: { category: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("peerShips")
      .withIndex("by_category_createdAt", (q) =>
        q.eq("category", args.category).gte("createdAt", twoWeeksAgo)
      )
      .order("desc")
      .take(limit);
  },
});

export const recordPeerShip = mutation({
  args: {
    category: v.string(),
    whatShipped: v.string(),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("peerShips", {
      category: args.category,
      whatShipped: args.whatShipped,
      weekNumber: args.weekNumber,
      createdAt: Date.now(),
    });
  },
});
