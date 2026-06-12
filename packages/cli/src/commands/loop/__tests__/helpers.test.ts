import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-loop-helpers-"));
process.chdir(tmpDir);

import {
  parseShippingScore,
  findPreviousScore,
  didActOnFeedback,
  computeLoopProof,
  formatScoreDelta,
  detectHighOverrideRate,
} from "../helpers.js";
import {
  readPulseResponses,
  writeTasksFile,
  readTasksFile,
} from "../../../storage/local.js";

describe("parseShippingScore", () => {
  it("parses plain 'Shipping score: 75%' format", () => {
    expect(parseShippingScore("- Shipping score: 75%")).toBe(75);
  });

  it("parses bold '**Shipping Score:** 80%' format", () => {
    expect(parseShippingScore("**Shipping Score:** 80%")).toBe(80);
  });

  it("is case-insensitive", () => {
    expect(parseShippingScore("- SHIPPING SCORE: 60%")).toBe(60);
  });

  it("returns null on null content", () => {
    expect(parseShippingScore(null)).toBeNull();
  });

  it("returns null when no match", () => {
    expect(parseShippingScore("no score here")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseShippingScore("")).toBeNull();
  });
});

describe("findPreviousScore", () => {
  beforeEach(() => {
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
    process.chdir(tmpDir);
  });

  it("returns 0 for empty input", () => {
    expect(findPreviousScore([])).toBe(0);
  });

  it("returns 0 when no logs exist", () => {
    expect(findPreviousScore([1, 2, 3])).toBe(0);
  });

  it("returns first match in descending order", () => {
    fs.mkdirSync(path.join(tmpDir, ".loopkit", "logs"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, ".loopkit", "logs", "week-1.md"),
      "- Shipping score: 50%",
    );
    fs.writeFileSync(
      path.join(tmpDir, ".loopkit", "logs", "week-2.md"),
      "- Shipping score: 70%",
    );

    expect(findPreviousScore([1, 2])).toBe(70);
    expect(findPreviousScore([2, 1])).toBe(70);
  });
});

describe("didActOnFeedback", () => {
  it("returns false when no feedback", () => {
    expect(didActOnFeedback("did some work", 0)).toBe(false);
  });

  it("returns true when feedback exists and tasks mention user/feedback", () => {
    expect(didActOnFeedback("fix onboarding based on user feedback", 1)).toBe(true);
  });

  it("returns false when feedback exists but tasks don't relate", () => {
    expect(didActOnFeedback("wrote the new homepage", 5)).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(didActOnFeedback("Fixed CUSTOMER complaint", 1)).toBe(true);
  });
});

describe("formatScoreDelta", () => {
  it("prepends + to positive numbers", () => {
    expect(formatScoreDelta(5)).toBe("+5");
  });

  it("keeps negative numbers as-is", () => {
    expect(formatScoreDelta(-3)).toBe("-3");
  });

  it("formats zero without sign", () => {
    expect(formatScoreDelta(0)).toBe("0");
  });
});

describe("detectHighOverrideRate", () => {
  beforeEach(() => {
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
    process.chdir(tmpDir);
  });

  it("returns null with insufficient history", () => {
    expect(detectHighOverrideRate("test")).toBeNull();
  });
});
