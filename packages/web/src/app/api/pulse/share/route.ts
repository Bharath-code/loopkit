import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
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
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing project name or slug." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3099";

    const sysUserId = process.env.LOOPKIT_SYSTEM_USER_ID as Id<"users"> | undefined;
    if (!sysUserId) {
      return NextResponse.json({ error: "Server configuration missing system user." }, { status: 500 });
    }

    const result = await fetchMutation(
      api.pulse.ensureProject,
      { userId: sysUserId, name, slug },
      { token }
    );

    const url = `${baseUrl}/pulse/${result.projectId}`;

    return NextResponse.json({
      projectId: result.projectId,
      url,
      created: result.created,
    });
  } catch (err) {
    console.error("Pulse share error:", err);
    return NextResponse.json({ error: "Failed to create share link." }, { status: 500 });
  }
}
