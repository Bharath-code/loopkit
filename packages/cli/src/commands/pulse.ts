import QRCode from "qrcode";
import { PulseClusterSchema } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { PULSE_SYSTEM_PROMPT, buildPulsePrompt } from "../ai/prompts/pulse.js";
import {
  readConfig,
  readPulseResponses,
  appendPulseResponse,
  readBriefJson,
  saveBrief,
} from "../storage/local.js";
import {
  colors,
  header,
  box,
  pass,
  warn,
  info,
  nextStep,
  shortcutsHint,
  emptyState,
  ceremonyIntro,
  ceremonyOutro,
  spinner,
  confirm,
  isCancel,
  clog,
  note,
} from "../ui/theme.js";

interface PulseOptions {
  raw?: boolean;
  setup?: boolean;
  add?: string;
  share?: boolean;
}

export async function pulseCommand(options: PulseOptions): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  // ─── --share: Generate shareable feedback URL ────────────────
  if (options.share) {
    if (!slug) {
      clog.error("No active project. Run `loopkit init` first.");
      process.exit(1);
    }

    const token = config.auth?.apiKey;
    if (!token) {
      clog.error("Authentication required. Run `loopkit auth` first.");
      process.exit(1);
    }

    const brief = readBriefJson(slug);
    const name = brief?.answers?.name || slug;

    const API_URL = process.env.LOOPKIT_API_URL || "http://localhost:3000";
    const s = spinner();
    s.start("Creating shareable feedback form...");

    try {
      const res = await fetch(`${API_URL}/api/pulse/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const { url, projectId: convexProjectId } = await res.json();
      s.stop("Feedback form ready!");

      // Store Convex project ID for future sync
      if (convexProjectId && brief?.brief) {
        saveBrief(slug, brief.answers, brief.brief, convexProjectId);
      }

      note(url, "Your Feedback URL");

      try {
        const qr = await QRCode.toString(url, {
          type: "terminal",
          small: true,
        });
        console.log("\n" + qr);
      } catch {
        // QR generation failed, URL is already shown
      }

      clog.message(
        colors.muted(
          `Embed widget: <script src="${API_URL}/api/pulse/widget?projectId=${convexProjectId || 'YOUR_PROJECT_ID'}"></script>`,
        ),
      );
    } catch (err) {
      s.stop("Failed to create share link.");
      clog.error(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      process.exit(1);
    }

    return;
  }

  // ─── --add: Append a single response ────────────────────────────────────
  if (options.add !== undefined) {
    const text = options.add.trim();
    if (!text) {
      clog.error("Response text cannot be empty.");
      process.exit(1);
    }

    // Dedup: skip exact duplicates (normalized)
    const existing = readPulseResponses();
    const normalized = text.toLowerCase().replace(/\s+/g, " ");
    const isDuplicate = existing.some(
      (r) => r.toLowerCase().replace(/\s+/g, " ") === normalized
    );
    if (isDuplicate) {
      clog.warn("Response already exists (skipped duplicate).");
      return;
    }

    appendPulseResponse(text);
    const total = readPulseResponses().length;
    clog.success(`Response added (${total} total)`);
    if (total < 5) {
      clog.message(`Need ${5 - total} more for AI clustering.`);
    }
    return;
  }

  // ─── --setup: Explain how to collect feedback ─────────────────
  if (options.setup) {
    ceremonyIntro("Pulse Setup");

    if (!slug) {
      clog.error("No active project. Run `loopkit init` first.");
      process.exit(1);
    }

    clog.step("Feedback Collection — V1 (Local)");
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
        "Pulse Setup",
      ),
    );

    ceremonyOutro("Collect at least 5 responses for AI clustering.");
    return;
  }

  ceremonyIntro("Pulse");
  console.log(shortcutsHint());

  // ─── Read responses ───────────────────────────────────────────
  const responses = readPulseResponses();

  if (responses.length === 0) {
    console.log(
      emptyState(
        "No feedback responses yet. Your users have thoughts — you just need to ask.",
        "Set up your feedback channel",
        "loopkit pulse --setup",
      ),
    );
    clog.message(
      colors.muted(
        "After 7 days with 0 responses: is your feedback channel visible?",
      ),
    );
    ceremonyOutro("");
    return;
  }

  // ─── Raw mode ─────────────────────────────────────────────────
  if (options.raw || responses.length < 5) {
    if (responses.length < 5) {
      clog.warn(
        `Not enough responses to cluster reliably (${responses.length}/5 minimum). Showing raw.`,
      );
    }

    clog.step(`Raw Responses (${responses.length})`);
    for (let i = 0; i < responses.length; i++) {
      clog.message(`${colors.dim(`${i + 1}.`)} "${responses[i]}"`);
    }

    clog.message(
      colors.muted(
        "Tip: Your feedback channel may need better placement.",
      ),
    );
    ceremonyOutro("");
    return;
  }

  // ─── AI Clustering ────────────────────────────────────────────
  const s = spinner();
  s.start("Clustering feedback...");

  try {
    const clusters = await generateStructured({
      command: "pulse",
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

      clog.step(`${icon} ${cluster.label} (${cluster.count})`);
      clog.message(colors.dim(cluster.pattern));
      for (const quote of cluster.quotes) {
        clog.message(`${colors.dim("→")} "${quote}"`);
      }
    }

    if (clusters.outliers.length > 0) {
      clog.step("Outliers");
      for (const outlier of clusters.outliers) {
        clog.message(`${colors.dim("?")} "${outlier}"`);
      }
    }

    clog.message(
      `Confidence: ${Math.round(clusters.confidence * 100)}% clearly clustered`,
    );
    if (clusters.note) {
      clog.message(clusters.note);
    }

    // ─── Tag to sprint ───────────────────────────────────────────
    const fixNow = clusters.clusters.find((c) => c.label === "Fix now");
    if (fixNow && fixNow.count > 0) {
      const tagAction = await confirm({
        message: `Tag "${fixNow.pattern}" to this week's sprint?`,
      });

      if (!isCancel(tagAction) && tagAction) {
        clog.success(`Tagged to sprint: [from pulse] ${fixNow.pattern}`);
      }
    }
  } catch {
    s.stop("Clustering failed.");
    clog.warn("Clustering failed — showing raw feedback.");
    for (let i = 0; i < responses.length; i++) {
      clog.message(`${colors.dim(`${i + 1}.`)} "${responses[i]}"`);
    }
  }

  clog.step("Next Step");
  clog.info(`Run ${colors.primary.bold("loopkit loop")} to close your weekly loop.`);
  ceremonyOutro("");
}
