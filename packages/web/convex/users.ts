import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    const isActive =
      subscription &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > Date.now();

    let tier: "free" | "solo" | "pro" = "free";
    if (isActive) {
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
        tier = "pro"; // Default to pro for active unrecognized subscriptions
      }
    }

    return {
      ...user,
      tier,
    };
  },
});
