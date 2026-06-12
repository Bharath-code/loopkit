/**
 * Convex crons.
 *
 * Schedules the Sunday morning digest to fire at 13:00 UTC (= 9am ET,
 * 6am PT, midnight UTC+11). Convex crons are UTC-only; we approximate
 * a single global send window. For true per-user TZ, a v0.3.0
 * improvement would be to use user.timezone (if we add it to users)
 * and stagger sends via per-user scheduled messages.
 *
 * Requires `RESEND_API_KEY` and `DIGEST_FROM_ADDRESS` env vars.
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sunday 13:00 UTC. Convex cron syntax: "0 13 * * 0"
crons.weekly(
  "send-sunday-digest",
  { hourUTC: 13, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.email.sendWeeklyDigestToAll,
);

export default crons;
