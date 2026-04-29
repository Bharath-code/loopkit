import * as p from "@clack/prompts";
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
import { buildProofCard, buildTweetLine, copyToClipboard } from "../ui/proof-card.js";
import { colors, header, box, pass, info } from "../ui/theme.js";
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
    p.intro(colors.primary.bold("LoopKit — Celebrate"));
  }

  if (!slug) {
    console.log(colors.danger("No active project. Run `loopkit init` first."));
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
    console.log(pass("First week shipped — the hardest one!"));
  }
  if (score.currentStreak === 4) {
    console.log(
      colors.primary.bold("  🎯 4-week streak — you're building a habit!"),
    );
  }
  if (score.currentStreak === 12) {
    console.log(
      colors.primary.bold("  🏅 12-week streak — quarterly operator!"),
    );
  }
  if (score.completionRate === 100 && score.tasksTotal > 0) {
    console.log(colors.success.bold("  💯 Perfect week — every task done!"));
  }
  if (score.totalShipped >= 50) {
    console.log(
      colors.secondary.bold("  ⚡ 50+ tasks shipped — veteran founder!"),
    );
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

  console.log(header("Share"));
  console.log(colors.dim("  Copy this to share your progress:"));
  console.log(box(shareText));
  console.log(colors.dim(`  Tweet: ${tweetLine}`));

  // Auto-copy to clipboard on macOS
  const copied = await copyToClipboard(tweetLine);
  if (copied) {
    console.log(pass("Tweet line copied to clipboard — paste and share!"));
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
      console.log(info("Win posted to public feed at loopkit.dev/wins"));
    } else {
      console.log(colors.warning("Not authenticated — win not posted to public feed. Run `loopkit auth` to enable sharing."));
    }
  }

  // ─── What's next ──────────────────────────────────────────────
  console.log(header("What's Next"));
  console.log(info("Run `loopkit loop` to synthesize your week"));
  console.log(info("Or `loopkit track` to plan next week's tasks"));

  if (standalone) {
    p.outro(colors.success.bold("Keep shipping. 🚀"));
  }
}
