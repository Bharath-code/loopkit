/**
 * Tests for the HMAC-signed unsubscribe token used by the digest.
 *
 * The token format is `base64url(userId:timestamp:HMAC-SHA256-hex)`.
 * Verification rejects mismatches, malformed inputs, expired tokens,
 * and tampering — all via timing-safe comparison.
 */
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

// Mirror the production token format. We import the *helpers* lazily
// after setting the secret so the module picks it up.
process.env.UNSUBSCRIBE_SECRET = "test-secret-for-unit-tests-only";

const { signUnsubscribeToken, verifyUnsubscribeToken } = await import(
  "../../../convex/email.js"
);

const validUserId = "user_abc123" as Parameters<typeof signUnsubscribeToken>[0];

describe("signUnsubscribeToken + verifyUnsubscribeToken", () => {
  it("round-trips a freshly issued token", () => {
    const token = signUnsubscribeToken(validUserId);
    const result = verifyUnsubscribeToken(token, validUserId);
    expect(result.ok).toBe(true);
  });

  it("rejects a token for a different user", () => {
    const token = signUnsubscribeToken(validUserId);
    const result = verifyUnsubscribeToken(token, "user_different" as never);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Token does not match user");
  });

  it("rejects garbage input", () => {
    const result = verifyUnsubscribeToken("not-base64url!!!", validUserId);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty token", () => {
    const result = verifyUnsubscribeToken("", validUserId);
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed token (only 2 parts)", () => {
    const bad = Buffer.from(`${validUserId}:123`).toString("base64url");
    const result = verifyUnsubscribeToken(bad, validUserId);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Malformed token");
  });

  it("rejects a non-numeric timestamp", () => {
    const sig = createHmac("sha256", "test-secret-for-unit-tests-only")
      .update(`${validUserId}:notanumber`)
      .digest("hex");
    const bad = Buffer.from(`${validUserId}:notanumber:${sig}`).toString("base64url");
    const result = verifyUnsubscribeToken(bad, validUserId);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Invalid timestamp");
  });

  it("rejects an expired token (>30 days old)", () => {
    // Build a token 31 days old with a valid signature
    const oldTs = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const sig = createHmac("sha256", "test-secret-for-unit-tests-only")
      .update(`${validUserId}:${oldTs}`)
      .digest("hex");
    const expired = Buffer.from(`${validUserId}:${oldTs}:${sig}`).toString("base64url");
    const result = verifyUnsubscribeToken(expired, validUserId);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Token expired");
  });

  it("rejects a token with a tampered signature", () => {
    const token = signUnsubscribeToken(validUserId);
    // Flip a hex char in the signature by decoding + mutating
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === "0" ? "1" : "0");
    const tampered = Buffer.from(parts.join(":")).toString("base64url");
    const result = verifyUnsubscribeToken(tampered, validUserId);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Invalid signature");
  });

  it("rejects a token signed with a different secret", () => {
    const ts = Date.now();
    const sig = createHmac("sha256", "wrong-secret")
      .update(`${validUserId}:${ts}`)
      .digest("hex");
    const forged = Buffer.from(`${validUserId}:${ts}:${sig}`).toString("base64url");
    const result = verifyUnsubscribeToken(forged, validUserId);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Invalid signature");
  });

  it("accepts a token right at the 30-day boundary", () => {
    // 29 days old — still within the 30-day TTL
    const ts = Date.now() - 29 * 24 * 60 * 60 * 1000;
    const sig = createHmac("sha256", "test-secret-for-unit-tests-only")
      .update(`${validUserId}:${ts}`)
      .digest("hex");
    const ok = Buffer.from(`${validUserId}:${ts}:${sig}`).toString("base64url");
    const result = verifyUnsubscribeToken(ok, validUserId);
    expect(result.ok).toBe(true);
  });

  it("produces base64url-safe characters only", () => {
    const token = signUnsubscribeToken(validUserId);
    // base64url uses A-Z, a-z, 0-9, -, _ and no padding
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
    expect(token).not.toContain("=");
  });

  it("two tokens for the same user differ (timestamp)", async () => {
    const a = signUnsubscribeToken(validUserId);
    await new Promise((r) => setTimeout(r, 5));
    const b = signUnsubscribeToken(validUserId);
    expect(a).not.toBe(b);
    // Both are still valid
    expect(verifyUnsubscribeToken(a, validUserId).ok).toBe(true);
    expect(verifyUnsubscribeToken(b, validUserId).ok).toBe(true);
  });
});
