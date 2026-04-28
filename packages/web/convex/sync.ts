import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertProjectOwner } from "./authHelpers";

export const syncShipLog = mutation({
  args: {
    projectId: v.id("projects"),
    date: v.string(),
    whatShipped: v.string(),
    drafts: v.optional(
      v.object({
        hn: v.optional(v.object({ title: v.string(), body: v.string() })),
        twitter: v.optional(v.object({ tweets: v.array(v.string()) })),
        ih: v.optional(v.object({ body: v.string() })),
      })
    ),
    checklist: v.optional(
      v.object({
        readmeUpdated: v.boolean(),
        landingPageLive: v.boolean(),
        analyticsPresent: v.boolean(),
        feedbackWidgetInstalled: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await assertProjectOwner(ctx, args.projectId);

    const existing = await ctx.db
      .query("shipLogs")
      .withIndex("by_project_date", (q) =>
        q.eq("projectId", args.projectId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        whatShipped: args.whatShipped,
        drafts: args.drafts,
        checklist: args.checklist,
      });
      return { updated: true, shipLogId: existing._id };
    }

    const shipLogId = await ctx.db.insert("shipLogs", {
      projectId: args.projectId,
      date: args.date,
      whatShipped: args.whatShipped,
      drafts: args.drafts,
      checklist: args.checklist,
      createdAt: Date.now(),
    });

    return { updated: false, shipLogId };
  },
});

export const syncLoopLog = mutation({
  args: {
    projectId: v.id("projects"),
    weekNumber: v.number(),
    date: v.string(),
    tasksCompleted: v.number(),
    tasksTotal: v.number(),
    shippingScore: v.number(),
    synthesis: v.optional(
      v.object({
        weekWin: v.optional(v.string()),
        oneThing: v.string(),
        rationale: v.string(),
        tension: v.union(v.string(), v.null()),
        bipPost: v.string(),
        founderNote: v.optional(v.string()),
      })
    ),
    proof: v.optional(
      v.object({
        previousScore: v.number(),
        currentScore: v.number(),
        scoreDelta: v.number(),
        weeksActive: v.number(),
        decisionsMade: v.number(),
        feedbackResponses: v.number(),
        feedbackActedOn: v.boolean(),
      })
    ),
    overridden: v.boolean(),
    overrideReason: v.optional(v.string()),
    bipPost: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertProjectOwner(ctx, args.projectId);

    // Check if a log for this week already exists
    const existing = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("weekNumber"), args.weekNumber))
      .first();

    if (existing) {
      // Update existing log
      await ctx.db.patch(existing._id, {
        date: args.date,
        tasksCompleted: args.tasksCompleted,
        tasksTotal: args.tasksTotal,
        shippingScore: args.shippingScore,
        synthesis: args.synthesis,
        proof: args.proof,
        overridden: args.overridden,
        overrideReason: args.overrideReason,
        bipPost: args.bipPost,
      });
      return { updated: true, loopLogId: existing._id };
    }

    // Insert new log
    const loopLogId = await ctx.db.insert("loopLogs", {
      projectId: args.projectId,
      weekNumber: args.weekNumber,
      date: args.date,
      tasksCompleted: args.tasksCompleted,
      tasksTotal: args.tasksTotal,
      shippingScore: args.shippingScore,
      synthesis: args.synthesis,
      proof: args.proof,
      overridden: args.overridden,
      overrideReason: args.overrideReason,
      bipPost: args.bipPost,
    });

    return { updated: false, loopLogId };
  },
});
