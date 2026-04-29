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
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { milestoneType, projectId, metadata } = body;

    if (!milestoneType) {
      return NextResponse.json({ error: "Missing milestoneType." }, { status: 400 });
    }

    const result = await fetchMutation(
      api.milestones.triggerMilestone,
      {
        milestoneType,
        projectId,
        metadata,
      },
      { token }
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Sync milestone error:", err);
    return NextResponse.json({ error: "Failed to sync milestone." }, { status: 500 });
  }
}
