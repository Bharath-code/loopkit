/**
 * Voice → Task pipeline.
 *
 * Three stages, each isolated for testability:
 *   1. Record audio (platform-native, no native deps)
 *   2. Transcribe (OpenAI Whisper if key present; else fail gracefully)
 *   3. Extract tasks (single AI call, structured output)
 *
 * The recording step uses shell-out to whatever audio capture tool is
 * available on the host: `rec` (sox) on macOS/Linux, PowerShell on
 * Windows. The transcription step is the only one that requires network
 * + an API key. The extraction step is also an AI call but reuses the
 * existing `loopkit init` Anthropic key.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { generateStructured } from "../ai/client.js";

export const ExtractedTasksSchema = z.object({
  tasks: z.array(
    z.object({
      text: z.string().min(3).max(200),
      done: z.boolean(),
    }),
  ).min(1).max(10),
  encouragement: z.string().max(140).optional(),
});

export type ExtractedTasks = z.infer<typeof ExtractedTasksSchema>;

// ─── Platform detection ───────────────────────────────────────────

export type AudioBackend = "rec" | "arecord" | "ffmpeg" | "powershell" | "none";

export function detectAudioBackend(): AudioBackend {
  const platform = process.platform;
  if (platform === "darwin" || platform === "linux") {
    if (commandExists("rec")) return "rec";
    if (commandExists("arecord")) return "arecord";
    if (commandExists("ffmpeg")) return "ffmpeg";
  }
  if (platform === "win32") {
    return "powershell";
  }
  return "none";
}

function commandExists(cmd: string): boolean {
  try {
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// ─── Recording ────────────────────────────────────────────────────

export interface RecordingResult {
  audioPath: string;
  durationMs: number;
  backend: AudioBackend;
}

const DEFAULT_MAX_SECONDS = 60;

/**
 * Record audio to a temp file. Returns the path + actual duration.
 * Stops early on SIGINT (Ctrl+C) thanks to spawn's signal handling.
 */
export async function recordAudio(
  maxSeconds: number = DEFAULT_MAX_SECONDS,
  backend: AudioBackend = detectAudioBackend(),
): Promise<RecordingResult> {
  if (backend === "none") {
    throw new Error(
      "No audio backend found. Install 'sox' (brew install sox) for 'rec', or 'ffmpeg'.",
    );
  }

  const tmpDir = os.tmpdir();
  const stamp = Date.now();
  const audioPath = path.join(tmpDir, `loopkit-voice-${stamp}.wav`);
  const start = Date.now();

  const args: string[] = backend === "ffmpeg"
    ? ["-f", "avfoundation", "-i", ":default", "-t", String(maxSeconds), "-ar", "16000", "-ac", "1", "-y", audioPath]
    : backend === "arecord"
    ? ["-d", String(maxSeconds), "-f", "S16_LE", "-r", "16000", "-c", "1", audioPath]
    : backend === "powershell"
    ? []
    : [audioPath, "trim", "0", String(maxSeconds)];

  const cmd = backend === "powershell"
    ? "powershell"
    : backend;

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", () => resolve());
  });

  if (!fs.existsSync(audioPath)) {
    throw new Error(`Recording did not produce file: ${audioPath}`);
  }

  return {
    audioPath,
    durationMs: Date.now() - start,
    backend,
  };
}

// ─── Transcription ────────────────────────────────────────────────

export interface TranscriptionResult {
  text: string;
  durationMs: number;
  model: string;
}

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

/**
 * Transcribe an audio file via OpenAI Whisper. Requires OPENAI_API_KEY
 * in env. Returns the raw text.
 */
export async function transcribe(audioPath: string): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Voice transcription requires OPENAI_API_KEY. " +
        "Set it in your env or use `loopkit track --add` for manual entry.",
    );
  }

  const start = Date.now();
  const fileBuffer = fs.readFileSync(audioPath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), path.basename(audioPath));
  formData.append("model", WHISPER_MODEL);
  formData.append("response_format", "json");

  const res = await fetch(WHISPER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Whisper API error (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as { text: string };
  return {
    text: json.text,
    durationMs: Date.now() - start,
    model: WHISPER_MODEL,
  };
}

// ─── Task extraction ──────────────────────────────────────────────

export const EXTRACTION_SYSTEM_PROMPT = `You are a parser for a solo founder's daily standup.

The user spoke into their phone for 30-60 seconds describing what they shipped today. Your job: extract concrete tasks, each one short, each one actionable.

Rules:
- Each task is a verb phrase ("Ship the auth flow", "Fix the parser bug", "Start the dashboard").
- done: true means the founder described it as completed/already shipped.
- done: false means it's still in progress or just starting.
- Don't invent tasks. Only extract what was said.
- Don't extract questions, observations, or feelings. Only tasks.
- 1-7 tasks total. If they said 1 thing, return 1 task.
- Skip filler words. Be terse.

Output JSON only. No preamble.`;

export function buildExtractionPrompt(transcript: string): string {
  return `Transcript from a founder's daily standup:

"${transcript}"

Extract the tasks.`;
}

/**
 * Extract structured tasks from a transcript using the configured AI.
 * Uses the existing `loopkit init` Anthropic auth.
 */
export async function extractTasks(transcript: string): Promise<ExtractedTasks> {
  return generateStructured({
    command: "loop",
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: buildExtractionPrompt(transcript),
    schema: ExtractedTasksSchema,
    tier: "fast",
    temperature: 0.2,
  });
}

// ─── File operations ──────────────────────────────────────────────

/**
 * Append extracted tasks to the project's tasks.md. Matches the
 * existing format:
 *   ## This Week
 *   - [ ] #W{n}-{i} <text> — created:{date}
 *   - [x] #W{n}-{i} <text> — created:{date}
 *
 * Returns the rendered lines (caller can preview before writing).
 */
export function renderTaskLines(
  tasks: ExtractedTasks["tasks"],
  weekNumber: number,
  date: string = new Date().toISOString().split("T")[0] as string,
): string[] {
  return tasks.map((t, i) => {
    const box = t.done ? "x" : " ";
    return `- [${box}] #W${weekNumber}-v${i + 1} ${t.text} — created:${date}`;
  });
}
