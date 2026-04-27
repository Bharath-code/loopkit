import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

function getConvex(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
  return new ConvexHttpClient(url);
}

function ipToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function cidrMatch(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);
  const mask = prefix === 0 ? 0 : ~((1 << (32 - prefix)) - 1);
  return (ipToLong(ip) & mask) === (ipToLong(network) & mask);
}

function isTrustedIp(ip: string, trustedList: string[]): boolean {
  return trustedList.some((trusted) => {
    if (trusted.includes("/")) {
      return cidrMatch(ip, trusted);
    }
    return ip === trusted;
  });
}

function getClientIp(req: NextRequest): string {
  const trustedProxiesEnv = process.env.TRUSTED_PROXIES;
  const forwarded = req.headers.get("x-forwarded-for");

  if (trustedProxiesEnv && forwarded) {
    const trustedList = trustedProxiesEnv.split(",").map((s) => s.trim());
    const ips = forwarded.split(",").map((s) => s.trim());
    // Walk from right (closest to server) to left (origin)
    for (let i = ips.length - 1; i >= 0; i--) {
      if (!isTrustedIp(ips[i], trustedList)) {
        return ips[i];
      }
    }
    // All IPs were trusted — fall through to req.ip
  }

  // No trusted proxies configured, or no x-forwarded-for, or all trusted
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitKey = `pulse:${ip}`;
  const windowMs = 60_000;
  const maxRequests = 3;

  const convex = getConvex();

  const rateCheck = await convex.query(api.pulse.checkRateLimit, {
    key: rateLimitKey,
    windowMs,
    maxRequests,
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: { projectId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.projectId || !body.text) {
    return NextResponse.json(
      { error: "Missing projectId or text" },
      { status: 400 },
    );
  }

  const sanitized = stripHtmlTags(body.text);
  if (!sanitized) {
    return NextResponse.json(
      { error: "Feedback cannot be empty" },
      { status: 400 },
    );
  }

  if (sanitized.length > 500) {
    return NextResponse.json(
      { error: "Feedback must be 500 characters or less" },
      { status: 400 },
    );
  }

  await convex.mutation(api.pulse.submitResponse, {
    projectId: body.projectId as Id<"projects">,
    text: sanitized.slice(0, 500),
  });

  await convex.mutation(api.pulse.incrementRateLimit, {
    key: rateLimitKey,
    windowMs,
  });

  return NextResponse.json({ success: true });
}
