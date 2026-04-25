import { NextRequest, NextResponse } from "next/server";

// Simple mock store for CLI auth device flow
// In production, this would be in Convex or Redis
const cliAuthSessions = new Map<string, { status: "pending" | "completed", token?: string }>();

export async function POST(req: NextRequest) {
  try {
    const { action, code, token } = await req.json();

    if (action === "create") {
      // CLI creates a new session
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      cliAuthSessions.set(newCode, { status: "pending" });
      return NextResponse.json({ code: newCode });
    }

    if (action === "poll") {
      // CLI polls for token
      if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });
      const session = cliAuthSessions.get(code);
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
      
      return NextResponse.json(session);
    }

    if (action === "complete") {
      // Web app completes the flow
      if (!code || !token) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      if (cliAuthSessions.has(code)) {
        cliAuthSessions.set(code, { status: "completed", token });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
