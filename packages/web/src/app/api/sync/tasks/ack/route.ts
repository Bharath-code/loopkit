import { NextRequest, NextResponse } from "next/server";
import { csrfCheck } from "../../../ai/_helpers";

/**
 * POST /api/sync/tasks/ack
 * Acknowledges a successful CLI push. We don't persist anything here;
 * the endpoint exists for future analytics (e.g. "last sync time" on
 * the dashboard).
 */
export async function POST(req: NextRequest) {
  try {
    const csrf = csrfCheck(req);
    if (csrf) {
      return NextResponse.json({ error: csrf.error }, { status: csrf.status });
    }

    const body = await req.json();
    return NextResponse.json({ ok: true, projectId: body.projectId, count: body.count });
  } catch (err) {
    console.error("Tasks ack error:", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
