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
  })
    .index("by_user", ["userId"])
    .index("by_polar_id", ["polarId"]),

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
        weekWin: v.optional(v.string()),
        oneThing: v.string(),
        rationale: v.string(),
        tension: v.union(v.string(), v.null()),
        bipPost: v.string(),
        founderNote: v.optional(v.string()),
      }),
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
      }),
    ),
    overridden: v.boolean(),
    overrideReason: v.optional(v.string()),
    bipPost: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_date", ["projectId", "date"])
    .index("by_date", ["date"]),

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

  keywordOpportunities: defineTable({
    category: v.string(),
    keyword: v.string(),
    score: v.number(),
    volume: v.string(),
    competition: v.string(),
    sources: v.array(v.string()),
    suggestions: v.optional(v.array(v.string())),
    volumeProxy: v.optional(v.number()),
    competitionProxy: v.optional(v.number()),
    lastScanned: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_category_score", ["category", "score"]),

  marketSignals: defineTable({
    category: v.string(),
    fundingTrend: v.string(),
    fundingCount: v.number(),
    devTrend: v.string(),
    devGrowth: v.number(),
    hiringTrend: v.string(),
    hiringCount: v.number(),
    compositeScore: v.number(),
    signal: v.string(),
    lastUpdated: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_lastUpdated", ["lastUpdated"]),

  patternInterrupts: defineTable({
    projectId: v.id("projects"),
    type: v.string(),
    severity: v.string(),
    message: v.string(),
    suggestions: v.array(v.string()),
    weeksObserved: v.number(),
    resolved: v.boolean(),
    detectedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_resolved", ["projectId", "resolved"]),

  peerShips: defineTable({
    category: v.string(),
    whatShipped: v.string(),
    weekNumber: v.number(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_category_createdAt", ["category", "createdAt"]),

  competitorLaunches: defineTable({
    category: v.string(),
    name: v.string(),
    url: v.optional(v.string()),
    date: v.string(),
    platform: v.string(),
    relevance: v.number(),
    description: v.optional(v.string()),
    tagline: v.optional(v.string()),
    scannedAt: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_category_date", ["category", "date"])
    .index("by_category_relevance", ["category", "relevance"]),

  cliAuthSessions: defineTable({
    code: v.string(),
    status: v.string(),
    token: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  shipLogs: defineTable({
    projectId: v.id("projects"),
    date: v.string(),
    whatShipped: v.string(),
    drafts: v.optional(
      v.object({
        hn: v.optional(v.object({ title: v.string(), body: v.string() })),
        twitter: v.optional(v.object({ tweets: v.array(v.string()) })),
        ih: v.optional(v.object({ body: v.string() })),
      }),
    ),
    checklist: v.optional(
      v.object({
        readmeUpdated: v.boolean(),
        landingPageLive: v.boolean(),
        analyticsPresent: v.boolean(),
        feedbackWidgetInstalled: v.boolean(),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_date", ["projectId", "date"]),

  milestoneTriggers: defineTable({
    userId: v.id("users"),
    milestoneType: v.string(),
    projectId: v.optional(v.id("projects")),
    triggeredAt: v.number(),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "milestoneType"])
    .index("by_project", ["projectId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    emailOptIn: v.boolean(),
    pushOptIn: v.boolean(),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.id("users")),
    leaderboardOptIn: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_referral_code", ["referralCode"]),

  publicWins: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_created_at", ["createdAt"]),
});
