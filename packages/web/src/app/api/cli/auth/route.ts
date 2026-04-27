import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { csrfCheck } from "../../ai/_helpers";

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfCheck(req);
    if (csrf) {
      return NextResponse.json({ error: csrf.error }, { status: csrf.status });
    }

    const { action, code, token } = await req.json();

    if (action === "create") {
      const result = await fetchMutation(api.cliAuth.createSession, {});
      return NextResponse.json({ code: result.code });
    }

    if (action === "poll") {
      if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });
      const session = await fetchQuery(api.cliAuth.pollSession, { code });
      if ("error" in session) {
        return NextResponse.json({ error: session.error }, { status: 404 });
      }
      return NextResponse.json(session);
    }

    if (action === "complete") {
      if (!code || !token) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      const result = await fetchMutation(api.cliAuth.completeSession, { code, token });
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("CLI auth error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
