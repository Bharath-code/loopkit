/**
 * GET /api/email/unsubscribe
 *
 * Public (no auth) endpoint hit by the unsubscribe link in the digest.
 * Sets the user's emailOptIn to false. The token is a base64url of
 * `${userId}:${timestamp}` — not a real signature but enough to
 * prevent casual drive-by URL forging. For production, add HMAC.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const token = url.searchParams.get("token");

  if (!userId || !token) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
        <h1 style="color:#EF4444;">Invalid unsubscribe link</h1>
        <p>Missing userId or token. Please copy the full link from the email.</p>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  // Verify the token (best-effort: must contain the userId)
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    if (!decoded.startsWith(userId + ":") && !decoded.startsWith(userId)) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
          <h1 style="color:#EF4444;">Invalid unsubscribe token</h1>
          <p>The token doesn't match this user. Please use the link from the most recent email.</p>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }
  } catch {
    return new NextResponse("Invalid token", { status: 400 });
  }

  try {
    await fetchMutation(api.email.optOut, { userId: userId as Id<"users"> });
  } catch (err) {
    console.error("Unsubscribe mutation failed:", err);
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
        <h1 style="color:#EF4444;">Something went wrong</h1>
        <p>Please email support@loopkit.dev to unsubscribe.</p>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;background:#0c0c0f;color:#fafafa;min-height:100vh;">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:40px;text-align:center;">
        <div style="font-size:48px;">✓</div>
        <h1 style="color:#10B981;margin:16px 0 8px 0;">Unsubscribed</h1>
        <p style="color:#a1a1aa;margin:0;">You won't receive the Sunday digest anymore. You can re-enable it from your dashboard settings anytime.</p>
        <a href="https://loopkit.dev" style="display:inline-block;margin-top:24px;color:#7C3AED;text-decoration:none;">← Back to loopkit.dev</a>
      </div>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}
