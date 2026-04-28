import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCompetitorLaunches = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const launches = await ctx.db
      .query("competitorLaunches")
      .withIndex("by_category_date", (q) => q.eq("category", args.category))
      .order("desc")
      .take(30);

    if (launches.length === 0) return null;

    const scannedAt = launches[0]?.scannedAt ?? "";

    return {
      launches: launches.map((l) => ({
        name: l.name,
        url: l.url,
        date: l.date,
        platform: l.platform,
        relevance: l.relevance,
        description: l.description,
        tagline: l.tagline,
      })),
      category: args.category,
      scannedAt,
      totalFound: launches.length,
    };
  },
});

export const getCompetitorLaunchesHistory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const launches = await ctx.db
      .query("competitorLaunches")
      .withIndex("by_category_date", (q) => q.eq("category", args.category))
      .order("desc")
      .take(100);

    const byPlatform = launches.reduce(
      (acc, l) => {
        acc[l.platform] = (acc[l.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const avgRelevance =
      launches.length > 0
        ? Math.round(
            launches.reduce((s, l) => s + l.relevance, 0) / launches.length,
          )
        : 0;

    return {
      byPlatform,
      avgRelevance,
      totalFound: launches.length,
      recentCount: launches.filter((l) => {
        const d = new Date(l.date);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return d.getTime() >= weekAgo;
      }).length,
    };
  },
});

export const syncCompetitorLaunches = mutation({
  args: {
    category: v.string(),
    launches: v.array(
      v.object({
        name: v.string(),
        url: v.optional(v.string()),
        date: v.string(),
        platform: v.string(),
        relevance: v.number(),
        description: v.optional(v.string()),
        tagline: v.optional(v.string()),
      }),
    ),
    scannedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("competitorLaunches")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .first();

    if (existing) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - new Date(existing.scannedAt).getTime() < oneDayMs) {
        return;
      }
    }

    const old = await ctx.db
      .query("competitorLaunches")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();

    for (const doc of old) {
      await ctx.db.delete(doc._id);
    }

    for (const launch of args.launches) {
      await ctx.db.insert("competitorLaunches", {
        category: args.category,
        ...launch,
        scannedAt: args.scannedAt,
      });
    }
  },
});
