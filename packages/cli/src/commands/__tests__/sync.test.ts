import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-sync-"));

import {
  getSyncStatus,
  shouldShowSyncBanner,
  type SyncStatus,
} from "../sync.js";
import { readConfig, writeConfig } from "../../storage/local.js";

describe("getSyncStatus", () => {
  beforeEach(() => {
    process.chdir(tmpDir);
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
  });

  it("returns unauthenticated when no token", () => {
    const status = getSyncStatus();
    expect(status.authenticated).toBe(false);
    expect(status.failureCount).toBe(0);
    expect(status.healthy).toBe(true);
  });

  it("returns authenticated when token present", () => {
    const config = readConfig();
    config.auth = { apiKey: "test-key" };
    writeConfig(config);

    const status = getSyncStatus();
    expect(status.authenticated).toBe(true);
  });

  it("reflects failure count from config", () => {
    const config = readConfig();
    config.auth = { apiKey: "test" };
    config.syncStatus = {
      failureCount: 5,
      lastError: "HTTP 500",
      lastAttempt: new Date().toISOString(),
    };
    writeConfig(config);

    const status = getSyncStatus();
    expect(status.failureCount).toBe(5);
    expect(status.lastError).toBe("HTTP 500");
  });
});

describe("shouldShowSyncBanner", () => {
  beforeEach(() => {
    process.chdir(tmpDir);
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
  });

  it("returns false with low failure count", () => {
    const config = readConfig();
    config.syncStatus = { failureCount: 2 };
    writeConfig(config);
    expect(shouldShowSyncBanner()).toBe(false);
  });

  it("returns true at threshold (3)", () => {
    const config = readConfig();
    config.syncStatus = { failureCount: 3 };
    writeConfig(config);
    expect(shouldShowSyncBanner()).toBe(true);
  });

  it("returns true above threshold", () => {
    const config = readConfig();
    config.syncStatus = { failureCount: 10 };
    writeConfig(config);
    expect(shouldShowSyncBanner()).toBe(true);
  });

  it("returns false with no sync status", () => {
    const config = readConfig();
    writeConfig(config);
    expect(shouldShowSyncBanner()).toBe(false);
  });
});
