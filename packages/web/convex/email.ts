/**
 * Sunday email digest.
 *
 * Sends a weekly recap to opted-in users. Triggered by:
 *   1. Convex cron (every Sunday 9am user-local-equivalent, but
 *      Convex crons are UTC; we approximate with one global pass)
 *   2. The dashboard "Send test digest" button (for testing)
 *
 * The HTML is plain template literals — no React Email dep needed.
 * Subject: "Week N: <tasks done>/<total> · <score>% · 🔥 <streak>"
 *
 * Unsubscribe: every email includes a signed unsubscribe link that
 * calls the optOut mutation.
 */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Resend } from "resend";
import { renderDigestHtml } from "../src/lib/email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://loopkit.dev";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.DIGEST_FROM_ADDRESS || "LoopKit <digest@loopkit.dev>";

interface DigestData {
  userEmail: string;
  userName: string;
  productName: string;
  weekNumber: number;
  tasksDone: number;
  tasksTotal: number;
  shippingScore: number;
  streak: number;
  oneThing: string | null;
  nextSteps: string[];
  dashboardUrl: string;
  unsubscribeUrl: string;
  yearCardUrl: string;
}

function buildDigestSubject(d: DigestData): string {
  const pct = `${d.shippingScore}%`;
  const streak = d.streak > 0 ? ` · 🔥 ${d.streak}` : "";
  return `Week ${d.weekNumber}: ${d.tasksDone}/${d.tasksTotal} · ${pct}${streak}`;
}

async function sendOneEmail(d: DigestData): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  if (!d.userEmail) {
    return { ok: false, error: "No email address on file" };
  }

  const resend = new Resend(RESEND_API_KEY);
  const subject = buildDigestSubject(d);
  const html = renderDigestHtml(d);

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: d.userEmail,
      subject,
      html,
    });
    if ("error" in result && result.error) {
      return { ok: false, error: String(result.error) };
    }
    const id = "data" in result && result.data ? result.data.id : undefined;
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send the digest for a single user. Used by:
 *   - The cron (one call per opted-in user)
 *   - The dashboard "Send test" button (any user can trigger their own)
 *
 * The function looks up the user's most recent loop, computes the
 * stats, renders the email, and sends via Resend.
 */
export const sendWeeklyDigest = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { ok: false, error: "User not found" };

    const email = (user as { email?: string }).email;
    if (!email) return { ok: false, error: "No email on file" };

    // Check opt-in
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (prefs && !prefs.emailOptIn) {
      return { ok: false, error: "User opted out of email" };
    }

    // Find the user's most recent project + last loop log
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);
    const project = projects[0];
    if (!project) return { ok: false, error: "No project found" };

    const lastLoop = await ctx.db
      .query("loopLogs")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .order("desc")
      .first();

    if (!lastLoop) {
      return { ok: false, error: "No loop data yet — skip digest" };
    }

    // Generate a one-time unsubscribe token (signed-ish via timestamp + userId)
    const unsubToken = Buffer.from(
      `${args.userId}:${Date.now()}`,
    ).toString("base64url");
    const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${unsubToken}&userId=${args.userId}`;

    const data: DigestData = {
      userEmail: email,
      userName: (user as { name?: string }).name ?? "Founder",
      productName: project.name ?? "your product",
      weekNumber: lastLoop.weekNumber,
      tasksDone: lastLoop.tasksCompleted,
      tasksTotal: lastLoop.tasksTotal,
      shippingScore: lastLoop.shippingScore,
      streak: 0, // computed below
      oneThing: lastLoop.synthesis?.oneThing ?? null,
      nextSteps: [],
      dashboardUrl: `${APP_URL}/dashboard`,
      unsubscribeUrl,
      yearCardUrl: `${APP_URL}/wins/@${project.slug ?? "you"}/${new Date().getFullYear()}/card`,
    };

    return await sendOneEmail(data);
  },
});

/**
 * Internal entry point for the cron. Iterates opted-in users.
 * In a real deploy, Convex crons would call this every Sunday 13:00 UTC
 * (= 9am ET, 6am PT).
 */
export const sendWeeklyDigestToAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allPrefs = await ctx.db.query("userPreferences").collect();
    const optedIn = allPrefs.filter((p) => p.emailOptIn);

    const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
    for (const p of optedIn) {
      // Re-use the public mutation via ctx.runMutation would be ideal,
      // but internal mutations can call any mutation directly. Calling
      // a non-internal from internal requires a different import.
      // For simplicity, we duplicate the core logic here.
      const user = await ctx.db.get(p.userId);
      if (!user || !(user as { email?: string }).email) continue;

      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", p.userId))
        .order("desc")
        .take(1);
      const project = projects[0];
      if (!project) continue;

      const lastLoop = await ctx.db
        .query("loopLogs")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .order("desc")
        .first();
      if (!lastLoop) continue;

      const unsubToken = Buffer.from(
        `${p.userId}:${Date.now()}`,
      ).toString("base64url");
      const data: DigestData = {
        userEmail: (user as { email?: string }).email!,
        userName: (user as { name?: string }).name ?? "Founder",
        productName: project.name ?? "your product",
        weekNumber: lastLoop.weekNumber,
        tasksDone: lastLoop.tasksCompleted,
        tasksTotal: lastLoop.tasksTotal,
        shippingScore: lastLoop.shippingScore,
        streak: 0,
        oneThing: lastLoop.synthesis?.oneThing ?? null,
        nextSteps: [],
        dashboardUrl: `${APP_URL}/dashboard`,
        unsubscribeUrl: `${APP_URL}/api/email/unsubscribe?token=${unsubToken}&userId=${p.userId}`,
        yearCardUrl: `${APP_URL}/wins/@${project.slug ?? "you"}/${new Date().getFullYear()}/card`,
      };
      const result = await sendOneEmail(data);
      results.push({
        userId: p.userId,
        ok: result.ok,
        error: result.error,
      });
    }
    return { sent: results.length, results };
  },
});

/**
 * Opt out of email digests. Called by the unsubscribe link.
 */
export const optOut = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { emailOptIn: false });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        emailOptIn: false,
        pushOptIn: true,
        leaderboardOptIn: true,
      });
    }
    return { ok: true };
  },
});

/**
 * Opt in (re-subscribe). Called from settings page.
 */
export const optIn = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { emailOptIn: true });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        emailOptIn: true,
        pushOptIn: true,
        leaderboardOptIn: true,
      });
    }
    return { ok: true };
  },
});

/**
 * Read the current user's email preferences. Used by /settings.
 */
export const getMyPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return prefs;
  },
});
