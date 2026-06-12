import { describe, it, expect } from "vitest";
import { parseLoopLog, buildFrontmatter, type LoopLogFrontmatter } from "../frontmatter.js";

const SAMPLE_VALID = `---
week: 23
date: 2026-06-12
project: proposalai
tasksCompleted: 4
tasksTotal: 5
shippingScore: 80
loopkitScore: 74
streak: 6
override: false
tension: null
---

# Week 23 — 2026-06-12

## What Moved Forward
Shipped the auth flow and the first landing page.
`;

const SAMPLE_LEGACY = `# Week 22 — 2026-06-05 | project:foo

## Summary
- Tasks completed: 3
- Tasks open: 2
- Shipping score: 60%
- LoopKit Score: 65

## What Moved Forward
Made progress on the dashboard.
`;

describe("parseLoopLog", () => {
  it("parses valid frontmatter into structured fields", () => {
    const result = parseLoopLog(SAMPLE_VALID);
    expect(result.isLegacy).toBe(false);
    expect(result.frontmatter).toEqual({
      week: 23,
      date: "2026-06-12",
      project: "proposalai",
      tasksCompleted: 4,
      tasksTotal: 5,
      shippingScore: 80,
      loopkitScore: 74,
      streak: 6,
      override: false,
      tension: null,
    });
    expect(result.body).toContain("## What Moved Forward");
  });

  it("extracts body without frontmatter block", () => {
    const result = parseLoopLog(SAMPLE_VALID);
    expect(result.body).not.toContain("---");
  });

  it("falls back to legacy extraction for old logs", () => {
    const result = parseLoopLog(SAMPLE_LEGACY);
    expect(result.isLegacy).toBe(true);
    expect(result.frontmatter?.week).toBe(22);
    expect(result.frontmatter?.tasksCompleted).toBe(3);
    expect(result.frontmatter?.tasksTotal).toBe(5);
    expect(result.frontmatter?.shippingScore).toBe(60);
    expect(result.frontmatter?.loopkitScore).toBe(65);
    expect(result.frontmatter?.project).toBe("foo");
    expect(result.frontmatter?.override).toBe(false);
  });

  it("detects override flag in legacy logs", () => {
    const withOverride = SAMPLE_LEGACY + "\n_Override: too generic_\n";
    const result = parseLoopLog(withOverride);
    expect(result.frontmatter?.override).toBe(true);
  });

  it("returns safe defaults on empty content", () => {
    const result = parseLoopLog("");
    expect(result.frontmatter?.week).toBe(0);
    expect(result.frontmatter?.shippingScore).toBe(0);
  });

  it("handles missing optional fields", () => {
    const partial = `---
week: 5
date: 2026-02-01
project: x
tasksCompleted: 1
tasksTotal: 2
shippingScore: 50
override: false
tension: null
---

body
`;
    const result = parseLoopLog(partial);
    expect(result.isLegacy).toBe(false);
    expect(result.frontmatter?.loopkitScore).toBeNull();
    expect(result.frontmatter?.streak).toBeNull();
  });
});

describe("buildFrontmatter", () => {
  it("emits a valid frontmatter block", () => {
    const fm: Partial<LoopLogFrontmatter> = {
      week: 10,
      date: "2026-03-01",
      project: "test",
      tasksCompleted: 2,
      tasksTotal: 3,
      shippingScore: 66,
      loopkitScore: null,
      streak: 2,
      override: false,
      tension: null,
    };
    const out = buildFrontmatter(fm);
    expect(out.startsWith("---\n")).toBe(true);
    expect(out).toContain("week: 10");
    expect(out).toContain("shippingScore: 66");
    expect(out).toContain("loopkitScore: null");
    expect(out).toContain("override: false");
  });

  it("round-trips through parseLoopLog", () => {
    const fm: Partial<LoopLogFrontmatter> = {
      week: 7,
      date: "2026-02-15",
      project: "round-trip",
      tasksCompleted: 5,
      tasksTotal: 5,
      shippingScore: 100,
      loopkitScore: 88,
      streak: 3,
      override: true,
      tension: "scope creep",
    };
    const built = buildFrontmatter(fm) + "\n# body\n";
    const parsed = parseLoopLog(built);
    expect(parsed.isLegacy).toBe(false);
    expect(parsed.frontmatter).toEqual({
      week: 7,
      date: "2026-02-15",
      project: "round-trip",
      tasksCompleted: 5,
      tasksTotal: 5,
      shippingScore: 100,
      loopkitScore: 88,
      streak: 3,
      override: true,
      tension: "scope creep",
    });
  });
});
