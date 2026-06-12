/**
 * POST /api/telemetry/ingest
 *
 * Receives a batch of CLI events and writes them to the funnelEvents
 * table. This is the bridge between the offline-tolerant CLI queue
 * and the Convex backend.
 *
 * No auth: the CLI is identified by its `distinctId` (a locally
 * generated random id), not by a user token. Pre-auth events flow
 * through here and get linked to the user later via /api/telemetry/bind.
 *
 * Hard cap: 100 events per call, 1000 events per minute per distinctId
 * (defense against a compromised CLI spamming the table).
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

const VALID_EVENTS = new Set([
  "cli.init_run",
  "cli.init_complete",
  "cli.first_task_added",
  "cli.first_task_completed",
  "cli.first_ship",
  "cli.first_loop",
  "cli.loop_run",
  "cli.streak_achieved",
  "cli.command_error",
]);

const recentIngestByDistinct = new Map<string, number[]>();
const RATE_LIMIT_PER_MIN = 1000;

function isAllowed(distinctId: string, count: number): boolean {
  const now = Date.now();
  const recent = (recentIngestByDistinct.get(distinctId) ?? []).filter(
    (t) => now - t < 60_000,
  );
  if (recent.reduce((a, t) => a + 1, 0) + count > RATE_LIMIT_PER_MIN) {
    return false;
  }
  for (let i = 0; i < count; i++) recent.push(now);
  recentIngestByDistinct.set(distinctId, recent);
  return true;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as {
    distinctId?: string;
    events?: Array<{
      event?: string;
      properties?: Record<string, string | number | boolean>;
      occurredAt?: number;
    }>;
  };

  if (typeof parsed.distinctId !== "string" || parsed.distinctId.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing distinctId" }, { status: 400 });
  }
  if (!Array.isArray(parsed.events) || parsed.events.length === 0) {
    return NextResponse.json({ ok: true, accepted: 0 });
  }
  if (parsed.events.length > 100) {
    return NextResponse.json({ ok: false, error: "Batch too large (max 100)" }, { status: 413 });
  }

  // Filter to valid events with valid shape
  const events = parsed.events
    .filter(
      (e): e is { event: string; properties?: Record<string, string | number | boolean>; occurredAt: number } =>
        typeof e?.event === "string" &&
        VALID_EVENTS.has(e.event) &&
        typeof e.occurredAt === "number",
    )
    .map((e) => ({
      event: e.event,
      properties: e.properties,
      occurredAt: e.occurredAt,
    }));

  if (events.length === 0) {
    return NextResponse.json({ ok: true, accepted: 0 });
  }

  if (!isAllowed(parsed.distinctId, events.length)) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded for this distinctId" },
      { status: 429 },
    );
  }

  try {
    const result = await fetchMutation(api.telemetry.recordEventsBatch, {
      distinctId: parsed.distinctId,
      events,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Telemetry ingest failed:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
