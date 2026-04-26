import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

function getConvex(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
  return new ConvexHttpClient(url);
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
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
      { status: 429 }
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
      { status: 400 }
    );
  }

  const sanitized = stripHtmlTags(body.text);
  if (!sanitized) {
    return NextResponse.json(
      { error: "Feedback cannot be empty" },
      { status: 400 }
    );
  }

  if (sanitized.length > 500) {
    return NextResponse.json(
      { error: "Feedback must be 500 characters or less" },
      { status: 400 }
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
