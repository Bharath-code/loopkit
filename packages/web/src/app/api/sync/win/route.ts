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
    const {
      projectId,
      productName,
      weekNum,
      shippingScore,
      streak,
      tasksCompleted,
      tasksTotal,
      feedbackCount,
      loopkitScore,
      mrr,
      oneThing,
    } = body;

    if (!projectId || !productName || !weekNum) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await fetchMutation(
      api.milestones.postPublicWin,
      {
        projectId,
        productName,
        weekNum,
        shippingScore,
        streak,
        tasksCompleted,
        tasksTotal,
        feedbackCount,
        loopkitScore,
        mrr,
        oneThing,
      },
      { token }
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Sync win error:", err);
    return NextResponse.json({ error: "Failed to sync win." }, { status: 500 });
  }
}
