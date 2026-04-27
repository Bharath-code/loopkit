import { z } from "zod";

// ─── loopkit init ───────────────────────────────────────────────

export const InitAnswersSchema = z.object({
  name: z.string().min(1),
  problem: z.string(),
  icp: z.string(),
  whyUnsolved: z.string(),
  mvp: z.string(),
});

export type InitAnswers = z.infer<typeof InitAnswersSchema>;

export const BriefSchema = z.object({
  bet: z.string(),
  icpScore: z.number().min(1).max(10),
  icpNote: z.string(),
  problemScore: z.number().min(1).max(10),
  problemNote: z.string(),
  mvpScore: z.number().min(1).max(10),
  mvpNote: z.string(),
  overallScore: z.number().min(1).max(10),
  riskiestAssumption: z.string(),
  validateAction: z.string(),
  mvpPlainEnglish: z.string(),
});

export type Brief = z.infer<typeof BriefSchema>;

// ─── loopkit track ──────────────────────────────────────────────

export const TaskStatus = z.enum(["open", "done", "snoozed", "cut"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: TaskStatus,
  createdAt: z.string(),
  closedAt: z.string().optional(),
  closedVia: z.string().optional(), // commit SHA
  snoozedUntil: z.string().optional(),
  section: z.enum(["week", "backlog"]),
});

export type Task = z.infer<typeof TaskSchema>;

// ─── loopkit ship ───────────────────────────────────────────────

export const ShipDraftsSchema = z.object({
  hn: z.object({
    title: z.string(),
    body: z.string(),
  }),
  twitter: z.object({
    tweets: z.array(z.string()),
  }),
  ih: z.object({
    body: z.string(),
  }),
});

export type ShipDrafts = z.infer<typeof ShipDraftsSchema>;

export const ShipLogSchema = z.object({
  date: z.string(),
  whatShipped: z.string(),
  checklist: z.record(z.boolean()),
  drafts: ShipDraftsSchema.optional(),
});

export type ShipLog = z.infer<typeof ShipLogSchema>;

// ─── loopkit pulse ──────────────────────────────────────────────

export const PulseResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  text: z.string().max(500),
  createdAt: z.string(),
});

export type PulseResponse = z.infer<typeof PulseResponseSchema>;

export const PulseClusterSchema = z.object({
  clusters: z.array(
    z.object({
      label: z.enum(["Fix now", "Validate later", "Noise"]),
      count: z.number(),
      pattern: z.string(),
      quotes: z.array(z.string()),
    })
  ),
  outliers: z.array(z.string()),
  confidence: z.number(),
  note: z.string(),
});

export type PulseCluster = z.infer<typeof PulseClusterSchema>;

// ─── loopkit loop ───────────────────────────────────────────────

export const LoopSynthesisSchema = z.object({
  oneThing: z.string(),
  rationale: z.string(),
  tension: z.string().nullable(),
  bipPost: z.string(),
});

export type LoopSynthesis = z.infer<typeof LoopSynthesisSchema>;

export const UnstuckTasksSchema = z.object({
  microTasks: z.array(z.string()).length(3),
  encouragement: z.string(),
});

export type UnstuckTasks = z.infer<typeof UnstuckTasksSchema>;

export const LoopLogSchema = z.object({
  weekNumber: z.number(),
  date: z.string(),
  tasksCompleted: z.number(),
  tasksTotal: z.number(),
  shippingScore: z.number(),
  synthesis: LoopSynthesisSchema.optional(),
  overridden: z.boolean().default(false),
  overrideReason: z.string().optional(),
  bipPost: z.string().optional(),
});

export type LoopLog = z.infer<typeof LoopLogSchema>;

// ─── Analytics: Shipping DNA ────────────────────────────────────

export const ShippingDNASchema = z.object({
  pattern: z.enum(["Marathoner", "Sprinter", "Perfectionist", "Reactor", "All-Star"]),
  patternDescription: z.string(),
  velocityTrend: z.enum(["accelerating", "steady", "declining", "volatile"]),
  avgTasksCompleted: z.number(),
  avgScore: z.number(),
  peakDay: z.string(),
  completionStyle: z.enum(["finisher", "starter", "balancer"]),
  totalWeeks: z.number(),
  streak: z.number(),
  riskWarnings: z.array(z.string()),
  strengths: z.array(z.string()),
});

export type ShippingDNA = z.infer<typeof ShippingDNASchema>;

// ─── Analytics: Churn Risk ──────────────────────────────────────

export const ChurnSignalSchema = z.object({
  type: z.enum(["declining_score", "skipped_loops", "rising_overrides", "low_velocity"]),
  severity: z.enum(["warning", "critical"]),
  message: z.string(),
});

export type ChurnSignal = z.infer<typeof ChurnSignalSchema>;

export const ChurnRiskSchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  signals: z.array(ChurnSignalSchema),
  suggestions: z.array(z.string()),
});

export type ChurnRisk = z.infer<typeof ChurnRiskSchema>;

// ─── Analytics: Success Predictor ───────────────────────────────

export const ShiftFactorSchema = z.object({
  factor: z.string(),
  impact: z.number(),
  direction: z.enum(["positive", "negative"]),
});

export type ShiftFactor = z.infer<typeof ShiftFactorSchema>;

export const SuccessPredictionSchema = z.object({
  probability: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  shiftFactors: z.array(ShiftFactorSchema),
  weeksAnalyzed: z.number(),
});

export type SuccessPrediction = z.infer<typeof SuccessPredictionSchema>;

// ─── Config ─────────────────────────────────────────────────────

export const TelemetryEventSchema = z.object({
  id: z.string(),
  command: z.string(),
  timestamp: z.string(),
  durationMs: z.number().optional(),
  error: z.string().optional(),
  weekNumber: z.number().optional(),
  projectType: z.string().optional(),
  hasShipLog: z.boolean().optional(),
  tasksCompleted: z.number().optional(),
  tasksTotal: z.number().optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export const TelemetryExportSchema = z.object({
  exportedAt: z.string(),
  distinctId: z.string(),
  weekCount: z.number(),
  events: z.array(TelemetryEventSchema),
});

export type TelemetryExport = z.infer<typeof TelemetryExportSchema>;

export const ConfigSchema = z.object({
  version: z.number().default(1),
  activeProject: z.string().optional(),
  distinctId: z.string().optional(),
  encryptionSalt: z.string().optional(),
  auth: z
    .object({
      apiKey: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      defaultEditor: z.string().optional(),
      autoOpenDashboard: z.boolean().default(true),
    })
    .optional(),
  telemetry: z
    .object({
      optedIn: z.boolean().default(false),
      prompted: z.boolean().default(false),
      promptWeek: z.number().optional(),
    })
    .optional(),
  coaching: z
    .object({
      enabled: z.boolean().default(true),
      lastShownMomentId: z.string().optional(),
      lastShownAt: z.string().optional(),
    })
    .optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// ─── IE-8: Trending Validations ─────────────────────────────────

export const TelemetryBriefSchema = z.object({
  icpCategory: z.string(),
  problemCategory: z.string(),
  mvpCategory: z.string(),
  weekNumber: z.number(),
  timestamp: z.string(),
});

export type TelemetryBrief = z.infer<typeof TelemetryBriefSchema>;

export const TrendingItemSchema = z.object({
  category: z.string(),
  count: z.number(),
  trend7d: z.number(),
  trend30d: z.number(),
  label: z.enum(["icp", "problem", "mvp"]),
});

export type TrendingItem = z.infer<typeof TrendingItemSchema>;

export const TrendingResponseSchema = z.object({
  icp: z.array(TrendingItemSchema),
  problem: z.array(TrendingItemSchema),
  mvp: z.array(TrendingItemSchema),
  totalFounders: z.number(),
  lastUpdated: z.string(),
});

export type TrendingResponse = z.infer<typeof TrendingResponseSchema>;

// ─── IE-15: Competitor Ship Radar ───────────────────────────────

export const CompetitorLaunchSchema = z.object({
  name: z.string(),
  url: z.string().url().optional(),
  date: z.string(),
  platform: z.enum(["producthunt", "hackernews", "twitter"]),
  relevance: z.number().min(0).max(100),
  description: z.string().optional(),
  tagline: z.string().optional(),
});

export type CompetitorLaunch = z.infer<typeof CompetitorLaunchSchema>;

export const CompetitorRadarResponseSchema = z.object({
  launches: z.array(CompetitorLaunchSchema),
  category: z.string(),
  scannedAt: z.string(),
  totalFound: z.number(),
});

export type CompetitorRadarResponse = z.infer<typeof CompetitorRadarResponseSchema>;

// ─── IE-16: Keyword Opportunity Finder ──────────────────────────

export const KeywordOpportunitySchema = z.object({
  keyword: z.string(),
  score: z.number().min(0),
  volume: z.enum(["high", "medium", "low"]),
  competition: z.enum(["low", "medium", "high"]),
  sources: z.array(z.string()),
  suggestions: z.array(z.string()).optional(),
});

export type KeywordOpportunity = z.infer<typeof KeywordOpportunitySchema>;

export const KeywordFinderResponseSchema = z.object({
  opportunities: z.array(KeywordOpportunitySchema),
  category: z.string(),
  scannedAt: z.string(),
  totalFound: z.number(),
});

export type KeywordFinderResponse = z.infer<typeof KeywordFinderResponseSchema>;

// ─── IE-17: Market Timing Signal ────────────────────────────────

export const MarketTrendDirectionSchema = z.enum(["up", "down", "stable"]);
export type MarketTrendDirection = z.infer<typeof MarketTrendDirectionSchema>;

export const MarketSignalSchema = z.object({
  category: z.string(),
  fundingTrend: MarketTrendDirectionSchema,
  fundingCount: z.number().default(0),
  devTrend: MarketTrendDirectionSchema,
  devGrowth: z.number().default(0),
  hiringTrend: MarketTrendDirectionSchema,
  hiringCount: z.number().default(0),
  compositeScore: z.number().min(0).max(100),
  signal: z.enum(["heating", "cooling", "stable"]),
  lastUpdated: z.string(),
});

export type MarketSignal = z.infer<typeof MarketSignalSchema>;

export const MarketTimingResponseSchema = z.object({
  category: z.string(),
  signal: MarketSignalSchema,
  scannedAt: z.string(),
});

export type MarketTimingResponse = z.infer<typeof MarketTimingResponseSchema>;

// ─── IE-9: Pattern Interrupt ────────────────────────────────────

export const PatternTypeSchema = z.enum([
  "overplanner",
  "snooze_loop",
  "ship_avoider",
  "icp_drift",
  "scope_creep",
]);

export type PatternType = z.infer<typeof PatternTypeSchema>;

export const DetectedPatternSchema = z.object({
  type: PatternTypeSchema,
  severity: z.enum(["warning", "critical"]),
  message: z.string(),
  suggestions: z.array(z.string()).max(2),
  weeksObserved: z.number().min(1),
});

export type DetectedPattern = z.infer<typeof DetectedPatternSchema>;

export const PatternInterruptResponseSchema = z.object({
  patterns: z.array(DetectedPatternSchema),
  totalWeeks: z.number(),
  scannedAt: z.string(),
});

export type PatternInterruptResponse = z.infer<typeof PatternInterruptResponseSchema>;

// ─── IE-7: Anonymous Peer Inspiration ───────────────────────────

export const PeerShipSchema = z.object({
  id: z.string(),
  category: z.string(),
  whatShipped: z.string(),
  weekNumber: z.number(),
  createdAt: z.string(),
});

export type PeerShip = z.infer<typeof PeerShipSchema>;

export const PeerInspirationResponseSchema = z.object({
  category: z.string(),
  peers: z.array(PeerShipSchema),
  totalPeers: z.number(),
  fetchedAt: z.string(),
});

export type PeerInspirationResponse = z.infer<typeof PeerInspirationResponseSchema>;

// ─── IE-10: AI Coach ────────────────────────────────────────────

export const CoachingPrioritySchema = z.enum(["critical", "warning", "info"]);
export type CoachingPriority = z.infer<typeof CoachingPrioritySchema>;

export const CoachingMomentSchema = z.object({
  id: z.string(),
  week: z.number().optional(),
  priority: CoachingPrioritySchema,
  title: z.string(),
  message: z.string(),
  action: z.string(),
  command: z.string().optional(),
  condition: z.string(),
});

export type CoachingMoment = z.infer<typeof CoachingMomentSchema>;

export const CoachingPlanSchema = z.object({
  moments: z.array(CoachingMomentSchema),
  totalWeeks: z.number(),
  dna: ShippingDNASchema.optional(),
  churnRisk: ChurnRiskSchema.optional(),
  prediction: SuccessPredictionSchema.optional(),
  activePatterns: z.array(DetectedPatternSchema).optional(),
  generatedAt: z.string(),
});

export type CoachingPlan = z.infer<typeof CoachingPlanSchema>;

// ─── Helpers ────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getWeekNumber(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

// ─── F5: Project Templates ──────────────────────────────────────

export const ProjectTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icpHint: z.string(),
  taskScaffold: z.array(z.string()),
  category: z.string(),
});

export type ProjectTemplate = z.infer<typeof ProjectTemplateSchema>;

// ─── Project Category Detection ─────────────────────────────────

const PROJECT_KEYWORDS: Record<string, string[]> = {
  saas: ["saas", "subscription", "b2b", "platform", "dashboard", "crm"],
  mobile: ["app", "ios", "android", "mobile", "flutter", "react native"],
  cli: ["cli", "command", "terminal", "tool", "npm", "script"],
  api: ["api", "backend", "endpoint", "microservice"],
  newsletter: ["newsletter", "blog", "content", "writing", "media"],
  marketplace: ["marketplace", "two-sided", "matching", "booking"],
  ai: ["ai ", "llm", "gpt", "machine learning", "ml", "model"],
  ecommerce: ["shop", "store", "ecommerce", "checkout", "cart"],
};

export function detectProjectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return type;
    }
  }
  return "general";
}
