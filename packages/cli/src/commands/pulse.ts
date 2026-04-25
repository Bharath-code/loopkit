import * as p from "@clack/prompts";
import { PulseClusterSchema } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { PULSE_SYSTEM_PROMPT, buildPulsePrompt } from "../ai/prompts/pulse.js";
import { readConfig } from "../storage/local.js";
import { colors, header, box, pass, warn, info, nextStep } from "../ui/theme.js";

interface PulseOptions {
  raw?: boolean;
  setup?: boolean;
}

// In-memory responses for V1 (will be replaced by Convex in web version)
// For now, pulse reads from a local JSON file
import fs from "node:fs";
import path from "node:path";

function getPulseDir(): string {
  return path.join(process.cwd(), ".loopkit", "pulse");
}

function getPulseResponsesPath(): string {
  return path.join(getPulseDir(), "responses.json");
}

function readPulseResponses(): string[] {
  const filePath = getPulseResponsesPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function savePulseResponses(responses: string[]): void {
  const dir = getPulseDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getPulseResponsesPath(), JSON.stringify(responses, null, 2));
}

export async function pulseCommand(options: PulseOptions): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  // ─── Setup: Generate feedback form URL ────────────────────────
  if (options.setup) {
    p.intro(colors.primary.bold("LoopKit — Pulse Setup"));

    if (!slug) {
      console.log(colors.danger("No active project. Run `loopkit init` first."));
      process.exit(1);
    }

    // For V1: local form. Web-hosted form comes in Phase 6.
    console.log(header("Feedback Collection — V1 (Local)"));
    console.log(
      box(
        [
          "For now, collect feedback manually and add it here:",
          "",
          colors.primary("loopkit pulse --add \"User said this thing\""),
          "",
          "Or paste responses into:",
          colors.dim(`.loopkit/pulse/responses.json`),
          "",
          "Web-hosted feedback form coming in the next release.",
        ].join("\n"),
        "Pulse Setup"
      )
    );

    p.outro(colors.muted("Collect at least 5 responses for AI clustering."));
    return;
  }

  p.intro(colors.primary.bold("LoopKit — Pulse"));

  // ─── Read responses ───────────────────────────────────────────
  const responses = readPulseResponses();

  if (responses.length === 0) {
    console.log(
      warn("No responses yet. Run `loopkit pulse --setup` to start collecting.")
    );
    console.log(
      colors.muted("  After 7 days with 0 responses: is your feedback channel visible?\n")
    );
    p.outro("");
    return;
  }

  // ─── Raw mode ─────────────────────────────────────────────────
  if (options.raw || responses.length < 5) {
    if (responses.length < 5) {
      console.log(
        warn(
          `Not enough responses to cluster reliably (${responses.length}/5 minimum). Showing raw.`
        )
      );
    }

    console.log(header(`Raw Responses (${responses.length})`));
    for (let i = 0; i < responses.length; i++) {
      console.log(`  ${colors.dim(`${i + 1}.`)} "${responses[i]}"`);
    }

    console.log(
      colors.muted("\n  Tip: Your feedback channel may need better placement.\n")
    );
    p.outro("");
    return;
  }

  // ─── AI Clustering ────────────────────────────────────────────
  const s = p.spinner();
  s.start("Clustering feedback...");

  try {
    const clusters = await generateStructured({
      system: PULSE_SYSTEM_PROMPT,
      prompt: buildPulsePrompt(responses),
      schema: PulseClusterSchema,
      tier: "fast",
      temperature: 0.2,
    });

    s.stop("Clustering complete.");

    // ─── Render clusters ────────────────────────────────────────
    for (const cluster of clusters.clusters) {
      const icon =
        cluster.label === "Fix now"
          ? colors.danger("●")
          : cluster.label === "Validate later"
            ? colors.warning("●")
            : colors.muted("●");

      console.log(header(`${icon} ${cluster.label} (${cluster.count})`));
      console.log(`  ${colors.dim(cluster.pattern)}`);
      for (const quote of cluster.quotes) {
        console.log(`  ${colors.dim("→")} "${quote}"`);
      }
    }

    if (clusters.outliers.length > 0) {
      console.log(header("Outliers"));
      for (const outlier of clusters.outliers) {
        console.log(`  ${colors.dim("?")} "${outlier}"`);
      }
    }

    console.log(
      colors.dim(
        `\n  Confidence: ${Math.round(clusters.confidence * 100)}% clearly clustered`
      )
    );
    if (clusters.note) {
      console.log(colors.dim(`  ${clusters.note}`));
    }

    // ─── Actions ────────────────────────────────────────────────
    const fixNow = clusters.clusters.find((c) => c.label === "Fix now");
    if (fixNow && fixNow.count > 0) {
      const tagAction = await p.confirm({
        message: `Tag "${fixNow.pattern}" to this week's sprint?`,
      });

      if (!p.isCancel(tagAction) && tagAction) {
        // Add as task
        console.log(pass(`Tagged to sprint: [from pulse] ${fixNow.pattern}`));
      }
    }
  } catch (error) {
    s.stop("Clustering failed.");
    console.log(warn("Clustering failed — showing raw feedback."));
    for (let i = 0; i < responses.length; i++) {
      console.log(`  ${colors.dim(`${i + 1}.`)} "${responses[i]}"`);
    }
  }

  console.log(nextStep("loop"));
  p.outro("");
}
