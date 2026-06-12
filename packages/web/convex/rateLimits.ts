import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Daily AI call limits by tier. The free tier ceiling is the
 * abuse-prevention line — enough for a real solo founder to get
 * through one weekly ritual with margin, low enough that a
 * malicious user can't drain the Anthropic budget.
 *
 * Hard absolute ceiling: even pro tier is capped at 1000/day.
 * This protects against compromised accounts.
 */
const TIER_LIMITS: Record<string, number> = {
  free: 10,
  solo: 100,
  pro: 1000,
};

const ABSOLUTE_CEILING = 1000;

/**
 * Per-endpoint sub-limits. These are *additional* to the global
 * tier limit. A user on the solo tier still has only 3 init
 * runs per day — prevents spamming the most expensive endpoint.
 */
const ENDPOINT_LIMITS: Record<string, number> = {
  init: 3,
  ship: 5,
  pulse: 10,
  loop: 1,
  changelog: 5,
};

export const checkLimit = query({
  args: { tier: v.string(), endpoint: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { allowed: false, count: 0, limit: 0, remaining: 0, endpointAllowed: true };
    }

    const today = new Date().toISOString().split("T")[0];
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    const limit = Math.min(TIER_LIMITS[args.tier] ?? TIER_LIMITS.free, ABSOLUTE_CEILING);
    const count = usage?.count ?? 0;

    // Per-endpoint check
    let endpointAllowed = true;
    let endpointCount = 0;
    let endpointLimit: number | null = null;
    if (args.endpoint) {
      endpointLimit = ENDPOINT_LIMITS[args.endpoint] ?? null;
      if (endpointLimit !== null) {
        endpointCount = (usage?.byEndpoint as Record<string, number> | undefined)?.[args.endpoint] ?? 0;
        endpointAllowed = endpointCount < endpointLimit;
      }
    }

    return {
      allowed: count < limit && endpointAllowed,
      count,
      limit,
      remaining: Math.max(0, limit - count),
      endpointAllowed,
      endpointCount,
      endpointLimit,
    };
  },
});

export const incrementUsage = mutation({
  args: { endpoint: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    if (existing) {
      const patch: { count: number; byEndpoint?: Record<string, number> } = {
        count: existing.count + 1,
      };
      if (args.endpoint) {
        const byEndpoint = existing.byEndpoint ?? {};
        patch.byEndpoint = {
          ...byEndpoint,
          [args.endpoint]: (byEndpoint[args.endpoint] ?? 0) + 1,
        };
      }
      await ctx.db.patch(existing._id, patch);
    } else {
      const doc: {
        userId: typeof userId;
        date: string;
        count: number;
        byEndpoint?: Record<string, number>;
      } = {
        userId,
        date: today,
        count: 1,
      };
      if (args.endpoint) {
        doc.byEndpoint = { [args.endpoint]: 1 };
      }
      await ctx.db.insert("aiUsage", doc);
    }
  },
});
