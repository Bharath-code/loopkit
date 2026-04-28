import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { csrfCheck } from "../../ai/_helpers";

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfCheck(req);
    if (csrf) {
      return NextResponse.json({ error: csrf.error }, { status: csrf.status });
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      category,
      fundingTrend,
      fundingCount,
      devTrend,
      devGrowth,
      hiringTrend,
      hiringCount,
      compositeScore,
      signal,
    } = body;

    if (!category || compositeScore == null) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const result = await fetchMutation(
      api.marketTiming.upsertMarketSignal,
      {
        category,
        fundingTrend,
        fundingCount,
        devTrend,
        devGrowth,
        hiringTrend,
        hiringCount,
        compositeScore,
        signal,
      },
      { token },
    );

    return NextResponse.json(result ?? { ok: true });
  } catch (err) {
    console.error("Sync market timing error:", err);
    return NextResponse.json(
      { error: "Failed to sync timing data." },
      { status: 500 },
    );
  }
}
