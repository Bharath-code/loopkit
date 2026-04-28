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
    const { category, launches, scannedAt } = body;

    if (!category || !launches || !Array.isArray(launches)) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const result = await fetchMutation(
      api.competitorRadar.syncCompetitorLaunches,
      { category, launches, scannedAt },
      { token },
    );

    return NextResponse.json(result ?? { ok: true });
  } catch (err) {
    console.error("Sync competitor radar error:", err);
    return NextResponse.json(
      { error: "Failed to sync radar data." },
      { status: 500 },
    );
  }
}
