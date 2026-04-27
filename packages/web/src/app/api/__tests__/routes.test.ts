process.env.NEXT_PUBLIC_CONVEX_URL = "https://test.convex.cloud";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as aiInitPost } from "../ai/init/route";
import { POST as pulseSubmitPost } from "../pulse/submit/route";
import { GET as cliMeGet } from "../cli/me/route";

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
vi.mock("standardwebhooks", () => ({
  Webhook: class {
    verify() {
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
