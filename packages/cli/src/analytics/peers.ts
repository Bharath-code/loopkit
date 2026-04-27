import { getWeekNumber, detectProjectCategory } from "@loopkit/shared";
import { readConfig, readBriefJson } from "../storage/local.js";
import { isTelemetryEnabled } from "./telemetry.js";

export interface PeerShip {
  _id: string;
  category: string;
  whatShipped: string;
  weekNumber: number;
  createdAt: number;
}

function getCategoryFromBrief(slug: string): string {
  const briefData = readBriefJson(slug);
  if (!briefData?.answers?.mvp) return "general";
  const text = `${briefData.answers.mvp} ${briefData.answers.icp || ""}`;
  return detectProjectCategory(text);
}

function getApiUrl(): string {
  return process.env.LOOPKIT_API_URL || "http://localhost:3000";
}

function getAuthToken(): string | null {
  const config = readConfig();
  return config.auth?.apiKey || null;
}

export async function fetchPeerShips(slug: string, limit = 3): Promise<PeerShip[]> {
  if (!isTelemetryEnabled()) return [];

  const category = getCategoryFromBrief(slug);
  const token = getAuthToken();
  if (!token) return [];

  try {
    const res = await fetch(
      `${getApiUrl()}/api/peers?category=${encodeURIComponent(category)}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.peers || [];
  } catch {
    return [];
  }
}

export async function recordPeerShip(slug: string, whatShipped: string): Promise<void> {
  if (!isTelemetryEnabled()) return;

  const category = getCategoryFromBrief(slug);
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${getApiUrl()}/api/peers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        category,
        whatShipped,
        weekNumber: getWeekNumber(),
      }),
    });
  } catch {
    // Silently fail — peer recording is best-effort
  }
}

export function renderPeerInspiration(peers: PeerShip[], category: string): string {
  if (peers.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push("");
  lines.push(`  🚀 Peer Inspiration — This week in ${category}:`);
  lines.push("");

  for (const p of peers) {
    lines.push(`    • ${p.whatShipped}`);
  }

  lines.push("");
  lines.push("  You're not alone. Keep shipping.");
  lines.push("");

  return lines.join("\n");
}
