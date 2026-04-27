import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { csrfCheckRelaxed, verifyAndRateLimit } from "../ai/_helpers";

const MAX_WHATSHIPPED_LENGTH = 280;
const ALLOWED_CATEGORIES = /^[a-z0-9_-]+$/;

function sanitizeWhatShipped(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_WHATSHIPPED_LENGTH) return null;
  // Strip HTML tags
  return trimmed.replace(/<[^>]+>/g, "");
}

function sanitizeCategory(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 50) return null;
  if (!ALLOWED_CATEGORIES.test(trimmed)) return null;
  return trimmed;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAndRateLimit(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const rawCategory = searchParams.get("category") || "general";
    const category = sanitizeCategory(rawCategory) || "general";
    const limit = Math.min(parseInt(searchParams.get("limit") || "3", 10), 20);

    const peers = await fetchQuery(
      api.peers.getPeerShips,
      { category, limit },
      { token: auth.token }
    );

    return NextResponse.json({ peers });
  } catch (error) {
    console.error("Peers GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch peer ships" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfCheckRelaxed(req);
    if (csrf) {
      return NextResponse.json({ error: csrf.error }, { status: csrf.status });
    }

    const auth = await verifyAndRateLimit(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const category = sanitizeCategory(body.category);
    const whatShipped = sanitizeWhatShipped(body.whatShipped);
    const weekNumber = typeof body.weekNumber === "number" ? body.weekNumber : 0;

    if (!category || !whatShipped) {
      return NextResponse.json(
        { error: "Invalid category or whatShipped. Max 280 chars, no HTML." },
        { status: 400 }
      );
    }

    await fetchMutation(
      api.peers.recordPeerShip,
      { category, whatShipped, weekNumber },
      { token: auth.token }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Peers POST Error:", error);
    return NextResponse.json({ error: "Failed to record peer ship" }, { status: 500 });
  }
}
