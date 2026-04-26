import { NextRequest } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export async function verifyAndRateLimit(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return { error: "Authentication required.", status: 401 };
  }

  try {
    const user = await fetchQuery(api.users.me, {}, { token });
    if (!user) {
      return { error: "Invalid or expired token. Run `loopkit auth`.", status: 401 };
    }

    const tier = (user.tier as string) || "free";
    const limitCheck = await fetchQuery(
      api.rateLimits.checkLimit,
      { userId: user._id, tier },
      { token }
    );

    if (!limitCheck.allowed) {
      return {
        error: `Rate limit exceeded: ${limitCheck.count}/${limitCheck.limit} AI calls today. Upgrade your plan for more.`,
        status: 429,
      };
    }

    return { user, tier, token, allowed: true };
  } catch {
    return { error: "Authentication failed.", status: 401 };
  }
}

export async function incrementAIUsage(token: string, userId: string) {
  try {
    await fetchMutation(
      api.rateLimits.incrementUsage,
      { userId: userId as any },
      { token }
    );
  } catch (err) {
    console.error("Failed to increment AI usage:", err);
  }
}
