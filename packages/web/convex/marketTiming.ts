import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMarketSignal = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("marketSignals")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(1);

    if (signals.length === 0) return null;

    const s = signals[0];
    return {
      category: s.category,
      fundingTrend: s.fundingTrend,
      fundingCount: s.fundingCount,
      devTrend: s.devTrend,
      devGrowth: s.devGrowth,
      hiringTrend: s.hiringTrend,
      hiringCount: s.hiringCount,
      compositeScore: s.compositeScore,
      signal: s.signal,
      lastUpdated: new Date(s.lastUpdated).toISOString(),
    };
  },
});

export const getMarketSignalHistory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("marketSignals")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(30);

    return signals
      .sort((a, b) => a.lastUpdated - b.lastUpdated)
      .map((s) => ({
        date: new Date(s.lastUpdated).toISOString().split("T")[0],
        compositeScore: s.compositeScore,
        signal: s.signal,
      }));
  },
});

export const upsertMarketSignal = mutation({
  args: {
    category: v.string(),
    fundingTrend: v.string(),
    fundingCount: v.number(),
    devTrend: v.string(),
    devGrowth: v.number(),
    hiringTrend: v.string(),
    hiringCount: v.number(),
    compositeScore: v.number(),
    signal: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("marketSignals")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(1);

    if (existing.length > 0) {
      const last = existing[0];
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - last.lastUpdated < oneDayMs) {
        return;
      }
    }

    await ctx.db.insert("marketSignals", {
      category: args.category,
      fundingTrend: args.fundingTrend,
      fundingCount: args.fundingCount,
      devTrend: args.devTrend,
      devGrowth: args.devGrowth,
      hiringTrend: args.hiringTrend,
      hiringCount: args.hiringCount,
      compositeScore: args.compositeScore,
      signal: args.signal,
      lastUpdated: Date.now(),
    });
  },
});
