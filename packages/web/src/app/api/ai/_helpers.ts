import { NextRequest } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
  "http://localhost:3099",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

export function csrfCheck(req: NextRequest): { error: string; status: number } | null {
  const origin = req.headers.get("origin");

  if (!origin) {
    return null;
  }

  const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(allowed as string);
      return originUrl.hostname === allowedUrl.hostname && originUrl.port === allowedUrl.port;
    } catch {
      return false;
    }
  });
  if (!isAllowed) {
    return { error: "Cross-origin request rejected.", status: 403 };
  }

  return null;
}

function originMatches(value: string): boolean {
  return ALLOWED_ORIGINS.some((allowed) => {
    try {
      const valueUrl = new URL(value);
      const allowedUrl = new URL(allowed as string);
      return valueUrl.hostname === allowedUrl.hostname && valueUrl.port === allowedUrl.port;
    } catch {
      return false;
    }
  });
}

export function csrfCheckRelaxed(req: NextRequest): { error: string; status: number } | null {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!origin && !referer) {
    return null;
  }

  const originOk = origin ? originMatches(origin) : true;
  const refererOk = referer ? originMatches(referer) : true;

  if (!originOk || !refererOk) {
    return { error: "Cross-origin request rejected.", status: 403 };
  }

  return null;
}

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
