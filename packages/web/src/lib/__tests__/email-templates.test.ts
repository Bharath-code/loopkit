import { describe, it, expect } from "vitest";
import { renderDigestHtml } from "../email-templates.js";

const sampleData = {
  userEmail: "jane@example.com",
  userName: "Jane",
  productName: "ProposalAI",
  weekNumber: 23,
  tasksDone: 4,
  tasksTotal: 5,
  shippingScore: 80,
  streak: 6,
  oneThing: "Stop perfectionism. Ship the v0.1 with a known gap.",
  nextSteps: [],
  dashboardUrl: "https://loopkit.dev/dashboard",
  unsubscribeUrl: "https://loopkit.dev/api/email/unsubscribe?token=abc",
  yearCardUrl: "https://loopkit.dev/wins/@jane/2026/card",
};

describe("renderDigestHtml", () => {
  it("produces valid HTML structure", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<html>");
    expect(html).toContain("</html>");
    expect(html).toContain("<body");
    expect(html).toContain("</body>");
  });

  it("includes the user name and product", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("Hi Jane");
    expect(html).toContain("ProposalAI");
  });

  it("includes all the headline numbers", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("4/5"); // tasks
    expect(html).toContain("80%"); // score
    expect(html).toContain("6"); // streak
  });

  it("includes the one-thing when present", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("Stop perfectionism");
    expect(html).toContain("Your one thing");
  });

  it("omits the one-thing block when null", () => {
    const html = renderDigestHtml({ ...sampleData, oneThing: null });
    expect(html).not.toContain("Your one thing");
  });

  it("includes the dashboard CTA", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("Open your dashboard");
    expect(html).toContain("https://loopkit.dev/dashboard");
  });

  it("includes the unsubscribe link", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("Unsubscribe");
    expect(html).toContain("https://loopkit.dev/api/email/unsubscribe?token=abc");
  });

  it("includes the year card link", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("View your 2026 year-in-review");
    expect(html).toContain("https://loopkit.dev/wins/@jane/2026/card");
  });

  it("escapes HTML in the product name to prevent XSS", () => {
    const html = renderDigestHtml({
      ...sampleData,
      productName: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in the one-thing", () => {
    const html = renderDigestHtml({
      ...sampleData,
      oneThing: 'Don\'t <img onerror=alert(1)> skip this',
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("escapes HTML in the user name", () => {
    const html = renderDigestHtml({
      ...sampleData,
      userName: "<b>Bold Jane</b>",
    });
    expect(html).toContain("&lt;b&gt;Bold Jane&lt;/b&gt;");
  });

  it("uses dark theme colors", () => {
    const html = renderDigestHtml(sampleData);
    expect(html).toContain("#0c0c0f"); // bg
    expect(html).toContain("#18181b"); // card
    expect(html).toContain("#fafafa"); // text
  });

  it("scores above 80 with success color (emerald)", () => {
    const html = renderDigestHtml({ ...sampleData, shippingScore: 90 });
    expect(html).toContain("#10B981");
  });

  it("scores below 40 with danger color (red)", () => {
    const html = renderDigestHtml({ ...sampleData, shippingScore: 20 });
    expect(html).toContain("#EF4444");
  });

  it("renders streak badge only when >= 4", () => {
    const lowStreak = renderDigestHtml({ ...sampleData, streak: 2 });
    expect(lowStreak).not.toContain("🔥");

    const highStreak = renderDigestHtml({ ...sampleData, streak: 5 });
    expect(highStreak).toContain("🔥 5");
  });
});
