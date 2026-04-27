import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const createSession = mutation({
  args: {},
  handler: async (ctx) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await ctx.db.insert("cliAuthSessions", {
      code: newCode,
      status: "pending",
      createdAt: Date.now(),
    });

    return { code: newCode };
  },
});

export const pollSession = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("cliAuthSessions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!session) {
      return { error: "Session not found" };
    }

    // Auto-expire old sessions
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      return { error: "Session expired" };
    }

    return {
      status: session.status,
      token: session.token,
    };
  },
});

export const completeSession = mutation({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("cliAuthSessions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!session) {
      return { error: "Session not found" };
    }

    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      return { error: "Session expired" };
    }

    await ctx.db.patch(session._id, {
      status: "completed",
      token: args.token,
    });

    return { success: true };
  },
});

export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    const expired = await ctx.db
      .query("cliAuthSessions")
      .withIndex("by_status_createdAt", (q) =>
        q.eq("status", "pending").lt("createdAt", cutoff)
      )
      .take(100);

    for (const session of expired) {
      await ctx.db.delete(session._id);
    }

    return { deleted: expired.length };
  },
});
