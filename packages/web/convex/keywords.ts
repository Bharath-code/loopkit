import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getKeywords = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const keywords = await ctx.db
      .query("keywordOpportunities")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .take(50);

    const sorted = keywords.sort((a, b) => b.score - a.score);

    const lastScanned = sorted.length > 0 ? sorted[0].lastScanned : null;

    return {
      keywords: sorted.map((k) => ({
        keyword: k.keyword,
        score: k.score,
        volume: k.volume,
        competition: k.competition,
        sources: k.sources,
        suggestions: k.suggestions || [],
        volumeProxy: k.volumeProxy,
        competitionProxy: k.competitionProxy,
      })),
      category: args.category,
      lastScanned: lastScanned ? new Date(lastScanned).toISOString() : null,
      totalFound: sorted.length,
    };
  },
});

export const upsertKeywords = mutation({
  args: {
    category: v.string(),
    keywords: v.array(
      v.object({
        keyword: v.string(),
        score: v.number(),
        volume: v.string(),
        competition: v.string(),
        sources: v.array(v.string()),
        suggestions: v.optional(v.array(v.string())),
        volumeProxy: v.optional(v.number()),
        competitionProxy: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keywordOpportunities")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .take(100);

    const deleteOps = existing.map((doc) => ctx.db.delete(doc._id));
    await Promise.all(deleteOps);

    const now = Date.now();
    const insertOps = args.keywords.map((kw) =>
      ctx.db.insert("keywordOpportunities", {
        category: args.category,
        keyword: kw.keyword,
        score: kw.score,
        volume: kw.volume,
        competition: kw.competition,
        sources: kw.sources,
        suggestions: kw.suggestions,
        volumeProxy: kw.volumeProxy,
        competitionProxy: kw.competitionProxy,
        lastScanned: now,
      })
    );
    await Promise.all(insertOps);
  },
});
