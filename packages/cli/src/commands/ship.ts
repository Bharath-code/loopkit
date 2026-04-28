import * as p from "@clack/prompts";
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ShipDraftsSchema, formatDate } from "@loopkit/shared";
import { generateStructured } from "../ai/client.js";
import { SHIP_SYSTEM_PROMPT, buildShipPrompt } from "../ai/prompts/ship.js";
import {
  readConfig,
  readBriefJson,
  readTasksFile,
  saveShipLog,
  shipLogExists,
} from "../storage/local.js";
import { pushShipLogToConvex, getConvexProjectId } from "../storage/sync.js";
import { colors, header, pass, fail, warn, box, nextStep, info, shortcutsHint, emptyState, coachingCard } from "../ui/theme.js";
import { celebrateCommand } from "./celebrate.js";
import { fetchPeerShips, recordPeerShip, renderPeerInspiration } from "../analytics/peers.js";
import { getPriorityMoment, recordMomentShown } from "../analytics/coach.js";

// ─── Context shape passed to AI ────────────────────────────────
interface ShipContext {
  productName: string;
  bet?: string;
  icp?: string;
  problem?: string;
  tasksCompleted: string[];
  whatShipped: string;
}

// ─── Per-platform draft ────────────────────────────────────────
interface PlatformDraft {
  key: "hn" | "twitter" | "ih";
  label: string;
  content: string;
}

// ─── Generate drafts from AI ───────────────────────────────────
async function generateDrafts(ctx: ShipContext): Promise<{ platforms: PlatformDraft[]; raw: typeof ShipDraftsSchema._type }> {
  const drafts = await generateStructured({
    command: "ship",
    system: SHIP_SYSTEM_PROMPT,
    prompt: buildShipPrompt(ctx),
    schema: ShipDraftsSchema,
    tier: "creative",
    temperature: 0.6,
  });

  const platforms: PlatformDraft[] = [
    {
      key: "hn",
      label: "Show HN",
      content: `${drafts.hn.title}\n\n${drafts.hn.body}`,
    },
    {
      key: "twitter",
      label: "Twitter Thread",
      content: drafts.twitter.tweets.map((t, i) => `${i + 1}. ${t}`).join("\n\n"),
    },
    {
      key: "ih",
      label: "Indie Hackers",
      content: drafts.ih.body,
    },
  ];

  return { platforms, raw: drafts };
}

// ─── Open content in $EDITOR, return edited text ──────────────
function openInEditor(content: string): string {
  const editor =
    process.env.EDITOR ||
    process.env.VISUAL ||
    (process.platform === "win32" ? "notepad" : "nano");

  // Write to a temp file inside OS temp dir (not project data)
  const tmpFile = path.join(os.tmpdir(), `loopkit-draft-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, content, "utf-8");

  try {
    const result = spawnSync(editor, [tmpFile], { stdio: "inherit" });
    if (result.error) {
      console.log(warn(`Could not open ${editor}: ${result.error.message}`));
      return content; // fallback: return original
    }
    return fs.readFileSync(tmpFile, "utf-8");
  } finally {
    // Best-effort cleanup
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

export async function shipCommand(): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  p.intro(colors.primary.bold("LoopKit — Ship it"));
  console.log(shortcutsHint());

  // ─── Gather context ──────────────────────────────────────────
  let productName = slug || "your product";
  let bet: string | undefined;
  let icp: string | undefined;
  let problem: string | undefined;
  let tasksCompleted: string[] = [];

  if (slug) {
    const briefData = readBriefJson(slug);
    if (briefData) {
      productName = briefData.answers.name;
      problem = briefData.answers.problem;
      icp = briefData.answers.icp;
      bet = briefData.brief?.bet;
    }

    // Parse completed tasks
    const tasksContent = readTasksFile(slug);
    if (tasksContent) {
      const lines = tasksContent.split("\n");
      tasksCompleted = lines
        .filter((l) => /^\s*-\s*\[x\]/i.test(l))
        .map((l) => l.replace(/^\s*-\s*\[x\]\s*/, "").trim());
    }
  }

  if (!slug) {
    // Fallback: ask inline questions
    console.log(warn("No brief found. Run `loopkit init` first for better AI output."));

    const name = await p.text({ message: "Product name?" });
    if (p.isCancel(name)) { p.cancel("Cancelled."); process.exit(0); }
    productName = name;

    const who = await p.text({ message: "Who is it for?" });
    if (p.isCancel(who)) { p.cancel("Cancelled."); process.exit(0); }
    icp = who;
  }

  if (tasksCompleted.length === 0) {
    console.log(
      emptyState(
        "No completed tasks this week. You can still ship — even small wins count.",
        "Track your progress first",
        "loopkit track"
      )
    );
  }

  // ─── AI Coach v1 (IE-10) — ship avoidance ─────────────────────
  if (slug && config.coaching?.enabled !== false) {
    const coachMoment = getPriorityMoment(slug);
    if (coachMoment && coachMoment.id === "ship_avoider_critical") {
      console.log(coachingCard(coachMoment));
      recordMomentShown(coachMoment.id);
    }
  }

  // ─── What shipped ────────────────────────────────────────────
  const rawWhatShipped = await p.text({
    message: "What's the main thing you shipped? (one sentence)",
    placeholder: "e.g. Added PDF export for SOW documents",
  });

  if (p.isCancel(rawWhatShipped)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  // Truncate to keep AI output calibrated
  const whatShipped = (rawWhatShipped as string).slice(0, 200);

  // ─── Check if ship log exists today ───────────────────────────
  const today = formatDate();
  if (shipLogExists(today)) {
    const overwrite = await p.select({
      message: "A ship log exists for today.",
      options: [
        { value: "overwrite", label: "[o]verwrite" },
        { value: "append", label: "[a]ppend" },
        { value: "skip", label: "[s]kip" },
      ],
    });
    if (p.isCancel(overwrite) || overwrite === "skip") {
      p.outro("Skipped.");
      return;
    }
  }

  // ─── Generate initial drafts ─────────────────────────────────
  const ctx: ShipContext = {
    productName,
    bet,
    icp,
    problem,
    tasksCompleted,
    whatShipped,
  };

  const s = p.spinner();
  s.start("Generating drafts for HN, Twitter, and Indie Hackers...");

  let platforms: PlatformDraft[];
  let rawDrafts: typeof ShipDraftsSchema._type | undefined;

  // Initialise checklist — will be filled after draft review
  const checklist: Record<string, boolean> = {};

  try {
    const result = await generateDrafts(ctx);
    platforms = result.platforms;
    rawDrafts = result.raw;
    s.stop("Drafts ready.");
  } catch {
    s.stop("Draft generation failed.");
    console.log(colors.danger("AI unavailable. Saving ship log without drafts."));

    // Still collect the checklist on failure
    console.log(header("Pre-Launch Checklist"));
    const readmeUpdated = await p.confirm({ message: "README updated this week?" });
    checklist["readme"] = !p.isCancel(readmeUpdated) && readmeUpdated;
    const landingLive = await p.confirm({ message: "Landing page live?" });
    checklist["landing"] = !p.isCancel(landingLive) && landingLive;
    const analyticsOn = await p.confirm({ message: "Analytics installed?" });
    checklist["analytics"] = !p.isCancel(analyticsOn) && analyticsOn;
    const feedbackOn = await p.confirm({ message: "Feedback collection active?" });
    checklist["feedback"] = !p.isCancel(feedbackOn) && feedbackOn;

    const logContent = buildLogContent(today, productName, whatShipped, checklist, []);
    saveShipLog(logContent, today);

    // ─── Sync ship log to Convex (best-effort) ──────────────────
    const convexProjectId = slug ? getConvexProjectId(slug) : undefined;
    if (convexProjectId) {
      await pushShipLogToConvex({
        projectId: convexProjectId,
        date: today,
        whatShipped,
        checklist: {
          readmeUpdated: checklist["readme"] ?? false,
          landingPageLive: checklist["landing"] ?? false,
          analyticsPresent: checklist["analytics"] ?? false,
          feedbackWidgetInstalled: checklist["feedback"] ?? false,
        },
      });
    }

    console.log(info(`Ship log saved → .loopkit/ships/${today}.md`));
    console.log(nextStep("loop", "Close your week Sunday"));
    p.outro(colors.muted("Shipped. Now close the loop Sunday."));
    return;
  }

  // ─── Per-draft review loop ────────────────────────────────────
  const usedDrafts: string[] = [];

  for (let i = 0; i < platforms.length; i++) {
    let platform = platforms[i];
    let done = false;

    while (!done) {
      console.log(header(platform.label));
      console.log(box(platform.content));

      // Show character count for Twitter drafts
      if (platform.key === "twitter") {
        const tweetParts = platform.content.split("\n\n");
        for (const tweet of tweetParts) {
          const clean = tweet.replace(/^\d+\.\s*/, "");
          if (clean.length > 240) {
            console.log(colors.warning(`  ⚠ Tweet is ${clean.length} chars — over 240 recommended`));
          }
        }
      }

      const action = await p.select({
        message: `${platform.label}:`,
        options: [
          { value: "use", label: "[u]se as-is" },
          { value: "edit", label: "[e]dit in $EDITOR" },
          { value: "regenerate", label: "[r]egenerate" },
          { value: "skip", label: "[s]kip" },
        ],
      });

      if (p.isCancel(action) || action === "skip") {
        done = true;
        continue;
      }

      if (action === "use") {
        usedDrafts.push(`## ${platform.label}\n\n${platform.content}`);
        done = true;
        continue;
      }

      if (action === "edit") {
        const edited = openInEditor(platform.content);
        platform = { ...platform, content: edited };
        continue;
      }

      if (action === "regenerate") {
        const rs = p.spinner();
        rs.start(`Regenerating ${platform.label}...`);
        try {
          const result = await generateDrafts(ctx);
          const regenerated = result.platforms.find((pl) => pl.key === platform.key);
          if (regenerated) {
            platform = regenerated;
            rawDrafts = result.raw;
          }
          rs.stop("Done.");
        } catch {
          rs.stop("Regeneration failed.");
          console.log(warn("Could not regenerate — using previous draft."));
        }
        continue;
      }
    }
  }

  // ─── Pre-launch checklist (after draft review — user has seen value first) ──
  console.log(header("Pre-Launch Checklist"));

  const readmeUpdated = await p.confirm({ message: "README updated this week?" });
  checklist["readme"] = !p.isCancel(readmeUpdated) && readmeUpdated;
  console.log(checklist["readme"] ? pass("README updated") : warn("README not updated"));

  const landingLive = await p.confirm({ message: "Landing page live?" });
  checklist["landing"] = !p.isCancel(landingLive) && landingLive;
  console.log(checklist["landing"] ? pass("Landing page live") : warn("No landing page"));

  const analyticsOn = await p.confirm({ message: "Analytics installed?" });
  checklist["analytics"] = !p.isCancel(analyticsOn) && analyticsOn;
  console.log(checklist["analytics"] ? pass("Analytics active") : warn("No analytics — add PostHog"));

  const feedbackOn = await p.confirm({ message: "Feedback collection active?" });
  checklist["feedback"] = !p.isCancel(feedbackOn) && feedbackOn;
  console.log(
    checklist["feedback"] ? pass("Feedback active") : warn("No feedback — run `loopkit pulse --setup`")
  );

  // ─── Save ship log ────────────────────────────────────────────
  const logContent = buildLogContent(today, productName, whatShipped, checklist, usedDrafts);
  saveShipLog(logContent, today);
  console.log(info(`Ship log saved → .loopkit/ships/${today}.md`));

  // ─── Sync ship log to Convex (best-effort) ────────────────────
  const convexProjectId = slug ? getConvexProjectId(slug) : undefined;
  if (convexProjectId) {
    await pushShipLogToConvex({
      projectId: convexProjectId,
      date: today,
      whatShipped,
      drafts: rawDrafts
        ? {
            hn: rawDrafts.hn,
            twitter: rawDrafts.twitter,
            ih: rawDrafts.ih,
          }
        : undefined,
      checklist: {
        readmeUpdated: checklist["readme"] ?? false,
        landingPageLive: checklist["landing"] ?? false,
        analyticsPresent: checklist["analytics"] ?? false,
        feedbackWidgetInstalled: checklist["feedback"] ?? false,
      },
    });
  }

  // ─── Record anonymized peer ship (opt-in) ─────────────────────
  if (slug) {
    await recordPeerShip(slug, whatShipped);
  }

  // ─── Peer Inspiration (IE-7) ──────────────────────────────────
  if (slug) {
    const peers = await fetchPeerShips(slug, 3);
    const peerOutput = renderPeerInspiration(peers, slug);
    if (peerOutput) {
      console.log(peerOutput);
    }
  }

  // ─── Auto-trigger celebration only when drafts were used ──────
  if (usedDrafts.length > 0) {
    console.log(nextStep("celebrate"));
    await celebrateCommand();
  } else {
    console.log(nextStep("loop", "Close your week Sunday"));
    p.outro(colors.muted("Shipped. Now close the loop Sunday."));
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function buildLogContent(
  today: string,
  productName: string,
  whatShipped: string,
  checklist: Record<string, boolean>,
  usedDrafts: string[]
): string {
  return [
    `# Ship Log — ${today}`,
    "",
    `**Product:** ${productName}`,
    `**What shipped:** ${whatShipped}`,
    "",
    "## Checklist",
    ...Object.entries(checklist).map(([k, v]) => `- [${v ? "x" : " "}] ${k}`),
    "",
    ...(usedDrafts.length > 0 ? usedDrafts : ["_No drafts saved._"]),
  ].join("\n");
}
