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

export const ConfigSchema = z.object({
  version: z.number().default(1),
  activeProject: z.string().optional(),
  distinctId: z.string().optional(),
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
});

export type Config = z.infer<typeof ConfigSchema>;

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
