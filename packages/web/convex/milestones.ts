import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Milestone types
export const MILESTONE_TYPES = {
  WEEK_1_COMPLETE: "week_1_complete",
  WEEK_4_COMPLETE: "week_4_complete",
  FIRST_REVENUE: "first_revenue",
  STREAK_BREAK: "streak_break",
  PEER_PASSED: "peer_passed",
} as const;

export const triggerMilestone = mutation({
  args: {
    milestoneType: v.string(),
    projectId: v.optional(v.id("projects")),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if this milestone was already triggered for this user/type/project
    const existingTrigger = await ctx.db
      .query("milestoneTriggers")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", userId).eq("milestoneType", args.milestoneType)
      )
      .first();

    if (existingTrigger) {
      // Milestone already triggered, skip
      return { triggered: false, reason: "already_triggered" };
    }

    // Create the milestone trigger record
    const triggerId = await ctx.db.insert("milestoneTriggers", {
      userId,
      milestoneType: args.milestoneType,
      projectId: args.projectId,
      triggeredAt: Date.now(),
      metadata: args.metadata,
    });

    return { triggered: true, triggerId };
  },
});

export const getTriggeredMilestones = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const triggers = await ctx.db
      .query("milestoneTriggers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return triggers;
  },
});

export const hasTriggeredMilestone = query({
  args: {
    milestoneType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const trigger = await ctx.db
      .query("milestoneTriggers")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", userId).eq("milestoneType", args.milestoneType)
      )
      .first();

    return !!trigger;
  },
});

export const postPublicWin = mutation({
  args: {
    projectId: v.id("projects"),
    productName: v.string(),
    weekNum: v.number(),
    shippingScore: v.number(),
    streak: v.number(),
    tasksCompleted: v.number(),
    tasksTotal: v.number(),
    feedbackCount: v.number(),
    loopkitScore: v.optional(v.number()),
    mrr: v.optional(v.number()),
    oneThing: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const winId = await ctx.db.insert("publicWins", {
      userId,
      projectId: args.projectId,
      productName: args.productName,
      weekNum: args.weekNum,
      shippingScore: args.shippingScore,
      streak: args.streak,
      tasksCompleted: args.tasksCompleted,
      tasksTotal: args.tasksTotal,
      feedbackCount: args.feedbackCount,
      loopkitScore: args.loopkitScore,
      mrr: args.mrr,
      oneThing: args.oneThing,
      createdAt: Date.now(),
    });

    return { winId };
  },
});
