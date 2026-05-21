import { getWeekNumber, formatDate } from "@loopkit/shared";
import {
  readConfig,
  readBriefJson,
  readTasksFile,
  readShipLog,
  getConsecutiveWeeksStreak,
  listProjects,
  getLatestMRR,
  readRevenueHistory,
  readPulseResponses,
} from "../storage/local.js";
import { computeLoopKitScore } from "../analytics/score.js";
import { buildProofCard, buildTweetLine, copyToClipboard, buildTwitterIntentUrl, openUrl } from "../ui/proof-card.js";
import { colors, header, box, pass, info, clog, ceremonyIntro, ceremonyOutro, multiselect, isCancel } from "../ui/theme.js";
import { getConvexProjectId } from "../storage/sync.js";

// ─── ASCII Confetti ─────────────────────────────────────────────

const CONFETTI_CHARS = ["✦", "✧", "⋆", "˚", "·", "✵", "❋", "✺", "◆", "◇"];
const CONFETTI_COLORS = [
  colors.primary,
  colors.secondary,
  colors.success,
  colors.warning,
  colors.pink,
  colors.orange,
];

function confettiLine(width: number): string {
  let line = "";
  for (let i = 0; i < width; i++) {
    if (Math.random() > 0.6) {
      const char =
        CONFETTI_CHARS[Math.floor(Math.random() * CONFETTI_CHARS.length)];
      const color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      line += color(char);
    } else {
      line += " ";
    }
  }
  return line;
}

function renderConfetti(rows: number = 5, width: number = 50): string {
  let output = "";
  for (let i = 0; i < rows; i++) {
    output += confettiLine(width) + "\n";
  }
  return output;
}

// ─── Score Calculation ──────────────────────────────────────────

interface CelebrateScore {
  totalShipped: number;
  currentStreak: number;
  tasksDone: number;
  tasksTotal: number;
  completionRate: number;
  shippingScore: number;
}

function calculateScore(slug: string): CelebrateScore {
  const tasksContent = readTasksFile(slug);
  let tasksDone = 0;
  let tasksTotal = 0;

  if (tasksContent) {
    const lines = tasksContent.split("\n");
    for (const line of lines) {
      if (/^\s*-\s*\[x\]/i.test(line)) {
        tasksDone++;
        tasksTotal++;
      } else if (/^\s*-\s*\[ \]/.test(line)) {
        tasksTotal++;
      }
    }
  }

  const completionRate =
    tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const shippingScore = completionRate;

  const projects = listProjects();
  let totalShipped = 0;
  for (const project of projects) {
    const pTasks = readTasksFile(project);
    if (pTasks) {
      const done = pTasks
        .split("\n")
        .filter((l) => /^\s*-\s*\[x\]/i.test(l)).length;
      totalShipped += done;
    }
  }

  const weekNum = getWeekNumber();
  const pastStreak = getConsecutiveWeeksStreak(weekNum);
  const currentStreak = readShipLog() ? pastStreak + 1 : pastStreak;

  return {
    totalShipped,
    currentStreak,
    tasksDone,
    tasksTotal,
    completionRate,
    shippingScore,
  };
}

// ─── Shareable Text ─────────────────────────────────────────────

function buildShareText(
  productName: string,
  score: CelebrateScore,
  weekNum: number,
): string {
  return [
    `🚀 ${productName} — Week ${weekNum} Ship Report`,
    "",
    `  Tasks shipped: ${score.tasksDone}/${score.tasksTotal}`,
    `  Completion rate: ${score.completionRate}%`,
    `  Shipping streak: ${score.currentStreak} weeks 🔥`,
    `  Total tasks shipped: ${score.totalShipped}`,
    "",
    `  Built with @loopkit`,
  ].join("\n");
}

// ─── Rank Title ─────────────────────────────────────────────────

function getRank(score: number): { title: string; emoji: string } {
  if (score >= 90) return { title: "Shipping Machine", emoji: "🏆" };
  if (score >= 75) return { title: "Steady Builder", emoji: "🔥" };
  if (score >= 50) return { title: "Making Progress", emoji: "💪" };
  if (score >= 25) return { title: "Getting Started", emoji: "🌱" };
  return { title: "Week 1 Energy", emoji: "✨" };
}

// ─── Command ────────────────────────────────────────────────────

export async function celebrateCommand(
  standalone: boolean = true,
  options?: { share?: boolean },
): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (standalone) {
    ceremonyIntro("Celebrate");
  }

  if (!slug) {
    clog.error("No active project. Run `loopkit init` first.");
    process.exit(1);
  }

  const briefData = readBriefJson(slug);
  const productName = briefData?.answers.name || slug;

  // ─── Calculate score ──────────────────────────────────────────
  const score = calculateScore(slug);
  const weekNum = getWeekNumber();
  const rank = getRank(score.shippingScore);

  // ─── Confetti burst ───────────────────────────────────────────
  console.log(renderConfetti(4, 48));

  // ─── LoopKit Score™ (GF-1) ────────────────────────────────────
  const scoreBreakdown = computeLoopKitScore();
  const loopkitScore = scoreBreakdown?.score ?? null;

  // ─── Revenue (GF-4) ───────────────────────────────────────────
  const latestMRR = getLatestMRR();

  // ─── Celebration card ─────────────────────────────────────────
  const cardLines = [
    colors.success.bold(`${rank.emoji} YOU SHIPPED! ${rank.emoji}`),
    "",
    colors.white.bold(`  ${productName}`),
    colors.dim(`  Week ${weekNum} · ${formatDate()}`),
    "",
    `  ${colors.white("Rank:")} ${colors.primary.bold(rank.title)}`,
    "",
    `  ${colors.success("Tasks done:")} ${score.tasksDone}/${score.tasksTotal}`,
    `  ${colors.secondary("Completion:")} ${score.completionRate}%`,
    `  ${colors.warning("Streak:")} ${score.currentStreak} week${score.currentStreak !== 1 ? "s" : ""} ${score.currentStreak >= 3 ? "🔥" : ""}`,
    `  ${colors.primary("Total shipped:")} ${score.totalShipped} tasks`,
    ...(loopkitScore !== null ? [`  ${colors.secondary("LoopKit Score:")} ${colors.secondary.bold(`${loopkitScore}/100`)}`] : []),
    ...(latestMRR !== null && latestMRR > 0 ? [`  ${colors.success("MRR:")} ${colors.success.bold(`$${latestMRR}`)}`] : []),
  ];

  console.log(box(cardLines.join("\n"), "Ship Card"));

  console.log(renderConfetti(3, 48));

  // ─── Milestone callouts ───────────────────────────────────────
  if (score.currentStreak === 1) {
    clog.success("First week shipped — the hardest one!");
  }
  if (score.currentStreak === 4) {
    clog.success("🎯 4-week streak — you're building a habit!");
  }
  if (score.currentStreak === 12) {
    clog.success("🏅 12-week streak — quarterly operator!");
  }
  if (score.completionRate === 100 && score.tasksTotal > 0) {
    clog.success("💯 Perfect week — every task done!");
  }
  if (score.totalShipped >= 50) {
    clog.success("⚡ 50+ tasks shipped — veteran founder!");
  }

  // ─── Shareable Proof Card (GF-2) ────────────────────────────────
  const proofCardData = {
    productName,
    weekNum,
    shippingScore: score.shippingScore,
    tasksCompleted: score.tasksDone,
    tasksTotal: score.tasksTotal,
    streak: score.currentStreak,
    feedbackResponses: 0,
    loopkitScore,
    oneThing: "Keep shipping",
    mrr: latestMRR,
    currency: "USD",
  };

  const shareText = buildProofCard(proofCardData);
  const tweetLine = buildTweetLine(proofCardData);

  clog.step("Share");
  clog.message("Copy this to share your progress:");
  console.log(box(shareText));

  const shareActions = await multiselect({
    message: "Share this week's win (space to select):",
    options: [
      { value: "twitter", label: "Tweet on X — open twitter.com/intent/tweet" },
      { value: "copy",    label: "Copy tweet line to clipboard" },
    ],
    required: false,
  });

  if (!isCancel(shareActions) && Array.isArray(shareActions)) {
    if (shareActions.includes("twitter")) {
      const copied = await copyToClipboard(tweetLine);
      const twitterUrl = buildTwitterIntentUrl(tweetLine);
      await openUrl(twitterUrl);
      clog.success("Opened X/Twitter in browser!");
      if (copied) clog.message("  (Also copied to clipboard as fallback.)");
    }
    if (shareActions.includes("copy")) {
      const copied = await copyToClipboard(tweetLine);
      if (copied) clog.success("Tweet line copied to clipboard — paste and share!");
    }
  }

  // ─── Share to public wins feed (if --share flag) ─────────────────
  if (options?.share) {
    const convexProjectId = getConvexProjectId(slug);
    if (convexProjectId) {
      const pulseResponses = readPulseResponses();
      const feedbackCount = pulseResponses.length;
      
      // Build public win payload
      const publicWin = {
        projectId: convexProjectId,
        productName,
        weekNum,
        shippingScore: score.shippingScore,
        streak: score.currentStreak,
        tasksCompleted: score.tasksDone,
        tasksTotal: score.tasksTotal,
        feedbackCount,
        loopkitScore,
        mrr: latestMRR,
        oneThing: "Keep shipping",
      };

      // Sync to Convex
      const { pushPublicWinToConvex } = await import("../storage/sync.js");
      await pushPublicWinToConvex(publicWin);
      clog.info("Win posted to public feed at loopkit.dev/wins");
    } else {
      clog.warn("Not authenticated — win not posted to public feed. Run `loopkit auth` to enable sharing.");
    }
  }

  // ─── What's next ──────────────────────────────────────────────
  clog.step("What's Next");
  clog.info("Run `loopkit loop` to synthesize your week");
  clog.info("Or `loopkit track` to plan next week's tasks");

  if (standalone) {
    ceremonyOutro("Keep shipping. 🚀");
  }
}
