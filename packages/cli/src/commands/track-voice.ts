/**
 * loopkit track --voice
 *
 * Record audio → transcribe via Whisper → extract tasks via AI →
 * preview → append to tasks.md.
 *
 * Usage:
 *   loopkit track --voice                 # 60s max
 *   loopkit track --voice --max 30        # custom max duration
 *   loopkit track --voice --no-preview    # skip confirmation
 */

import fs from "node:fs";
import { getWeekNumber } from "@loopkit/shared";
import {
  readConfig,
  readTasksFile,
  writeTasksFile,
} from "../storage/local.js";
import {
  detectAudioBackend,
  recordAudio,
  transcribe,
  extractTasks,
  renderTaskLines,
  type AudioBackend,
} from "../voice/transcribe.js";
import {
  ceremonyIntro,
  ceremonyOutro,
  ceremonyHeader,
  clog,
  colors,
  spinner,
  isCancel,
  confirm,
  info,
  warn,
} from "../ui/theme.js";

interface VoiceOptions {
  max?: number;
  preview?: boolean;
}

export async function voiceTrackCommand(options: VoiceOptions = {}): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;
  const maxSeconds = options.max ?? 60;

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    process.exit(1);
  }

  ceremonyIntro("Voice Standup", {
    tagline: `Speak for up to ${maxSeconds}s. Your words become tasks.`,
  });

  // ─── Backend check ─────────────────────────────────────────────
  const backend = detectAudioBackend();
  if (backend === "none") {
    clog.error(
      "No audio backend found. Install 'sox' (macOS: `brew install sox`) or 'ffmpeg'.",
    );
    ceremonyOutro("Cancelled.");
    return;
  }

  clog.message(`Audio backend: ${colors.secondary(backend)}`);
  clog.message("Press Ctrl+C to stop early.\n");

  // ─── Record ────────────────────────────────────────────────────
  const sRec = spinner();
  sRec.start(`Recording (max ${maxSeconds}s)...`);

  let recording;
  try {
    recording = await recordAudio(maxSeconds, backend);
  } catch (err) {
    sRec.stop("Recording failed.");
    clog.error(err instanceof Error ? err.message : String(err));
    ceremonyOutro("Try `loopkit track --add` for manual entry.");
    return;
  }
  sRec.stop(`Recorded ${(recording.durationMs / 1000).toFixed(1)}s.`);

  // ─── Transcribe ────────────────────────────────────────────────
  const sTx = spinner();
  sTx.start("Transcribing...");

  let transcript;
  try {
    transcript = await transcribe(recording.audioPath);
  } catch (err) {
    sTx.stop("Transcription failed.");
    clog.error(err instanceof Error ? err.message : String(err));
    // Clean up audio file
    safeUnlink(recording.audioPath);
    ceremonyOutro("Set OPENAI_API_KEY or use `loopkit track --add`.");
    return;
  }
  sTx.stop(`Transcribed (${(transcript.durationMs / 1000).toFixed(1)}s).`);

  clog.message("");
  clog.message(colors.muted("  Transcript:"));
  clog.message(colors.dim(`  "${transcript.text}"`));
  clog.message("");

  // ─── Extract ───────────────────────────────────────────────────
  const sEx = spinner();
  sEx.start("Extracting tasks...");

  let extracted;
  try {
    extracted = await extractTasks(transcript.text);
  } catch (err) {
    sEx.stop("Extraction failed.");
    clog.error(err instanceof Error ? err.message : String(err));
    safeUnlink(recording.audioPath);
    ceremonyOutro("AI unavailable. Try `loopkit track --add` for manual entry.");
    return;
  }
  sEx.stop(`Found ${extracted.tasks.length} task${extracted.tasks.length === 1 ? "" : "s"}.`);

  // ─── Preview ───────────────────────────────────────────────────
  clog.message("");
  clog.step("Extracted tasks");
  for (let i = 0; i < extracted.tasks.length; i++) {
    const t = extracted.tasks[i];
    const box = t.done ? colors.success("[x]") : colors.warning("[ ]");
    clog.message(`  ${box} ${t.text}`);
  }
  if (extracted.encouragement) {
    clog.message("");
    clog.message(colors.dim(`  ${extracted.encouragement}`));
  }
  clog.message("");

  // ─── Confirm & append ─────────────────────────────────────────
  const wantAdd = options.preview === false
    ? true
    : !isCancel(await confirm({ message: "Add these to tasks.md?" }));

  if (!wantAdd) {
    safeUnlink(recording.audioPath);
    ceremonyOutro("Cancelled. Nothing added.");
    return;
  }

  const weekNum = getWeekNumber();
  const lines = renderTaskLines(extracted.tasks, weekNum);

  const existing = readTasksFile(slug) || "";
  let updated: string;
  if (existing.includes("## This Week")) {
    updated = existing.replace("## This Week\n", `## This Week\n${lines.join("\n")}\n`);
  } else {
    updated = `# ${slug} — Tasks\n\n## This Week\n${lines.join("\n")}\n\n## Backlog\n`;
  }
  writeTasksFile(slug, updated);

  clog.success(`Added ${extracted.tasks.length} task${extracted.tasks.length === 1 ? "" : "s"} to tasks.md.`);

  // Cleanup
  safeUnlink(recording.audioPath);

  info("Tip: run `loopkit track` to see your updated board.");
  ceremonyOutro(`Voice standup recorded. ${extracted.tasks.length} task${extracted.tasks.length === 1 ? "" : "s"} added.`);
}

function safeUnlink(path: string): void {
  try {
    fs.unlinkSync(path);
  } catch {
    /* ignore */
  }
}
