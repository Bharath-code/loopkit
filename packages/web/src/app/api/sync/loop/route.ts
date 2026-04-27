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
      weekNumber,
      date,
      tasksCompleted,
      tasksTotal,
      shippingScore,
      synthesis,
      overridden,
      overrideReason,
      bipPost,
    } = body;

    if (!projectId || !weekNumber || !date) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await fetchMutation(
      api.sync.syncLoopLog,
      {
        projectId,
        weekNumber,
        date,
        tasksCompleted: tasksCompleted ?? 0,
        tasksTotal: tasksTotal ?? 0,
        shippingScore: shippingScore ?? 0,
        synthesis,
        overridden: overridden ?? false,
        overrideReason,
        bipPost,
      },
      { token }
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Sync loop log error:", err);
    return NextResponse.json({ error: "Failed to sync loop log." }, { status: 500 });
  }
}
