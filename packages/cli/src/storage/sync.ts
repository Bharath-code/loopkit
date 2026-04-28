import { readConfig, readBriefJson } from "./local.js";

const API_URL = process.env.LOOPKIT_API_URL || "http://localhost:3000";

interface LoopLogSyncPayload {
  projectId: string;
  weekNumber: number;
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  shippingScore: number;
  synthesis?: {
    oneThing: string;
    rationale: string;
    tension: string | null;
    bipPost: string;
  };
  overridden: boolean;
  overrideReason?: string;
  bipPost?: string;
}

interface ShipLogSyncPayload {
  projectId: string;
  date: string;
  whatShipped: string;
  drafts?: {
    hn?: { title: string; body: string };
    twitter?: { tweets: string[] };
    ih?: { body: string };
  };
  checklist?: {
    readmeUpdated: boolean;
    landingPageLive: boolean;
    analyticsPresent: boolean;
    feedbackWidgetInstalled: boolean;
  };
}

async function postSync(path: string, body: unknown): Promise<void> {
  const config = readConfig();
  const token = config.auth?.apiKey;
  if (!token) return; // Silently skip if not authenticated

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.debug("Sync failed:", res.status);
    }
  } catch {
    // Network error — ignore, local data is preserved
  }
}

export async function pushLoopLogToConvex(
  payload: LoopLogSyncPayload,
): Promise<void> {
  await postSync("/api/sync/loop", payload);
}

export async function pushShipLogToConvex(
  payload: ShipLogSyncPayload,
): Promise<void> {
  await postSync("/api/sync/ship", payload);
}

interface RadarSyncPayload {
  category: string;
  launches: {
    name: string;
    url?: string;
    date: string;
    platform: string;
    relevance: number;
    description?: string;
    tagline?: string;
  }[];
  scannedAt: string;
}

export async function pushRadarToConvex(
  payload: RadarSyncPayload,
): Promise<void> {
  await postSync("/api/sync/radar", payload);
}

interface TimingSyncPayload {
  category: string;
  fundingTrend: string;
  fundingCount: number;
  devTrend: string;
  devGrowth: number;
  hiringTrend: string;
  hiringCount: number;
  compositeScore: number;
  signal: string;
}

export async function pushTimingToConvex(
  payload: TimingSyncPayload,
): Promise<void> {
  await postSync("/api/sync/timing", payload);
}

export function getConvexProjectId(slug: string): string | undefined {
  const brief = readBriefJson(slug);
  return brief?.convexProjectId;
}
