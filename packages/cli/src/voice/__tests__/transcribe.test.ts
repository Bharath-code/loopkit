import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-voice-"));

import {
  detectAudioBackend,
  renderTaskLines,
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionPrompt,
} from "../transcribe.js";
import { ExtractedTasksSchema } from "../transcribe.js";

describe("detectAudioBackend", () => {
  it("returns a string (any of the 5 possible values)", () => {
    const backend = detectAudioBackend();
    expect(["rec", "arecord", "ffmpeg", "powershell", "none"]).toContain(backend);
  });
});

describe("ExtractedTasksSchema", () => {
  it("parses valid extraction", () => {
    const result = ExtractedTasksSchema.parse({
      tasks: [
        { text: "Ship the auth flow", done: true },
        { text: "Start the dashboard", done: false },
      ],
      encouragement: "Nice ship!",
    });
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].done).toBe(true);
  });

  it("rejects empty tasks array", () => {
    expect(() => ExtractedTasksSchema.parse({ tasks: [] })).toThrow();
  });

  it("rejects too many tasks (max 10)", () => {
    const tasks = Array.from({ length: 11 }, (_, i) => ({ text: `t${i}`, done: false }));
    expect(() => ExtractedTasksSchema.parse({ tasks })).toThrow();
  });

  it("rejects task text under 3 chars", () => {
    expect(() =>
      ExtractedTasksSchema.parse({ tasks: [{ text: "ab", done: false }] }),
    ).toThrow();
  });

  it("rejects task text over 200 chars", () => {
    expect(() =>
      ExtractedTasksSchema.parse({
        tasks: [{ text: "x".repeat(201), done: false }],
      }),
    ).toThrow();
  });

  it("encouragement is optional", () => {
    const result = ExtractedTasksSchema.parse({
      tasks: [{ text: "Do the thing", done: true }],
    });
    expect(result.encouragement).toBeUndefined();
  });
});

describe("EXTRACTION_SYSTEM_PROMPT", () => {
  it("contains key rules", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("tasks");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("done");
  });
});

describe("buildExtractionPrompt", () => {
  it("includes the transcript", () => {
    const prompt = buildExtractionPrompt("I shipped the auth flow today");
    expect(prompt).toContain("shipped the auth flow today");
  });
});

describe("renderTaskLines", () => {
  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  it("renders done tasks with [x]", () => {
    const lines = renderTaskLines(
      [{ text: "Ship the auth flow", done: true }],
      23,
    );
    expect(lines[0]).toMatch(/^- \[x\] #W23-v1 Ship the auth flow — created:/);
  });

  it("renders open tasks with [ ]", () => {
    const lines = renderTaskLines(
      [{ text: "Start the dashboard", done: false }],
      23,
    );
    expect(lines[0]).toMatch(/^- \[ \] #W23-v1 Start the dashboard — created:/);
  });

  it("renders multiple tasks with incrementing indices", () => {
    const lines = renderTaskLines(
      [
        { text: "Task A", done: true },
        { text: "Task B", done: false },
        { text: "Task C", done: true },
      ],
      5,
    );
    expect(lines[0]).toContain("#W5-v1");
    expect(lines[1]).toContain("#W5-v2");
    expect(lines[2]).toContain("#W5-v3");
  });

  it("uses today's date by default", () => {
    const lines = renderTaskLines(
      [{ text: "Test", done: false }],
      1,
    );
    const today = new Date().toISOString().split("T")[0];
    expect(lines[0]).toContain(`created:${today}`);
  });

  it("accepts a custom date", () => {
    const lines = renderTaskLines(
      [{ text: "Test", done: true }],
      1,
      "2026-01-15",
    );
    expect(lines[0]).toContain("created:2026-01-15");
  });
});

describe("transcribe error paths", () => {
  it("rejects without OPENAI_API_KEY", async () => {
    const { transcribe } = await import("../transcribe.js");
    const prevKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      await expect(transcribe("/tmp/fake.wav")).rejects.toThrow(/OPENAI_API_KEY/);
    } finally {
      if (prevKey) process.env.OPENAI_API_KEY = prevKey;
    }
  });
});

describe("recordAudio error paths", () => {
  it("rejects when no audio backend is available", async () => {
    const { recordAudio } = await import("../transcribe.js");
    const { recordAudio: ra } = await import("../transcribe.js");
    // Pass 'none' explicitly to test the error path
    await expect(ra(5, "none" as Parameters<typeof ra>[1])).rejects.toThrow(
      /No audio backend/,
    );
  });
});
