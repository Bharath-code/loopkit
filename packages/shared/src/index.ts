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
