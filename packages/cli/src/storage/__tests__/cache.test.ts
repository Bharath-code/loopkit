import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  getCachedResult,
  setCachedResult,
  clearAllCache,
  getCacheStats,
  clearExpiredCache,
} from "../cache";

const TEST_BASE = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-cache-test-"));

function setCwdToTestDir(): void {
  process.chdir(TEST_BASE);
}

function cleanupTestDir(): void {
  if (fs.existsSync(TEST_BASE)) {
    fs.rmSync(TEST_BASE, { recursive: true, force: true });
  }
}

describe("AI Cache", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("returns null for missing cache entry", () => {
    const result = getCachedResult("init", "system", "prompt", "BriefSchema");
    expect(result).toBeNull();
  });

  it("round-trips cached data", () => {
    const data = { bet: "Test", overallScore: 7 };
    setCachedResult("init", "system", "prompt", "BriefSchema", data);
    const cached = getCachedResult("init", "system", "prompt", "BriefSchema");
    expect(cached).toEqual(data);
  });

  it("returns different results for different inputs", () => {
    setCachedResult("init", "system1", "prompt1", "BriefSchema", { a: 1 });
    setCachedResult("init", "system2", "prompt2", "BriefSchema", { a: 2 });
    expect(
      getCachedResult("init", "system1", "prompt1", "BriefSchema"),
    ).toEqual({ a: 1 });
    expect(
      getCachedResult("init", "system2", "prompt2", "BriefSchema"),
    ).toEqual({ a: 2 });
  });

  it("returns null for expired cache", () => {
    const data = { result: "test" };
    setCachedResult("ship", "sys", "prm", "ShipSchema", data);

    // Manually modify expiresAt to past
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    expect(files.length).toBe(1);
    const entry = JSON.parse(
      fs.readFileSync(path.join(cacheDir, files[0]), "utf-8"),
    );
    entry.meta.expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(path.join(cacheDir, files[0]), JSON.stringify(entry));

    expect(getCachedResult("ship", "sys", "prm", "ShipSchema")).toBeNull();
    // Should also delete the expired file
    expect(fs.existsSync(path.join(cacheDir, files[0]))).toBe(false);
  });

  it("returns null and cleans up corrupted cache file", () => {
    setCachedResult("init", "sys", "prm", "Schema", { a: 1 });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    fs.writeFileSync(path.join(cacheDir, files[0]), "not json{{{");
    expect(getCachedResult("init", "sys", "prm", "Schema")).toBeNull();
  });

  it("clearAllCache removes all entries and returns count", () => {
    setCachedResult("init", "s1", "p1", "S1", { a: 1 });
    setCachedResult("ship", "s2", "p2", "S2", { b: 2 });
    const cleared = clearAllCache();
    expect(cleared).toBe(2);
    expect(getCachedResult("init", "s1", "p1", "S1")).toBeNull();
    expect(getCachedResult("ship", "s2", "p2", "S2")).toBeNull();
  });

  it("clearAllCache returns 0 when no cache dir", () => {
    const cleared = clearAllCache();
    expect(cleared).toBe(0);
  });

  it("getCacheStats returns zero when empty", () => {
    const stats = getCacheStats();
    expect(stats.count).toBe(0);
    expect(stats.sizeBytes).toBe(0);
  });

  it("getCacheStats counts files and sizes", () => {
    setCachedResult("init", "s", "p", "S", { data: "hello world" });
    const stats = getCacheStats();
    expect(stats.count).toBe(1);
    expect(stats.sizeBytes).toBeGreaterThan(0);
  });

  it("getCacheStats handles missing files gracefully", () => {
    setCachedResult("init", "s", "p", "S", { a: 1 });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    // Create a dangling filename reference by writing a bad file that won't stat
    fs.writeFileSync(path.join(cacheDir, "bad.json"), "x");
    fs.chmodSync(path.join(cacheDir, "bad.json"), 0o000);
    const stats = getCacheStats();
    // Should not throw; count may or may not include unreadable file
    expect(stats.count).toBeGreaterThanOrEqual(1);
    fs.chmodSync(path.join(cacheDir, "bad.json"), 0o644);
  });

  it("clearExpiredCache removes expired entries", () => {
    setCachedResult("init", "s1", "p1", "S1", { a: 1 });
    setCachedResult("ship", "s2", "p2", "S2", { b: 2 });

    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    expect(files.length).toBe(2);

    // Expire one file
    const entry = JSON.parse(
      fs.readFileSync(path.join(cacheDir, files[0]), "utf-8"),
    );
    entry.meta.expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(path.join(cacheDir, files[0]), JSON.stringify(entry));

    const cleared = clearExpiredCache();
    expect(cleared).toBeGreaterThanOrEqual(1);
    expect(fs.readdirSync(cacheDir).length).toBeLessThanOrEqual(1);
  });

  it("clearExpiredCache removes corrupt files", () => {
    setCachedResult("init", "s", "p", "S", { a: 1 });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    fs.writeFileSync(path.join(cacheDir, files[0]), "corrupt");
    const cleared = clearExpiredCache();
    expect(cleared).toBeGreaterThanOrEqual(1);
  });

  it("clearExpiredCache handles both meta.expiresAt and expiresAt formats", () => {
    setCachedResult("init", "s1", "p1", "S1", { a: 1 });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);

    // Rewrite with radar-style format (no meta wrapper)
    const radarEntry = {
      result: { b: 2 },
      scannedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    fs.writeFileSync(path.join(cacheDir, files[0]), JSON.stringify(radarEntry));

    const cleared = clearExpiredCache();
    expect(cleared).toBeGreaterThanOrEqual(1);
  });

  it("clearExpiredCache returns 0 when no cache dir", () => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
    expect(clearExpiredCache()).toBe(0);
  });

  it("cache files are stored in .loopkit/cache", () => {
    setCachedResult("init", "sys", "prompt", "Schema", { test: true });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    expect(fs.existsSync(cacheDir)).toBe(true);
    const files = fs.readdirSync(cacheDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/[a-f0-9]+\.json$/);
  });

  it("different commands produce different cache hashes", () => {
    setCachedResult("init", "same-sys", "same-prompt", "SameSchema", { a: 1 });
    setCachedResult("ship", "same-sys", "same-prompt", "SameSchema", { b: 2 });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    expect(files.length).toBe(2);
  });

  it("cache entry includes metadata", () => {
    setCachedResult("init", "sys", "prompt", "MySchema", { data: 42 });
    const cacheDir = path.join(TEST_BASE, ".loopkit", "cache");
    const files = fs.readdirSync(cacheDir);
    const entry = JSON.parse(
      fs.readFileSync(path.join(cacheDir, files[0]), "utf-8"),
    );
    expect(entry.meta.command).toBe("init");
    expect(entry.meta.schema).toBe("MySchema");
    expect(new Date(entry.meta.createdAt).getTime()).toBeLessThanOrEqual(
      Date.now(),
    );
    expect(new Date(entry.meta.expiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });
});
