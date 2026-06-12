import { describe, it, expect } from "vitest";
import { decodeWebPayload, slugFromProduct } from "../from-web.js";

describe("decodeWebPayload", () => {
  it("decodes a valid payload with product + problem", () => {
    const payload = Buffer.from(
      JSON.stringify({ product: "ProposalAI", problem: "Freelancers lose deals" }),
    ).toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.ok).toBe(true);
    expect(r.answers.name).toBe("ProposalAI");
    expect(r.answers.problem).toBe("Freelancers lose deals");
    expect(r.error).toBeUndefined();
  });

  it("decodes all 5 init answer fields when present", () => {
    const payload = Buffer.from(
      JSON.stringify({
        product: "TestApp",
        problem: "P1",
        icp: "I1",
        whyUnsolved: "W1",
        mvp: "M1",
      }),
    ).toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.ok).toBe(true);
    expect(r.answers).toEqual({
      name: "TestApp",
      problem: "P1",
      icp: "I1",
      whyUnsolved: "W1",
      mvp: "M1",
    });
  });

  it("ignores the metric field (CLI doesn't use it for init)", () => {
    const payload = Buffer.from(
      JSON.stringify({ product: "X", problem: "Y", metric: "revenue" }),
    ).toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.ok).toBe(true);
    expect(r.answers.name).toBe("X");
    expect((r.answers as Record<string, unknown>).metric).toBeUndefined();
  });

  it("trims whitespace from string fields", () => {
    const payload = Buffer.from(
      JSON.stringify({ product: "  TestApp  ", problem: "\nP1\n" }),
    ).toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.answers.name).toBe("TestApp");
    expect(r.answers.problem).toBe("P1");
  });

  it("rejects empty payload", () => {
    const r = decodeWebPayload("");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Empty payload");
    expect(r.answers).toEqual({});
  });

  it("rejects non-string input", () => {
    const r = decodeWebPayload(undefined as unknown as string);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Empty payload");
  });

  it("rejects invalid base64", () => {
    const r = decodeWebPayload("!!!not-base64!!!");
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });

  it("rejects valid base64 but not JSON", () => {
    const payload = Buffer.from("not json at all").toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.ok).toBe(false);
    expect(r.error).toBeDefined();
  });

  it("handles empty answer strings (skips them, doesn't store empty)", () => {
    const payload = Buffer.from(
      JSON.stringify({ product: "", problem: "  ", icp: "valid" }),
    ).toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.ok).toBe(true);
    expect(r.answers.name).toBeUndefined();
    expect(r.answers.problem).toBeUndefined();
    expect(r.answers.icp).toBe("valid");
  });

  it("handles non-string fields by skipping them", () => {
    const payload = Buffer.from(
      JSON.stringify({ product: 123, problem: { weird: true }, icp: "ok" }),
    ).toString("base64");
    const r = decodeWebPayload(payload);
    expect(r.ok).toBe(true);
    expect(r.answers.name).toBeUndefined();
    expect(r.answers.problem).toBeUndefined();
    expect(r.answers.icp).toBe("ok");
  });

  it("round-trips a realistic onboarding payload", () => {
    const original = {
      product: "PulseDeck",
      problem:
        "Founders ship inconsistently and lose momentum after week 2",
      metric: "shipped",
    };
    const encoded = Buffer.from(JSON.stringify(original)).toString("base64");
    const r = decodeWebPayload(encoded);
    expect(r.ok).toBe(true);
    expect(r.answers.name).toBe("PulseDeck");
    expect(r.answers.problem).toBe(original.problem);
  });
});

describe("slugFromProduct", () => {
  it("lowercases and hyphenates", () => {
    expect(slugFromProduct("ProposalAI")).toBe("proposalai");
    expect(slugFromProduct("My Cool App")).toBe("my-cool-app");
  });

  it("strips leading/trailing hyphens", () => {
    expect(slugFromProduct("---Test---")).toBe("test");
  });

  it("collapses multiple non-alphanumeric chars", () => {
    expect(slugFromProduct("Hello!!! World???")).toBe("hello-world");
  });

  it("truncates to 40 chars", () => {
    const long = "a".repeat(60);
    expect(slugFromProduct(long)).toHaveLength(40);
  });

  it("returns empty string for empty input", () => {
    expect(slugFromProduct("")).toBe("");
  });
});
