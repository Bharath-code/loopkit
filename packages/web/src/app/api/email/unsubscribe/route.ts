/**
 * GET /api/email/unsubscribe
 *
 * Public (no auth) endpoint hit by the unsubscribe link in the digest.
 * Verifies an HMAC-signed token, then opts the user out.
 *
 * The token format is `base64url(userId:timestamp:HMAC-SHA256)`.
 * Verification:
 *   1. Decode + check userId matches the query param
 *   2. Check timestamp is within 30 days
 *   3. Verify HMAC against UNSUBSCRIBE_SECRET (timing-safe)
 *
 * The mutation re-validates as defense in depth, so even a forged
 * request that gets this far cannot opt out a user they shouldn't.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

function htmlError(title: string, body: string, status: number): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:40px;max-width:480px;margin:0 auto;background:#0c0c0f;color:#fafafa;min-height:100vh;">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px;text-align:center;">
        <h1 style="color:#EF4444;margin:0 0 8px 0;">${title}</h1>
        <p style="color:#a1a1aa;margin:0;">${body}</p>
        <a href="https://loopkit.dev" style="display:inline-block;margin-top:24px;color:#7C3AED;text-decoration:none;">← loopkit.dev</a>
      </div>
    </body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const token = url.searchParams.get("token");

  if (!userId || !token) {
    return htmlError(
      "Invalid unsubscribe link",
      "Missing userId or token. Please copy the full link from the email.",
      400,
    );
  }

  // Step 1: pre-validate the token to choose the right error page
  let validation: { ok: boolean; reason?: string };
  try {
    validation = await fetchQuery(api.email.validateUnsubscribeToken, {
      userId: userId as Id<"users">,
      token,
    });
  } catch (err) {
    console.error("Token validation query failed:", err);
    return htmlError(
      "Something went wrong",
      "Please email support@loopkit.dev to unsubscribe.",
      500,
    );
  }

  if (!validation.ok) {
    return htmlError(
      "Invalid unsubscribe link",
      validation.reason === "Token expired"
        ? "This link has expired. Use the most recent digest to unsubscribe."
        : validation.reason === "Token does not match user"
        ? "This link is for a different account. Use the link from your own email."
        : "Please use the link from the most recent email.",
      400,
    );
  }

  // Step 2: opt out (re-validates as defense in depth)
  try {
    const result = await fetchMutation(api.email.optOut, {
      userId: userId as Id<"users">,
      token,
    });
    if (!result.ok) {
      return htmlError(
        "Invalid unsubscribe link",
        result.error ?? "Token validation failed.",
        400,
      );
    }
  } catch (err) {
    console.error("Unsubscribe mutation failed:", err);
    return htmlError(
      "Something went wrong",
      "Please email support@loopkit.dev to unsubscribe.",
      500,
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:40px;max-width:480px;margin:0 auto;background:#0c0c0f;color:#fafafa;min-height:100vh;">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px;text-align:center;">
        <div style="font-size:48px;line-height:1;">✓</div>
        <h1 style="color:#10B981;margin:16px 0 8px 0;">Unsubscribed</h1>
        <p style="color:#a1a1aa;margin:0;">You won't receive the Sunday digest anymore. You can re-enable it from your dashboard settings anytime.</p>
        <a href="https://loopkit.dev" style="display:inline-block;margin-top:24px;color:#7C3AED;text-decoration:none;">← Back to loopkit.dev</a>
      </div>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
