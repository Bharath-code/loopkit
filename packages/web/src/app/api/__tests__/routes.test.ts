process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";
process.env.POLAR_WEBHOOK_SECRET = "test-webhook-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as aiInitPost } from "../ai/init/route";
import { POST as pulseSubmitPost } from "../pulse/submit/route";
import { GET as cliMeGet } from "../cli/me/route";
import { POST as cliAuthPost } from "../cli/auth/route";
import { GET as peersGet, POST as peersPost } from "../peers/route";
import { POST as syncLoopPost } from "../sync/loop/route";
import { POST as syncShipPost } from "../sync/ship/route";
import { POST as pulseSharePost } from "../pulse/share/route";
import { POST as polarWebhookPost } from "../webhooks/polar/route";

// ─── Mocks ──────────────────────────────────────────────────────

const mockFetchQuery = vi.fn();
const mockFetchMutation = vi.fn();
const mockConvexQuery = vi.fn();
const mockConvexMutation = vi.fn();

vi.mock("convex/nextjs", () => ({
  fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
  fetchMutation: (...args: unknown[]) => mockFetchMutation(...args),
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    query = mockConvexQuery;
    mutation = mockConvexMutation;
  },
}));

const mockGenerateObject = vi.fn();

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: () => () => "claude-model-mock",
}));

// Mock standardwebhooks
let webhookShouldThrow = false;
vi.mock("standardwebhooks", () => ({
  Webhook: class {
    verify() {
      if (webhookShouldThrow) {
        throw new Error("Invalid signature");
      }
      return { type: "subscription.created", data: {} };
    }
  },
}));

// ─── Helpers ────────────────────────────────────────────────────

function makeRequest(
  method: string,
  url: string,
  opts?: { body?: unknown; headers?: Record<string, string> },
): Request {
  return new Request(url, {
    method,
    headers: opts?.headers ?? {},
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
}

// ─── Tests ──────────────────────────────────────────────────────

describe("POST /api/ai/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects cross-origin requests with 403", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/ai/init", {
      headers: { origin: "https://evil.com" },
    });
    const res = await aiInitPost(req as any);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Cross-origin");
  });

  it("rejects missing auth with 401", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/ai/init", {
      headers: { origin: "http://localhost:3000" },
    });
    mockFetchQuery.mockResolvedValue(null);
    const res = await aiInitPost(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Authentication required");
  });

  it("rejects when rate limit exceeded", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/ai/init", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer test-token",
      },
    });
    mockFetchQuery.mockImplementation(
      async (_api: unknown, _args: unknown, opts: { token?: string }) => {
        if (opts?.token === "test-token") {
          return { tier: "free", _id: "user_123" };
        }
        if (opts === undefined) {
          return { allowed: false, count: 10, limit: 10 };
        }
        return null;
      },
    );
    const res = await aiInitPost(req as any);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Rate limit exceeded");
  });

  it("returns 200 on success", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/ai/init", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer test-token",
      },
      body: {
        prompt: "Test prompt",
        system: "Test system",
      },
    });
    mockFetchQuery.mockImplementation(
      async (_api: unknown, args: unknown, opts?: { token?: string }) => {
        if (opts?.token !== "test-token") return null;
        if (args && typeof args === "object" && "tier" in args) {
          return { allowed: true, count: 1, limit: 100 };
        }
        return { tier: "solo", _id: "user_123" };
      },
    );
    mockGenerateObject.mockResolvedValue({ object: { bet: "Test" } });
    mockFetchMutation.mockResolvedValue(undefined);

    const res = await aiInitPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toEqual({ bet: "Test" });
  });
});

describe("POST /api/pulse/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects rate-limited IPs with 429", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/submit", {
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: { projectId: "proj_123", text: "Great app!" },
    });
    mockConvexQuery.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await pulseSubmitPost(req as any);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Too many submissions");
  });

  it("rejects missing fields with 400", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/submit", {
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: {},
    });
    mockConvexQuery.mockResolvedValue({ allowed: true, remaining: 3 });
    const res = await pulseSubmitPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing projectId or text");
  });

  it("rejects HTML with sanitized result", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/submit", {
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: { projectId: "proj_123", text: "<br><div></div>" },
    });
    mockConvexQuery.mockResolvedValue({ allowed: true, remaining: 3 });
    mockConvexMutation.mockResolvedValue(undefined);
    const res = await pulseSubmitPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Feedback cannot be empty");
  });

  it("returns 200 on valid submission", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/submit", {
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: { projectId: "proj_123", text: "Love the new feature!" },
    });
    mockConvexQuery.mockResolvedValue({ allowed: true, remaining: 3 });
    mockConvexMutation.mockResolvedValue(undefined);
    const res = await pulseSubmitPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("GET /api/cli/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects missing token with 401", async () => {
    const req = makeRequest("GET", "http://localhost:3000/api/cli/me");
    const res = await cliMeGet(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("rejects invalid token with 401", async () => {
    const req = makeRequest("GET", "http://localhost:3000/api/cli/me", {
      headers: { authorization: "Bearer bad-token" },
    });
    mockFetchQuery.mockResolvedValue(null);
    const res = await cliMeGet(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid token");
  });

  it("returns user data on valid token", async () => {
    const req = makeRequest("GET", "http://localhost:3000/api/cli/me", {
      headers: { authorization: "Bearer valid-token" },
    });
    mockFetchQuery.mockResolvedValue({
      _id: "user_123",
      tier: "pro",
      email: "founder@example.com",
    });
    const res = await cliMeGet(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tier).toBe("pro");
    expect(json.email).toBe("founder@example.com");
  });
});

describe("POST /api/cli/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects cross-origin requests with 403", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/cli/auth", {
      headers: { origin: "https://evil.com" },
      body: { action: "create" },
    });
    const res = await cliAuthPost(req as any);
    expect(res.status).toBe(403);
  });

  it("returns code on create action", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/cli/auth", {
      headers: { origin: "http://localhost:3000" },
      body: { action: "create" },
    });
    mockFetchMutation.mockResolvedValue({ code: "ABCD-1234" });
    const res = await cliAuthPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.code).toBe("ABCD-1234");
  });

  it("returns error on poll with missing code", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/cli/auth", {
      headers: { origin: "http://localhost:3000" },
      body: { action: "poll" },
    });
    const res = await cliAuthPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No code provided");
  });

  it("returns session on successful poll", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/cli/auth", {
      headers: { origin: "http://localhost:3000" },
      body: { action: "poll", code: "ABCD-1234" },
    });
    mockFetchQuery.mockResolvedValue({
      token: "auth-token",
      userId: "user_123",
    });
    const res = await cliAuthPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBe("auth-token");
  });

  it("returns error on complete with missing data", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/cli/auth", {
      headers: { origin: "http://localhost:3000" },
      body: { action: "complete", code: "ABCD-1234" },
    });
    const res = await cliAuthPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing data");
  });

  it("rejects invalid action with 400", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/cli/auth", {
      headers: { origin: "http://localhost:3000" },
      body: { action: "invalid" },
    });
    const res = await cliAuthPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid action");
  });
});

describe("GET /api/peers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects missing auth with 401", async () => {
    const req = makeRequest("GET", "http://localhost:3000/api/peers");
    mockFetchQuery.mockResolvedValue(null);
    const res = await peersGet(req as any);
    expect(res.status).toBe(401);
  });

  it("returns peers with valid auth", async () => {
    const req = makeRequest(
      "GET",
      "http://localhost:3000/api/peers?category=saas",
      {
        headers: { authorization: "Bearer valid-token" },
      },
    );
    mockFetchQuery.mockImplementation(
      async (_api: unknown, args: unknown, opts?: { token?: string }) => {
        if (
          opts?.token === "valid-token" &&
          args &&
          typeof args === "object" &&
          "tier" in args
        ) {
          return { allowed: true, count: 1, limit: 100 };
        }
        if (args && typeof args === "object" && "category" in args) {
          return [{ what: "Shipped v1", who: "anon" }];
        }
        return { tier: "free", _id: "user_123" };
      },
    );
    const res = await peersGet(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.peers).toBeDefined();
  });
});

describe("POST /api/peers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects cross-origin requests with 403", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/peers", {
      headers: { origin: "https://evil.com" },
      body: { category: "saas", whatShipped: "Launched v1" },
    });
    const res = await peersPost(req as any);
    expect(res.status).toBe(403);
  });

  it("rejects invalid category with 400", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/peers", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: { category: "", whatShipped: "Launched v1" },
    });
    mockFetchQuery.mockImplementation(
      async (_api: unknown, args: unknown, opts?: { token?: string }) => {
        if (
          opts?.token === "valid-token" &&
          args &&
          typeof args === "object" &&
          "tier" in args
        ) {
          return { allowed: true, count: 1, limit: 100 };
        }
        return { tier: "free", _id: "user_123" };
      },
    );
    const res = await peersPost(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects HTML-only whatShipped with 400", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/peers", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: { category: "saas", whatShipped: "<script></script>" },
    });
    mockFetchQuery.mockImplementation(
      async (_api: unknown, args: unknown, opts?: { token?: string }) => {
        if (
          opts?.token === "valid-token" &&
          args &&
          typeof args === "object" &&
          "tier" in args
        ) {
          return { allowed: true, count: 1, limit: 100 };
        }
        return { tier: "free", _id: "user_123" };
      },
    );
    const res = await peersPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid category or whatShipped");
  });

  it("records peer ship on valid input", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/peers", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: {
        category: "saas",
        whatShipped: "Launched v1 with auth",
        weekNumber: 12,
      },
    });
    mockFetchQuery.mockImplementation(
      async (_api: unknown, args: unknown, opts?: { token?: string }) => {
        if (
          opts?.token === "valid-token" &&
          args &&
          typeof args === "object" &&
          "tier" in args
        ) {
          return { allowed: true, count: 1, limit: 100 };
        }
        return { tier: "free", _id: "user_123" };
      },
    );
    mockFetchMutation.mockResolvedValue(undefined);
    const res = await peersPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("POST /api/sync/loop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects cross-origin requests with 403", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/loop", {
      headers: { origin: "https://evil.com" },
      body: { projectId: "proj_1", weekNumber: 5, date: "2026-04-20" },
    });
    const res = await syncLoopPost(req as any);
    expect(res.status).toBe(403);
  });

  it("rejects missing auth with 401", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/loop", {
      headers: { origin: "http://localhost:3000" },
      body: { projectId: "proj_1", weekNumber: 5, date: "2026-04-20" },
    });
    const res = await syncLoopPost(req as any);
    expect(res.status).toBe(401);
  });

  it("rejects missing fields with 400", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/loop", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: { projectId: "proj_1" },
    });
    const res = await syncLoopPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing required fields");
  });

  it("syncs loop log on valid input", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/loop", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: {
        projectId: "proj_1",
        weekNumber: 5,
        date: "2026-04-20",
        tasksCompleted: 3,
        tasksTotal: 5,
        shippingScore: 75,
      },
    });
    mockFetchMutation.mockResolvedValue({ success: true, id: "log_123" });
    const res = await syncLoopPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("POST /api/sync/ship", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects missing auth with 401", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/ship", {
      headers: { origin: "http://localhost:3000" },
      body: { projectId: "proj_1", date: "2026-04-20", whatShipped: "v1.0" },
    });
    const res = await syncShipPost(req as any);
    expect(res.status).toBe(401);
  });

  it("rejects missing fields with 400", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/ship", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: { projectId: "proj_1" },
    });
    const res = await syncShipPost(req as any);
    expect(res.status).toBe(400);
  });

  it("syncs ship log on valid input", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/sync/ship", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: {
        projectId: "proj_1",
        date: "2026-04-20",
        whatShipped: "v1.0 launch",
      },
    });
    mockFetchMutation.mockResolvedValue({ success: true, id: "ship_123" });
    const res = await syncShipPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("POST /api/pulse/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects cross-origin requests with 403", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/share", {
      headers: { origin: "https://evil.com" },
      body: { name: "My Project", slug: "my-project" },
    });
    const res = await pulseSharePost(req as any);
    expect(res.status).toBe(403);
  });

  it("rejects missing auth with 401", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/share", {
      headers: { origin: "http://localhost:3000" },
      body: { name: "My Project", slug: "my-project" },
    });
    const res = await pulseSharePost(req as any);
    expect(res.status).toBe(401);
  });

  it("creates share link on valid input", async () => {
    const req = makeRequest("POST", "http://localhost:3000/api/pulse/share", {
      headers: {
        origin: "http://localhost:3000",
        authorization: "Bearer valid-token",
      },
      body: { name: "My Project", slug: "my-project" },
    });
    mockFetchMutation.mockResolvedValue({
      projectId: "proj_123",
      created: true,
    });
    const res = await pulseSharePost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.projectId).toBe("proj_123");
    expect(json.url).toContain("/pulse/proj_123");
  });
});

describe("POST /api/webhooks/polar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookShouldThrow = false;
  });

  it("rejects missing signature with 400", async () => {
    const req = makeRequest(
      "POST",
      "http://localhost:3000/api/webhooks/polar",
      {
        body: { type: "subscription.created" },
      },
    );
    const res = await polarWebhookPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing signature");
  });

  it("rejects invalid payload with 400", async () => {
    webhookShouldThrow = true;
    const req = makeRequest(
      "POST",
      "http://localhost:3000/api/webhooks/polar",
      {
        headers: { "webhook-signature": "invalid-sig" },
        body: { type: "subscription.created" },
      },
    );
    const res = await polarWebhookPost(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload");
  });

  it("processes subscription.created event", async () => {
    const req = makeRequest(
      "POST",
      "http://localhost:3000/api/webhooks/polar",
      {
        headers: { "webhook-signature": "valid-sig" },
        body: {
          type: "subscription.created",
          data: {
            id: "sub_123",
            priceId: "price_solo",
            status: "active",
            currentPeriodEnd: "2027-04-20T00:00:00Z",
            customerMetadata: { userId: "user_456" },
          },
        },
      },
    );
    mockFetchMutation.mockResolvedValue(undefined);
    const res = await polarWebhookPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("handles missing userId gracefully", async () => {
    const req = makeRequest(
      "POST",
      "http://localhost:3000/api/webhooks/polar",
      {
        headers: { "webhook-signature": "valid-sig" },
        body: {
          type: "subscription.created",
          data: {
            id: "sub_789",
            priceId: "price_pro",
            status: "active",
          },
        },
      },
    );
    mockFetchMutation.mockResolvedValue(undefined);
    const res = await polarWebhookPost(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(mockFetchMutation).not.toHaveBeenCalled();
  });
});
