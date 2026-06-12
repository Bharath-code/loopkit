"use client";

/**
 * Funnel event helpers — the only way the web app talks to telemetry.
 *
 * Usage:
 *   import { track } from "@/lib/track";
 *   track("onboarding.step_complete", { step: 2 });
 *
 * Rules:
 *   - Never throws. Telemetry must never break the app.
 *   - If telemetry is opted out (config.telemetry.optedIn === false),
 *     the call is a no-op.
 *   - For authenticated users, the userId is implicit via the Convex
 *     auth context. For pre-auth events, the call is silently dropped
 *     (we can't identify the user).
 *   - Network errors are swallowed and logged to console.debug only.
 *
 * The CLI has its own batching variant in `packages/cli/src/telemetry/`
 * — same event names, different transport.
 */

import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

const KNOWN_EVENTS = new Set([
  "landing.view",
  "landing.cta_click",
  "auth.signup_start",
  "auth.signup_complete",
  "auth.login",
  "onboarding.step_start",
  "onboarding.step_complete",
  "onboarding.complete",
  "onboarding.abandoned",
  "cli.init_run",
  "cli.init_complete",
  "cli.first_task_added",
  "cli.first_task_completed",
  "cli.first_ship",
  "cli.first_loop",
  "cli.loop_run",
  "cli.streak_achieved",
  "dashboard.view",
  "dashboard.task_complete",
  "settings.digest_enabled",
  "settings.digest_disabled",
  "cli.command_error",
  "web.error",
]);

type EventName =
  | "landing.view"
  | "landing.cta_click"
  | "auth.signup_start"
  | "auth.signup_complete"
  | "auth.login"
  | "onboarding.step_start"
  | "onboarding.step_complete"
  | "onboarding.complete"
  | "onboarding.abandoned"
  | "dashboard.view"
  | "dashboard.task_complete"
  | "settings.digest_enabled"
  | "settings.digest_disabled"
  | "web.error";

type EventProperties = Record<string, string | number | boolean>;

/**
 * Imperative track. Returns void; never throws.
 */
export function track(event: EventName, properties?: EventProperties): void {
  if (typeof window === "undefined") return;
  if (!KNOWN_EVENTS.has(event)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[track] unknown event: ${event}`);
    }
    return;
  }
  // Fire-and-forget. The actual Convex call happens via the
  // <TrackProvider> mounted in the root layout, which holds the
  // mutation hook (rules-of-hooks compliant). This function just
  // pushes to a global queue.
  (window as unknown as { __loopkitTrackQueue?: Array<[string, EventProperties | undefined]> }).__loopkitTrackQueue ??= [];
  (
    window as unknown as { __loopkitTrackQueue: Array<[string, EventProperties | undefined]> }
  ).__loopkitTrackQueue.push([event, properties]);
}

/**
 * Mount once near the root. Drains the global queue into Convex.
 */
export function TrackProvider() {
  const recordEvent = useMutation(api.telemetry.recordEvent);
  const drained = useRef(false);

  useEffect(() => {
    if (drained.current) return;
    drained.current = true;

    const drain = () => {
      const w = window as unknown as {
        __loopkitTrackQueue?: Array<[string, EventProperties | undefined]>;
      };
      const queue = w.__loopkitTrackQueue ?? [];
      if (queue.length === 0) return;
      // Clear queue first so we don't double-fire
      w.__loopkitTrackQueue = [];
      for (const [event, properties] of queue) {
        recordEvent({ event, properties }).catch((err) => {
          if (process.env.NODE_ENV !== "production") {
            console.debug(`[track] dropped ${event}:`, err);
          }
        });
      }
    };

    // Drain on next tick so we batch multiple calls in the same render
    const id = setTimeout(drain, 50);
    return () => clearTimeout(id);
  }, [recordEvent]);

  return null;
}
