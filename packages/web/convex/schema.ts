import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // Your other tables...
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"]),
  
  subscriptions: defineTable({
    userId: v.id("users"),
    polarId: v.string(),
    polarPriceId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
  }).index("by_user", ["userId"]).index("by_polar_id", ["polarId"]),
  
  pulseResponses: defineTable({
    projectId: v.id("projects"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),
  
  loopLogs: defineTable({
    projectId: v.id("projects"),
    weekNumber: v.number(),
    date: v.string(),
    tasksCompleted: v.number(),
    tasksTotal: v.number(),
    shippingScore: v.number(),
    synthesis: v.optional(
      v.object({
        oneThing: v.string(),
        rationale: v.string(),
        tension: v.union(v.string(), v.null()),
        bipPost: v.string(),
      })
    ),
    overridden: v.boolean(),
    overrideReason: v.optional(v.string()),
    bipPost: v.optional(v.string()),
  }).index("by_project", ["projectId"]),

  aiUsage: defineTable({
    userId: v.id("users"),
    date: v.string(),
    count: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  briefAggregates: defineTable({
    icpCategory: v.string(),
    problemCategory: v.string(),
    mvpCategory: v.string(),
    weekNumber: v.number(),
    submittedAt: v.number(),
  })
    .index("by_week", ["weekNumber"])
    .index("by_icp", ["icpCategory"])
    .index("by_problem", ["problemCategory"])
    .index("by_mvp", ["mvpCategory"])
    .index("by_submittedAt", ["submittedAt"]),
});
