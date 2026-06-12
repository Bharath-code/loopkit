/**
 * POST /api/telemetry/bind
 *
 * Called by the CLI after `loopkit auth` succeeds. Links the CLI's
 * pre-auth `distinctId` to the authenticated user so all their
 * pre-signup events (e.g. `cli.init_run`) attribute to the new user.
 *
 * Auth: requires a valid bearer token in the Authorization header.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false, error: "Missing auth" }, { status: 401 });
  }

  let body: { distinctId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.distinctId !== "string" || body.distinctId.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing distinctId" }, { status: 400 });
  }

  const token = auth.slice("Bearer ".length);

  try {
    // Verify the user via the auth query
    const me = await fetchQuery(api.users.me, {}, { token });
    if (!me) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    // Bind the distinctId — backfills userId on all matching events
    const result = await fetchMutation(api.telemetry.bindDistinctId, {
      distinctId: body.distinctId,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Telemetry bind failed:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
