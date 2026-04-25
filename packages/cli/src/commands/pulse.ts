import * as p from "@clack/prompts";
import { PulseClusterSchema } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { PULSE_SYSTEM_PROMPT, buildPulsePrompt } from "../ai/prompts/pulse.js";
import {
  readConfig,
  readPulseResponses,
  appendPulseResponse,
} from "../storage/local.js";
import { colors, header, box, pass, warn, info, nextStep } from "../ui/theme.js";

interface PulseOptions {
  raw?: boolean;
  setup?: boolean;
  add?: string;
}

export async function pulseCommand(options: PulseOptions): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  // ─── --add: Append a single response ─────────────────────────
  if (options.add !== undefined) {
    const text = options.add.trim();
    if (!text) {
      console.log(colors.danger("Response text cannot be empty."));
      process.exit(1);
    }
    appendPulseResponse(text);
    const total = readPulseResponses().length;
    console.log(pass(`Response added (${total} total)`));
    if (total < 5) {
      console.log(colors.muted(`  Need ${5 - total} more for AI clustering.`));
    }
    return;
  }

  // ─── --setup: Explain how to collect feedback ─────────────────
  if (options.setup) {
    p.intro(colors.primary.bold("LoopKit — Pulse Setup"));

    if (!slug) {
      console.log(colors.danger("No active project. Run `loopkit init` first."));
      process.exit(1);
    }

    console.log(header("Feedback Collection — V1 (Local)"));
    console.log(
      box(
        [
          "Collect feedback via any channel and add it to LoopKit:",
          "",
          colors.primary('loopkit pulse --add "User said this thing"'),
          "",
          "Or paste responses directly into:",
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
        warn(`Not enough responses to cluster reliably (${responses.length}/5 minimum). Showing raw.`)
      );
    }

    console.log(header(`Raw Responses (${responses.length})`));
    for (let i = 0; i < responses.length; i++) {
      console.log(`  ${colors.dim(`${i + 1}.`)} "${responses[i]}"`);
    }

    console.log(colors.muted("\n  Tip: Your feedback channel may need better placement.\n"));
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

    // ─── Render clusters ─────────────────────────────────────────
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
      colors.dim(`\n  Confidence: ${Math.round(clusters.confidence * 100)}% clearly clustered`)
    );
    if (clusters.note) {
      console.log(colors.dim(`  ${clusters.note}`));
    }

    // ─── Tag to sprint ───────────────────────────────────────────
    const fixNow = clusters.clusters.find((c) => c.label === "Fix now");
    if (fixNow && fixNow.count > 0) {
      const tagAction = await p.confirm({
        message: `Tag "${fixNow.pattern}" to this week's sprint?`,
      });

      if (!p.isCancel(tagAction) && tagAction) {
        console.log(pass(`Tagged to sprint: [from pulse] ${fixNow.pattern}`));
      }
    }
  } catch {
    s.stop("Clustering failed.");
    console.log(warn("Clustering failed — showing raw feedback."));
    for (let i = 0; i < responses.length; i++) {
      console.log(`  ${colors.dim(`${i + 1}.`)} "${responses[i]}"`);
    }
  }

  console.log(nextStep("loop"));
  p.outro("");
}
