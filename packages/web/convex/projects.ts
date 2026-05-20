import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const toggleShare = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== userId) {
      throw new Error("Forbidden");
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    const isPro =
      subscription &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > Date.now();

    let tier: "free" | "solo" | "pro" = "free";
    if (isPro) {
      const priceId = subscription.polarPriceId || "";
      const soloPriceId = process.env.POLAR_SOLO_PRICE_ID;
      const proPriceId = process.env.POLAR_PRO_PRICE_ID;

      if (proPriceId && priceId === proPriceId) {
        tier = "pro";
      } else if (soloPriceId && priceId === soloPriceId) {
        tier = "solo";
      } else if (priceId.toLowerCase().includes("pro")) {
        tier = "pro";
      } else if (priceId.toLowerCase().includes("solo")) {
        tier = "solo";
      } else {
        tier = "pro";
      }
    }

    if (tier !== "pro") {
      throw new Error("Advisor Share is only available for Pro tier subscribers.");
    }

    const isShared = !project.isShared;
    const shareToken = isShared
      ? (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
      : undefined;

    await ctx.db.patch(args.projectId, {
      isShared,
      shareToken,
    });

    return { isShared, shareToken };
  },
});

export const getSharedProject = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!project || !project.isShared) {
      return null;
    }

    const loopLogs = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .order("desc")
      .collect();

    const user = await ctx.db.get(project.userId);

    return {
      project,
      loopLogs,
      user: user
        ? {
            name: user.name,
            email: user.email,
            image: user.image,
          }
        : null,
    };
  },
});
