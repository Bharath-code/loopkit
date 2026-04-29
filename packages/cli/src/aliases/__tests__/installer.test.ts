import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  installAliases,
  removeAliases,
  getShellInfo,
} from "../installer";

const TEST_BASE = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-test-aliases-"));

function setCwdToTestDir(): void {
  process.chdir(TEST_BASE);
}

function cleanupTestDir(): void {
  if (fs.existsSync(TEST_BASE)) {
    fs.rmSync(TEST_BASE, { recursive: true, force: true });
  }
}

describe("installAliases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when SHELL env var is not set", async () => {
    const originalShell = process.env.SHELL;
    delete process.env.SHELL;
    const result = await installAliases();
    expect(result).toBe(false);
    process.env.SHELL = originalShell;
  });

  it("returns false for unsupported shell", async () => {
    process.env.SHELL = "/bin/unknown-shell";
    const result = await installAliases();
    expect(result).toBe(false);
  });
});

describe("removeAliases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when SHELL env var is not set", async () => {
    const originalShell = process.env.SHELL;
    delete process.env.SHELL;
    const result = await removeAliases();
    expect(result).toBe(false);
    process.env.SHELL = originalShell;
  });
});

describe("getShellInfo", () => {
  it("returns null when SHELL env var is not set", () => {
    const originalShell = process.env.SHELL;
    delete process.env.SHELL;
    const result = getShellInfo();
    expect(result).toBeNull();
    process.env.SHELL = originalShell;
  });

  it("returns shell info for Zsh", () => {
    process.env.SHELL = "/bin/zsh";
    const result = getShellInfo();
    expect(result).not.toBeNull();
    expect(result?.shell).toBe("/bin/zsh");
    expect(result?.configFile).toContain(".zshrc");
  });

  it("returns shell info for Bash", () => {
    process.env.SHELL = "/bin/bash";
    const result = getShellInfo();
    expect(result).not.toBeNull();
    expect(result?.shell).toBe("/bin/bash");
    expect(result?.configFile).toContain(".bashrc");
  });

  it("returns shell info for Fish", () => {
    process.env.SHELL = "/usr/local/bin/fish";
    const result = getShellInfo();
    expect(result).not.toBeNull();
    expect(result?.shell).toBe("/usr/local/bin/fish");
    expect(result?.configFile).toContain(".config/fish/config.fish");
  });

  it("returns null for unsupported shell", () => {
    process.env.SHELL = "/bin/unknown-shell";
    const result = getShellInfo();
    expect(result).toBeNull();
  });
});
