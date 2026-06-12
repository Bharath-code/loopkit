import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-labs-"));

import { isLabsEnabled, setLabsEnabled, labsGate, listLabsCommands } from "../labs.js";
import { readConfig, writeConfig } from "../../storage/local.js";

describe("labs flag", () => {
  beforeEach(() => {
    // Reset working dir to a stable path
    process.chdir(tmpDir);
    // Wipe .loopkit inside tmp
    fs.rmSync(path.join(tmpDir, ".loopkit"), { recursive: true, force: true });
    delete process.env.LOOPKIT_LABS;
  });

  afterEach(() => {
    delete process.env.LOOPKIT_LABS;
  });

  it("returns false by default", () => {
    expect(isLabsEnabled()).toBe(false);
  });

  it("respects LOOPKIT_LABS=1 env var", () => {
    process.env.LOOPKIT_LABS = "1";
    expect(isLabsEnabled()).toBe(true);
  });

  it("respects LOOPKIT_LABS=0 env var", () => {
    process.env.LOOPKIT_LABS = "0";
    expect(isLabsEnabled()).toBe(false);
  });

  it("setLabsEnabled persists to config", () => {
    setLabsEnabled(true);
    const cfg = readConfig();
    expect(cfg.labsEnabled).toBe(true);
  });

  it("labsGate returns true for non-labs commands", () => {
    expect(labsGate("init")).toBe(true);
    expect(labsGate("loop")).toBe(true);
  });

  it("labsGate blocks unflagged labs commands", () => {
    expect(labsGate("radar")).toBe(false);
    expect(labsGate("keywords")).toBe(false);
    expect(labsGate("timing")).toBe(false);
    expect(labsGate("update")).toBe(false);
  });

  it("labsGate allows flagged labs commands", () => {
    process.env.LOOPKIT_LABS = "1";
    expect(labsGate("radar")).toBe(true);
    expect(labsGate("update")).toBe(true);
  });

  it("listLabsCommands returns the gated set", () => {
    const cmds = listLabsCommands();
    expect(cmds).toContain("radar");
    expect(cmds).toContain("keywords");
    expect(cmds).toContain("timing");
    expect(cmds).toContain("update");
    expect(cmds.length).toBe(4);
  });
});
