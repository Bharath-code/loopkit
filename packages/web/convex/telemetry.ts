/**
 * Funnel telemetry — the single source of truth for retention.
 *
 * Two entry points:
 *   - recordEvent: called by the web dashboard (authenticated)
 *   - recordEventsBatch: called by the CLI (offline-tolerant, batched)
 *
 * Design choices:
 *   - Schema is the smallest viable one: event name + user + tiny props
 *   - No PII, no brief content, no task titles — just shape and timing
 *   - The CLI batches up to 100 events per call (queue file in .loopkit/)
 *   - All events are opt-in via config.telemetry.optedIn
 *   - Failures are silent — telemetry must never break a command
 *
 * Computed metrics (funnelStats query):
 *   - signups (unique users with auth.signup_complete)
 *   - activated (signed up + completed onboarding)
 *   - first_loop (unique users with cli.first_loop or loop.first_loop)
 *   - 7d / 30d retention
 *   - time-to-first-loop median
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const KNOWN_EVENTS = new Set([
  // Acquisition
  "landing.view",
  "landing.cta_click",
  // Auth
  "auth.signup_start",
  "auth.signup_complete",
  "auth.login",
  // Onboarding
  "onboarding.step_start",
  "onboarding.step_complete",
  "onboarding.complete",
  "onboarding.abandoned",
  // Core value
  "cli.init_run",
  "cli.init_complete",
  "cli.first_task_added",
  "cli.first_task_completed",
  "cli.first_ship",
  "cli.first_loop",
  "cli.loop_run",
  "cli.streak_achieved",
  // Engagement
  "dashboard.view",
  "dashboard.task_complete",
  "settings.digest_enabled",
  "settings.digest_disabled",
  // Failure
  "cli.command_error",
  "web.error",
]);

function validateEventName(name: string): boolean {
  return KNOWN_EVENTS.has(name) || /^cli\.loop_streak_\d+$/.test(name);
}

/**
 * Record a single event from an authenticated web user.
 * Used by the dashboard and onboarding flow.
 */
export const recordEvent = mutation({
  args: {
    event: v.string(),
    properties: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean()),
      ),
    ),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!validateEventName(args.event)) {
      return { ok: false, error: `Unknown event: ${args.event}` };
    }

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const distinctId = (user as { _id?: string })?._id?.toString() ?? `anon_${Math.random().toString(36).slice(2, 10)}`;

    const now = Date.now();
    await ctx.db.insert("funnelEvents", {
      userId: userId ?? undefined,
      distinctId,
      event: args.event,
      source: "web",
      properties: args.properties,
      occurredAt: args.occurredAt ?? now,
      receivedAt: now,
    });

    return { ok: true };
  },
});

/**
 * Record a batch of events from the CLI.
 *
 * The CLI queues events locally (in .loopkit/telemetry-queue.json)
 * and flushes them in batches of up to 100 whenever it has network.
 * Pre-auth events (e.g. `cli.init_run` before `loopkit auth`) use
 * the locally-generated `distinctId` from config.json. The first
 * post-auth flush binds the `distinctId` to the user's `userId`.
 */
export const recordEventsBatch = mutation({
  args: {
    distinctId: v.string(),
    events: v.array(
      v.object({
        event: v.string(),
        properties: v.optional(
          v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean()),
          ),
        ),
        occurredAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (args.events.length === 0) {
      return { ok: true, accepted: 0 };
    }
    if (args.events.length > 100) {
      return { ok: false, error: "Batch too large (max 100)" };
    }

    let accepted = 0;
    const now = Date.now();

    for (const e of args.events) {
      if (!validateEventName(e.event)) continue;
      await ctx.db.insert("funnelEvents", {
        distinctId: args.distinctId,
        event: e.event,
        source: "cli",
        properties: e.properties,
        occurredAt: e.occurredAt,
        receivedAt: now,
      });
      accepted++;
    }

    return { ok: true, accepted };
  },
});

/**
 * Bind a distinctId to a userId. Called by the CLI after
 * `loopkit auth` succeeds — links all pre-auth events to the user.
 */
export const bindDistinctId = mutation({
  args: { distinctId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { ok: false, error: "Not authenticated" };

    // Backfill userId on existing events for this distinctId
    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_distinct", (q) => q.eq("distinctId", args.distinctId))
      .collect();

    for (const e of events) {
      if (!e.userId) {
        await ctx.db.patch(e._id, { userId });
      }
    }

    return { ok: true, bound: events.length };
  },
});

/**
 * Funnel summary — read by the /admin/funnel dashboard.
 * Computes: unique users per stage, conversion %, time-to-first-loop.
 */
export const funnelStats = query({
  args: {
    windowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.windowDays ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const all = await ctx.db
      .query("funnelEvents")
      .withIndex("by_time", (q) => q.gte("occurredAt", cutoff))
      .collect();

    const byEvent = (event: string) => all.filter((e) => e.event === event);
    const uniqueUsers = (event: string) => {
      const users = new Set<string>();
      for (const e of byEvent(event)) {
        if (e.userId) users.add(e.userId);
        else users.add(e.distinctId);
      }
      return users.size;
    };

    const signups = uniqueUsers("auth.signup_complete");
    const onboarded = uniqueUsers("onboarding.complete");
    const inited = uniqueUsers("cli.init_complete");
    const firstShip = uniqueUsers("cli.first_ship");
    const firstLoop = uniqueUsers("cli.first_loop");
    const streak4Plus = all.filter(
      (e) => /^cli\.streak_achieved$/.test(e.event) || /^cli\.loop_streak_[4-9]\d*$/.test(e.event),
    ).length;
    const errorEvents = byEvent("cli.command_error").length;

    // Time-to-first-loop: for users with first_loop, median ms from signup
    const firstLoopTimes: number[] = [];
    const signupTimes = new Map<string, number>();
    for (const e of byEvent("auth.signup_complete")) {
      const id = e.userId ?? e.distinctId;
      const prev = signupTimes.get(id);
      if (!prev || e.occurredAt < prev) signupTimes.set(id, e.occurredAt);
    }
    for (const e of byEvent("cli.first_loop")) {
      const id = e.userId ?? e.distinctId;
      const signup = signupTimes.get(id);
      if (signup) firstLoopTimes.push(e.occurredAt - signup);
    }
    firstLoopTimes.sort((a, b) => a - b);
    const medianTimeToFirstLoop =
      firstLoopTimes.length === 0
        ? null
        : firstLoopTimes[Math.floor(firstLoopTimes.length / 2)];

    return {
      windowDays: days,
      signups,
      onboarded,
      activated: inited, // alias for clarity
      firstShip,
      firstLoop,
      streakMilestones: streak4Plus,
      errorEvents,
      // Conversion ratios
      onboardingRate: signups > 0 ? onboarded / signups : 0,
      activationRate: onboarded > 0 ? inited / onboarded : 0,
      firstLoopRate: inited > 0 ? firstLoop / inited : 0,
      // Retention
      medianTimeToFirstLoopMs: medianTimeToFirstLoop,
      medianTimeToFirstLoopDays:
        medianTimeToFirstLoop != null
          ? Math.round(medianTimeToFirstLoop / (24 * 60 * 60 * 1000))
          : null,
    };
  },
});

/**
 * Recent events stream — for debugging and live monitoring.
 */
export const recentEvents = query({
  args: {
    limit: v.optional(v.number()),
    event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const all = await ctx.db
      .query("funnelEvents")
      .withIndex("by_time")
      .order("desc")
      .take(limit * 4);

    const filtered = args.event
      ? all.filter((e) => e.event === args.event)
      : all;

    return filtered.slice(0, limit);
  },
});
